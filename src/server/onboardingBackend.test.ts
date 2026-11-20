import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError, SupabaseServerStore, hashInvitationToken } from './onboardingBackend.ts';
import type { HrUserProfile } from '../shared/types.ts';

type Row = Record<string, unknown>;

interface StorageEntry {
  size: number;
  contentType: string;
}

class InMemorySupabaseMock {
  tables: Record<string, Row[]> = {
    hr_admin_users: [],
    onboarding_invitations: [],
    onboarding_form_responses: [],
    onboarding_documents: [],
    hr_office_use_entries: [],
    onboarding_audit_logs: [],
  };

  authUsers = new Map<string, { id: string; email: string }>();
  storageObjects = new Map<string, StorageEntry>();
  failNextStorageRemove = false;
  queryLog: Array<{ table: string; op: string }> = [];

  auth = {
    getUser: async (jwt: string) => {
      const user = this.authUsers.get(jwt);
      if (!user) return { data: { user: null }, error: { message: 'Invalid JWT' } };
      return { data: { user }, error: null };
    },
  };

  storage = {
    from: (_bucket: string) => ({
      createSignedUploadUrl: async (storagePath: string) => ({
        data: {
          signedUrl: `https://storage.test/upload/${storagePath}`,
          token: 'signed-upload-token',
          path: storagePath,
        },
        error: null,
      }),
      info: async (storagePath: string) => {
        const entry = this.storageObjects.get(storagePath);
        if (!entry) {
          return { data: null, error: { message: 'Object not found' } };
        }
        return {
          data: {
            id: crypto.randomUUID(),
            version: '1',
            name: storagePath.split('/').pop() || '',
            bucketId: 'dics-onboarding-documents',
            createdAt: new Date().toISOString(),
            size: entry.size,
            contentType: entry.contentType,
          },
          error: null,
        };
      },
      remove: async (paths: string[]) => {
        if (this.failNextStorageRemove) {
          this.failNextStorageRemove = false;
          return { data: null, error: { message: 'Storage service unavailable' } };
        }
        for (const p of paths) {
          this.storageObjects.delete(p);
        }
        return { data: paths, error: null };
      },
      createSignedUrl: async (storagePath: string) => ({
        data: { signedUrl: `https://storage.test/download/${storagePath}` },
        error: null,
      }),
      download: async (storagePath: string) => {
        if (!this.storageObjects.has(storagePath)) {
          return { data: null, error: { message: 'Not found' } };
        }
        return {
          data: new Blob(
            [
              Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAADklEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
                'base64'
              ),
            ],
            { type: 'image/png' }
          ),
          error: null,
        };
      },
    }),
  };

  from(table: string) {
    const self = this;
    const rows = this.tables[table];
    if (!rows) throw new Error(`Unknown table ${table}`);

    let op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
    let payload: Row | null = null;
    let onConflictCols: string[] = [];
    const filters: Array<(r: Row) => boolean> = [];
    let orderCol: string | null = null;
    let orderAsc = true;
    let maxRows: number | null = null;

    const execute = async (mode: 'many' | 'single' | 'maybeSingle') => {
      self.queryLog.push({ table, op });

      if (op === 'insert' && payload) {
        const created: Row = {
          id: (payload.id as string) || crypto.randomUUID(),
          created_at: (payload.created_at as string) || new Date().toISOString(),
          uploaded_at: (payload.uploaded_at as string) || new Date().toISOString(),
          ...payload,
        };
        rows.push(created);
        return { data: mode === 'many' ? [created] : created, error: null };
      }

      if (op === 'upsert' && payload) {
        const conflictKeys = onConflictCols.length > 0 ? onConflictCols : ['invitation_id'];
        const existingIndex = rows.findIndex((r) =>
          conflictKeys.every((k) => r[k] === payload![k])
        );
        if (existingIndex >= 0) {
          rows[existingIndex] = { ...rows[existingIndex], ...payload };
          const updated = rows[existingIndex];
          return { data: mode === 'many' ? [updated] : updated, error: null };
        }
        const created = { id: crypto.randomUUID(), ...payload };
        rows.push(created);
        return { data: mode === 'many' ? [created] : created, error: null };
      }

      const matched = rows.filter((r) => filters.every((fn) => fn(r)));

      if (op === 'update' && payload) {
        for (const r of matched) {
          Object.assign(r, payload);
        }
        if (mode === 'maybeSingle') return { data: matched[0] ?? null, error: null };
        if (mode === 'single') return { data: matched[0] ?? null, error: matched[0] ? null : { message: 'Not found' } };
        return { data: matched, error: null };
      }

      if (op === 'delete') {
        const keep = rows.filter((r) => !filters.every((fn) => fn(r)));
        self.tables[table] = keep;
        return { data: matched, error: null };
      }

      let out = [...matched];
      if (orderCol) {
        out.sort((a, b) => {
          const av = String(a[orderCol!] ?? '');
          const bv = String(b[orderCol!] ?? '');
          return orderAsc ? av.localeCompare(bv) : bv.localeCompare(av);
        });
      }
      if (maxRows !== null) {
        out = out.slice(0, maxRows);
      }
      if (mode === 'maybeSingle') return { data: out[0] ?? null, error: null };
      if (mode === 'single') return { data: out[0] ?? null, error: out[0] ? null : { message: 'Not found' } };
      return { data: out, error: null };
    };

    const builder: Record<string, unknown> = {
      select: () => builder,
      insert: (data: Row) => {
        op = 'insert';
        payload = data;
        return builder;
      },
      update: (data: Row) => {
        op = 'update';
        payload = data;
        return builder;
      },
      upsert: (data: Row, opts?: { onConflict?: string }) => {
        op = 'upsert';
        payload = data;
        onConflictCols = opts?.onConflict ? opts.onConflict.split(',') : [];
        return builder;
      },
      delete: () => {
        op = 'delete';
        return builder;
      },
      eq: (col: string, val: unknown) => {
        filters.push((r) => r[col] === val);
        return builder;
      },
      is: (col: string, val: unknown) => {
        filters.push((r) => (r[col] ?? null) === val);
        return builder;
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        orderCol = col;
        orderAsc = opts?.ascending ?? true;
        return builder;
      },
      limit: (n: number) => {
        maxRows = n;
        return builder;
      },
      maybeSingle: () => execute('maybeSingle'),
      single: () => execute('single'),
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        execute('many').then(resolve, reject),
    };
    return builder;
  }

  asSupabaseClient(): SupabaseClient {
    return this as unknown as SupabaseClient;
  }
}

const HR_ADMIN_USER: HrUserProfile = {
  userId: '00000000-0000-4000-8000-000000000001',
  email: 'hr@dicsglobal.com',
  fullName: 'HR Admin',
  role: 'hr_admin',
};

const HR_REVIEWER_USER: HrUserProfile = {
  userId: '00000000-0000-4000-8000-000000000002',
  email: 'reviewer@dicsglobal.com',
  fullName: 'HR Reviewer',
  role: 'hr_reviewer',
};

test('SupabaseServerStore.verifyHrBearerToken rejects unknown roles instead of failing open to hr_admin', async () => {
  const db = new InMemorySupabaseMock();
  db.authUsers.set('jwt-unknown-role', { id: 'u-unknown', email: 'x@dicsglobal.com' });
  db.authUsers.set('jwt-inactive', { id: 'u-inactive', email: 'y@dicsglobal.com' });
  db.authUsers.set('jwt-reviewer', { id: 'u-rev', email: 'rev@dicsglobal.com' });
  db.tables.hr_admin_users.push(
    { user_id: 'u-unknown', email: 'x@dicsglobal.com', role: 'superadmin', is_active: true },
    { user_id: 'u-inactive', email: 'y@dicsglobal.com', role: 'hr_admin', is_active: false },
    { user_id: 'u-rev', email: 'rev@dicsglobal.com', role: 'hr_reviewer', is_active: true }
  );

  const store = new SupabaseServerStore(db.asSupabaseClient(), 'dics-onboarding-documents');

  await assert.rejects(
    () => store.verifyHrBearerToken('jwt-unknown-role'),
    (err: unknown) => err instanceof HttpError && err.statusCode === 403
  );
  await assert.rejects(
    () => store.verifyHrBearerToken('jwt-inactive'),
    (err: unknown) => err instanceof HttpError && err.statusCode === 403
  );
  const rev = await store.verifyHrBearerToken('jwt-reviewer');
  assert.equal(rev.role, 'hr_reviewer');
});

test('SupabaseServerStore enforces hr_admin role in backend methods as defense in depth', async () => {
  const db = new InMemorySupabaseMock();
  const store = new SupabaseServerStore(db.asSupabaseClient(), 'dics-onboarding-documents');

  await assert.rejects(
    () =>
      store.createInvitation(HR_REVIEWER_USER, {
        referenceLabel: 'Test',
        department: 'Engineering',
        targetRole: 'Engineer',
        expiryDays: 7,
      }),
    (err: unknown) => err instanceof HttpError && err.statusCode === 403
  );
  await assert.rejects(
    () => store.expireInvitation(HR_REVIEWER_USER, '00000000-0000-4000-8000-000000000099'),
    (err: unknown) => err instanceof HttpError && err.statusCode === 403
  );
  await assert.rejects(
    () =>
      store.saveOfficeUseEntry(
        HR_REVIEWER_USER,
        '00000000-0000-4000-8000-000000000099',
        { form01SelectionStatus: 'Selected' }
      ),
    (err: unknown) => err instanceof HttpError && err.statusCode === 403
  );
  await assert.rejects(
    () =>
      store.getAdminSignedDownloadUrl(
        HR_REVIEWER_USER,
        '00000000-0000-4000-8000-000000000099'
      ),
    (err: unknown) => err instanceof HttpError && err.statusCode === 403
  );
  await assert.rejects(
    () =>
      store.exportSubmissionFormPdf(
        HR_REVIEWER_USER,
        '00000000-0000-4000-8000-000000000099',
        'form-01'
      ),
    (err: unknown) => err instanceof HttpError && err.statusCode === 403
  );
  await assert.rejects(
    () =>
      store.exportSubmissionFormsZip(
        HR_REVIEWER_USER,
        '00000000-0000-4000-8000-000000000099'
      ),
    (err: unknown) => err instanceof HttpError && err.statusCode === 403
  );
});

test('SupabaseServerStore exports individual filled PDFs and 9-PDF ZIP for hr_admin with photo loading and clean audit logs', async () => {
  const db = new InMemorySupabaseMock();
  const store = new SupabaseServerStore(db.asSupabaseClient(), 'dics-onboarding-documents');

  const created = await store.createInvitation(HR_ADMIN_USER, {
    referenceLabel: 'TEST-EMPLOYEE-001',
    department: 'Automation Engineering',
    targetRole: 'Senior Engineer',
    expiryDays: 14,
  });

  const signedPhoto = await store.createSignedDocumentUploadUrl(created.token, {
    slotId: 'upload-slot-photograph',
    fileName: 'passport-photo.png',
    mimeType: 'image/png',
    sizeBytes: 68,
  });
  db.storageObjects.set(signedPhoto.storagePath, { size: 68, contentType: 'image/png' });
  await store.recordUploadedDocument(created.token, {
    slotId: 'upload-slot-photograph',
    fileName: 'passport-photo.png',
    mimeType: 'image/png',
    sizeBytes: 68,
    storagePath: signedPhoto.storagePath,
  });

  await store.saveOfficeUseEntry(HR_ADMIN_USER, created.id, {
    form01SelectionStatus: 'Selected',
    form03EmpNo: 'DICS-EMP-001',
    markVerified: true,
  });

  const singleExport = await store.exportSubmissionFormPdf(HR_ADMIN_USER, created.id, 'form-01');
  assert.equal(Buffer.from(singleExport.pdfBytes.slice(0, 5)).toString('ascii'), '%PDF-');
  assert.equal(singleExport.fileName, 'DICS-HR-01_Bio-Data_Form.pdf');

  const zipExport = await store.exportSubmissionFormsZip(HR_ADMIN_USER, created.id);
  assert.equal(Buffer.from(zipExport.zipBytes.slice(0, 2)).toString('ascii'), 'PK');
  assert.equal(zipExport.fileName, 'DICS-Onboarding-Forms-TEST-EMPLOYEE-001.zip');

  assert.ok(
    db.tables.onboarding_audit_logs.some(
      (l) => l.action === 'FORM_PDF_EXPORTED' && l.invitation_id === created.id
    )
  );
  assert.ok(
    db.tables.onboarding_audit_logs.some(
      (l) => l.action === 'ALL_FORMS_ZIP_EXPORTED' && l.invitation_id === created.id
    )
  );
  assert.equal(JSON.stringify(db.tables.onboarding_audit_logs).includes(created.token), false);
});

test('SupabaseServerStore stores SHA-256 token hashes only, returns raw token once, and never logs raw tokens', async () => {
  const db = new InMemorySupabaseMock();
  const store = new SupabaseServerStore(db.asSupabaseClient(), 'dics-onboarding-documents');

  const created = await store.createInvitation(HR_ADMIN_USER, {
    referenceLabel: 'Hashed Token Batch',
    department: 'Instrumentation & Controls',
    targetRole: 'Engineer',
    expiryDays: 14,
  });

  // Returned once on creation
  assert.match(created.token, /^dics-[0-9a-f]{48}$/);
  assert.equal(created.invitePath, `/onboard/${created.token}`);
  assert.ok(created.tokenHint?.startsWith('dics-••••'));

  // Persisted row contains SHA-256 hash and NO plaintext token
  const storedRow = db.tables.onboarding_invitations[0];
  assert.equal(storedRow.token, null);
  assert.equal(storedRow.token_hash, hashInvitationToken(created.token));

  // Subsequent listInvitations() NEVER leaks the raw token
  const listed = await store.listInvitations();
  assert.equal(listed.length, 1);
  assert.equal(listed[0].token, '');
  assert.equal(listed[0].invitePath, '');
  assert.equal(listed[0].tokenHint, created.tokenHint);

  // Employee session hydration resolves via hash and never logs raw token in audit logs
  await store.saveFinalDeclaration(created.token, true);
  const signed = await store.createSignedDocumentUploadUrl(created.token, {
    slotId: 'upload-slot-kyc-id',
    fileName: 'pan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
  });
  assert.ok(signed.storagePath.startsWith(`onboarding/${created.id}/upload-slot-kyc-id/`));
  assert.equal(signed.storagePath.includes(created.token), false);

  db.storageObjects.set(signed.storagePath, { size: 1024, contentType: 'application/pdf' });
  await store.recordUploadedDocument(created.token, {
    slotId: 'upload-slot-kyc-id',
    fileName: 'pan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    storagePath: signed.storagePath,
  });

  // Audit logs must NEVER contain raw bearer token
  const serializedLogs = JSON.stringify(db.tables.onboarding_audit_logs);
  assert.equal(serializedLogs.includes(created.token), false);
  assert.ok(
    db.tables.onboarding_audit_logs.some(
      (l) => l.action === 'DOCUMENT_UPLOADED' && l.actor_id === `employee:${created.id}`
    )
  );
});

test('SupabaseServerStore preserves legacy 24-hex invitations via backfilled hash AND dual-read plaintext fallback', async () => {
  const db = new InMemorySupabaseMock();
  const store = new SupabaseServerStore(db.asSupabaseClient(), 'dics-onboarding-documents');

  const legacyTokenBackfilled = 'dics-abcdef1234567890abcdef12';
  const legacyTokenUnmigrated = 'dics-1234567890abcdef12345678';
  const futureExpiry = new Date(Date.now() + 7 * 86400_000).toISOString();

  db.tables.onboarding_invitations.push(
    {
      id: '00000000-0000-4000-8000-000000000101',
      token: null,
      token_hash: hashInvitationToken(legacyTokenBackfilled),
      token_hint: 'dics-••••ef12',
      reference_label: 'Migrated Legacy Link',
      department: 'Engineering',
      target_role: 'Engineer',
      status: 'active',
      submission_state: 'not_submitted',
      created_at: new Date().toISOString(),
      expires_at: futureExpiry,
    },
    {
      id: '00000000-0000-4000-8000-000000000102',
      token: legacyTokenUnmigrated,
      token_hash: null,
      token_hint: '',
      reference_label: 'Pre-Backfill Legacy Link',
      department: 'Engineering',
      target_role: 'Engineer',
      status: 'active',
      submission_state: 'not_submitted',
      created_at: new Date().toISOString(),
      expires_at: futureExpiry,
    }
  );

  const sessionA = await store.getSessionByToken(legacyTokenBackfilled);
  assert.equal(sessionA.invitation.referenceLabel, 'Migrated Legacy Link');

  // Dual-read resolves pre-backfill legacy token and upgrades it to SHA-256 hash
  const sessionB = await store.getSessionByToken(legacyTokenUnmigrated);
  assert.equal(sessionB.invitation.referenceLabel, 'Pre-Backfill Legacy Link');
  const upgradedRow = db.tables.onboarding_invitations.find(
    (r) => r.id === '00000000-0000-4000-8000-000000000102'
  );
  assert.equal(upgradedRow?.token, null);
  assert.equal(upgradedRow?.token_hash, hashInvitationToken(legacyTokenUnmigrated));
});

test('SupabaseServerStore validates token format before DB queries, isolates cross-employee documents, and aborts DB delete on storage failure', async () => {
  const db = new InMemorySupabaseMock();
  const store = new SupabaseServerStore(db.asSupabaseClient(), 'dics-onboarding-documents');

  // Invalid token format rejected BEFORE any database query
  await assert.rejects(
    () => store.getSessionByToken('not-a-valid-token'),
    (err: unknown) => err instanceof HttpError && err.statusCode === 400 && err.code === 'INVALID_TOKEN_FORMAT'
  );
  assert.equal(db.queryLog.length, 0);

  const invA = await store.createInvitation(HR_ADMIN_USER, {
    referenceLabel: 'Emp A',
    department: 'Engineering',
    targetRole: 'Engineer',
    expiryDays: 7,
  });
  const invB = await store.createInvitation(HR_ADMIN_USER, {
    referenceLabel: 'Emp B',
    department: 'Engineering',
    targetRole: 'Engineer',
    expiryDays: 7,
  });

  const signedB = await store.createSignedDocumentUploadUrl(invB.token, {
    slotId: 'upload-slot-kyc-id',
    fileName: 'b-pan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2048,
  });
  db.storageObjects.set(signedB.storagePath, { size: 2048, contentType: 'application/pdf' });
  const docB = await store.recordUploadedDocument(invB.token, {
    slotId: 'upload-slot-kyc-id',
    fileName: 'b-pan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2048,
    storagePath: signedB.storagePath,
  });

  // Employee A cannot delete Employee B's document ID
  await assert.rejects(
    () => store.deleteUploadedDocument(invA.token, docB.id),
    (err: unknown) => err instanceof HttpError && err.statusCode === 404
  );
  assert.equal(db.tables.onboarding_documents.length, 1);

  // Storage deletion failure aborts metadata deletion
  db.failNextStorageRemove = true;
  await assert.rejects(
    () => store.deleteUploadedDocument(invB.token, docB.id),
    (err: unknown) => err instanceof HttpError && err.statusCode === 502 && err.code === 'STORAGE_DELETE_ERROR'
  );
  assert.equal(db.tables.onboarding_documents.length, 1);
});

test('SupabaseServerStore verifies authoritative Storage metadata and rejects fake upload metadata', async () => {
  const db = new InMemorySupabaseMock();
  const store = new SupabaseServerStore(db.asSupabaseClient(), 'dics-onboarding-documents');

  const inv = await store.createInvitation(HR_ADMIN_USER, {
    referenceLabel: 'Upload Test',
    department: 'Engineering',
    targetRole: 'Engineer',
    expiryDays: 7,
  });

  // 1. Mismatched extension vs MIME rejected at signed-URL issuance
  await assert.rejects(
    () =>
      store.createSignedDocumentUploadUrl(inv.token, {
        slotId: 'upload-slot-kyc-id',
        fileName: 'payload.exe',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      }),
    (err: unknown) => err instanceof HttpError && err.statusCode === 400
  );

  const signed = await store.createSignedDocumentUploadUrl(inv.token, {
    slotId: 'upload-slot-kyc-id',
    fileName: 'kyc.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 4096,
  });

  // 2. Recording metadata when object does not exist in Storage fails
  await assert.rejects(
    () =>
      store.recordUploadedDocument(inv.token, {
        slotId: 'upload-slot-kyc-id',
        fileName: 'kyc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 4096,
        storagePath: signed.storagePath,
      }),
    (err: unknown) => err instanceof HttpError && err.statusCode === 400 && err.code === 'STORAGE_OBJECT_NOT_FOUND'
  );

  // 3. Disallowed content-type in Storage is removed & rejected even if client claims application/pdf
  db.storageObjects.set(signed.storagePath, { size: 4096, contentType: 'text/html' });
  await assert.rejects(
    () =>
      store.recordUploadedDocument(inv.token, {
        slotId: 'upload-slot-kyc-id',
        fileName: 'kyc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 4096,
        storagePath: signed.storagePath,
      }),
    (err: unknown) => err instanceof HttpError && err.statusCode === 400
  );
  assert.equal(db.storageObjects.has(signed.storagePath), false);

  // 4. Client lying about size/MIME (metadata mismatch) is rejected
  db.storageObjects.set(signed.storagePath, { size: 5000, contentType: 'application/pdf' });
  await assert.rejects(
    () =>
      store.recordUploadedDocument(inv.token, {
        slotId: 'upload-slot-kyc-id',
        fileName: 'kyc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 100,
        storagePath: signed.storagePath,
      }),
    (err: unknown) => err instanceof HttpError && err.statusCode === 400 && err.code === 'METADATA_MISMATCH'
  );

  // 5. Omitting client size/MIME uses authoritative Storage metadata cleanly
  const recorded = await store.recordUploadedDocument(inv.token, {
    slotId: 'upload-slot-kyc-id',
    fileName: 'kyc.pdf',
    storagePath: signed.storagePath,
  });
  assert.equal(recorded.sizeBytes, 5000);
  assert.equal(recorded.mimeType, 'application/pdf');
});

test('Migration 0004 enforces DB-level audit log immutability, Office Use split policies, HR provisioning lock, and storage restriction', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/202611180004_security_hardening.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /prevent_onboarding_audit_log_mutation/i);
  assert.match(sql, /before update or delete on public\.onboarding_audit_logs/i);
  assert.match(sql, /before truncate on public\.onboarding_audit_logs/i);
  assert.match(sql, /on delete restrict/i);
  assert.match(sql, /revoke update, delete, truncate on public\.onboarding_audit_logs/i);
  assert.match(sql, /grant select, insert on public\.onboarding_audit_logs to service_role/i);
  assert.match(sql, /drop policy if exists "hr_admin_upsert_office_use"/i);
  assert.match(sql, /create policy "hr_admin_insert_office_use"/i);
  assert.match(sql, /create policy "hr_admin_update_office_use"/i);
  assert.match(sql, /revoke insert, update, delete, truncate on public\.hr_admin_users/i);
  assert.match(sql, /drop policy if exists "hr_admin_read_onboarding_storage" on storage\.objects/i);
  assert.match(sql, /set search_path = public/i);
});
