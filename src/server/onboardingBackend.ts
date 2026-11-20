import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DOCUMENT_UPLOAD_CATEGORIES, HR_FORMS_CATALOG } from '../shared/formsCatalog.ts';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  calculateOnboardingProgress,
  createEmptyOfficeUseEntry,
  createInitialFormResponses,
  doesExtensionMatchMimeType,
  extractFileExtension,
  formatInvitationTokenHint,
  generateInvitationToken,
  generateSubmissionReceiptCode,
  getEffectiveInvitationStatus,
  isInvitationAccessible,
  isValidInvitationTokenFormat,
  isValidUuid,
  MAX_DOCUMENT_SIZE_BYTES,
  sanitizeFileName,
  validateDocumentFile,
  validateFormCompletion,
  validateInvitationInput,
} from '../shared/onboardingLogic.ts';
import {
  buildAllNineOriginalFormsZip,
  buildFilledOriginalFormPdf,
  buildOnboardingFormsZipFileName,
  getOriginalFormPdfFileName,
  ORIGINAL_FORM_PDF_BY_ID,
  ORIGINAL_FORM_PDF_DESCRIPTORS,
  pickPhotographDocumentForForm,
  type OnboardingPdfPhotoAssets,
  type PhotoImageAsset,
} from '../shared/onboardingPdfGenerator.ts';
import type {
  AnyFormId,
  AuditLogEntry,
  HRFormDefinition,
  HrOfficeUseEntry,
  HrSubmissionDetail,
  HrSubmissionSummary,
  HrUserProfile,
  OnboardingFormResponses,
  OnboardingInvitation,
  OnboardingSessionHydration,
  SignedDownloadUrlResponse,
  SignedUploadUrlResponse,
  SubmissionState,
  UploadedDocumentItem,
} from '../shared/types.ts';

export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, message: string, code = 'REQUEST_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function hashInvitationToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export interface OnboardingDataStore {
  verifyHrBearerToken(bearerToken: string): Promise<HrUserProfile>;
  listForms(): Promise<HRFormDefinition[]>;
  listInvitations(): Promise<OnboardingInvitation[]>;
  createInvitation(
    adminUser: HrUserProfile,
    input: {
      referenceLabel: string;
      department: string;
      targetRole: string;
      expiryDays: number;
    }
  ): Promise<OnboardingInvitation>;
  expireInvitation(adminUser: HrUserProfile, id: string): Promise<OnboardingInvitation>;
  listSubmissions(): Promise<HrSubmissionSummary[]>;
  getSubmissionDetail(invitationId: string): Promise<HrSubmissionDetail>;
  saveOfficeUseEntry(
    adminUser: HrUserProfile,
    invitationId: string,
    patch: Partial<HrOfficeUseEntry> & { markVerified?: boolean }
  ): Promise<HrOfficeUseEntry>;
  getAdminSignedDownloadUrl(
    adminUser: HrUserProfile,
    documentId: string
  ): Promise<SignedDownloadUrlResponse>;
  exportSubmissionFormPdf(
    adminUser: HrUserProfile,
    invitationId: string,
    formId: AnyFormId
  ): Promise<{ pdfBytes: Uint8Array; fileName: string }>;
  exportSubmissionFormsZip(
    adminUser: HrUserProfile,
    invitationId: string
  ): Promise<{ zipBytes: Uint8Array; fileName: string }>;
  getSessionByToken(token: string): Promise<OnboardingSessionHydration>;
  saveFormResponse(
    token: string,
    formId: AnyFormId,
    payload: OnboardingFormResponses[AnyFormId]
  ): Promise<{ formId: AnyFormId; isCompleted: boolean; updatedAt: string }>;
  saveFinalDeclaration(token: string, accepted: boolean): Promise<{ accepted: boolean }>;
  createSignedDocumentUploadUrl(
    token: string,
    input: { slotId: string; fileName: string; mimeType: string; sizeBytes: number }
  ): Promise<SignedUploadUrlResponse>;
  recordUploadedDocument(
    token: string,
    input: {
      slotId: string;
      slotLabel?: string;
      fileName: string;
      mimeType?: string;
      sizeBytes?: number;
      storagePath: string;
    }
  ): Promise<UploadedDocumentItem>;
  deleteUploadedDocument(token: string, documentId: string): Promise<void>;
  submitOnboardingPacket(
    token: string,
    finalDeclarationAccepted: boolean
  ): Promise<{ receiptCode: string; submittedAt: string; message: string }>;
}

const VALID_FORM_IDS = new Set<string>(HR_FORMS_CATALOG.map((f) => f.id));
const VALID_UPLOAD_SLOTS = new Map<string, string>(
  DOCUMENT_UPLOAD_CATEGORIES.map((c) => [c.slotId, c.label])
);
VALID_UPLOAD_SLOTS.set('general', 'General Supporting Document');

interface InvitationRow {
  id: string;
  token?: string | null;
  token_hash?: string | null;
  token_hint?: string | null;
  reference_label: string;
  department: string;
  target_role: string;
  status: string;
  submission_state?: string | null;
  final_declaration_accepted?: boolean | null;
  receipt_code?: string | null;
  created_at: string;
  expires_at: string;
  submitted_at?: string | null;
}

interface FormResponseRow {
  form_id: string;
  payload: Record<string, unknown>;
  is_completed: boolean;
  updated_at: string;
}

interface DocumentRow {
  id: string;
  invitation_id: string;
  slot_id: string;
  slot_label?: string | null;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_bucket: string;
  storage_path: string;
  uploaded_at: string;
}

function mapInvitationRow(
  row: InvitationRow,
  nowIso: string,
  options: { oneTimeRawToken?: string } = {}
): OnboardingInvitation {
  const baseStatus = row.status === 'expired' ? 'expired' : 'active';
  const effectiveStatus = getEffectiveInvitationStatus(
    { status: baseStatus, expiresAt: row.expires_at },
    nowIso
  );
  const subState = (row.submission_state || 'not_submitted') as SubmissionState;
  const rawToken = options.oneTimeRawToken ?? '';
  const hint =
    row.token_hint ||
    (rawToken ? formatInvitationTokenHint(rawToken) : '') ||
    (row.token ? formatInvitationTokenHint(row.token) : 'SHA-256 protected');

  return {
    id: row.id,
    token: rawToken,
    tokenHint: hint,
    referenceLabel: row.reference_label,
    department: row.department,
    targetRole: row.target_role,
    status: effectiveStatus,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    submittedAt: row.submitted_at ?? null,
    receiptCode: row.receipt_code ?? null,
    invitePath: rawToken ? `/onboard/${rawToken}` : '',
    submissionState: subState,
  };
}

function mapDocumentRow(row: DocumentRow): UploadedDocumentItem {
  return {
    id: row.id,
    slotId: row.slot_id,
    slotLabel: row.slot_label || row.slot_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    storageBucketPath: row.storage_path,
    uploadedAt: row.uploaded_at,
    storageMode: 'supabase_private_storage',
  };
}

function hydrateResponses(rows: FormResponseRow[]): OnboardingFormResponses {
  const merged = createInitialFormResponses();
  const mutable = merged as unknown as Record<string, Record<string, unknown>>;
  for (const row of rows) {
    if (!VALID_FORM_IDS.has(row.form_id)) continue;
    mutable[row.form_id] = {
      ...mutable[row.form_id],
      ...row.payload,
      updatedAt: row.updated_at,
    };
  }
  return merged;
}

export class SupabaseServerStore implements OnboardingDataStore {
  private readonly adminClient: SupabaseClient;
  private readonly storageBucket: string;
  private readonly templateCache = new Map<AnyFormId, Uint8Array>();

  constructor(adminClient: SupabaseClient, storageBucket: string) {
    this.adminClient = adminClient;
    this.storageBucket = storageBucket;
  }

  private async loadOriginalTemplateBytes(formId: AnyFormId): Promise<Uint8Array> {
    const cached = this.templateCache.get(formId);
    if (cached) return cached;

    const desc = ORIGINAL_FORM_PDF_BY_ID[formId];
    if (!desc) {
      throw new HttpError(400, 'Invalid onboarding form identifier.', 'INVALID_FORM_ID');
    }

    const candidatePaths = [
      path.resolve(process.cwd(), 'public/assets/aistudio', desc.templateFile),
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../public/assets/aistudio',
        desc.templateFile
      ),
    ];

    for (const templatePath of candidatePaths) {
      try {
        const buf = await fs.readFile(templatePath);
        const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
        this.templateCache.set(formId, bytes);
        return bytes;
      } catch {
        // Try next candidate path
      }
    }

    throw new HttpError(
      500,
      `Original PDF template for ${desc.code} is unavailable on the server.`,
      'TEMPLATE_MISSING'
    );
  }

  private async downloadPhotoAssetForDoc(
    invitationId: string,
    doc: UploadedDocumentItem | null
  ): Promise<PhotoImageAsset | null> {
    if (!doc) return null;
    try {
      const { data: row, error } = await this.adminClient
        .from('onboarding_documents')
        .select('storage_bucket, storage_path, mime_type')
        .eq('id', doc.id)
        .eq('invitation_id', invitationId)
        .maybeSingle();

      if (error || !row || !row.storage_path) return null;

      const bucket = row.storage_bucket || this.storageBucket;
      const storageFrom = this.adminClient.storage.from(bucket) as unknown as {
        download?: (storagePath: string) => Promise<{ data: Blob | Uint8Array | null; error: unknown }>;
      };
      if (typeof storageFrom.download !== 'function') return null;

      const { data: downloaded, error: dlErr } = await storageFrom.download(row.storage_path);
      if (dlErr || !downloaded) return null;

      let bytes: Uint8Array | null = null;
      if (downloaded instanceof Uint8Array) {
        bytes = downloaded;
      } else if (typeof (downloaded as Blob).arrayBuffer === 'function') {
        bytes = new Uint8Array(await (downloaded as Blob).arrayBuffer());
      }
      if (!bytes || bytes.length === 0) return null;

      return {
        bytes,
        mimeType: row.mime_type || doc.mimeType,
      };
    } catch {
      return null;
    }
  }

  private async resolvePhotoAssetsForSubmission(
    detail: HrSubmissionDetail
  ): Promise<OnboardingPdfPhotoAssets> {
    const form01Doc = pickPhotographDocumentForForm(
      detail.uploadedDocuments,
      detail.formResponses['form-01'].photoFileName
    );
    const form06Doc = pickPhotographDocumentForForm(detail.uploadedDocuments, '');

    if (!form01Doc && !form06Doc) {
      return {};
    }

    const form01Photo = await this.downloadPhotoAssetForDoc(detail.invitation.id, form01Doc);
    const form06Photo =
      form06Doc && form06Doc.id === form01Doc?.id
        ? form01Photo
        : await this.downloadPhotoAssetForDoc(detail.invitation.id, form06Doc);

    return { form01Photo, form06Photo };
  }

  private async writeAuditLog(entry: {
    invitationId: string | null;
    actorType: 'employee' | 'hr_admin' | 'system';
    actorId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.adminClient.from('onboarding_audit_logs').insert({
      invitation_id: entry.invitationId,
      actor_type: entry.actorType,
      actor_id: entry.actorId,
      action: entry.action,
      metadata: entry.metadata ?? {},
    });
  }

  private resolveValidatedSlot(slotId: string): { slotId: string; slotLabel: string } {
    const cleanSlot = (slotId || 'general').trim();
    const label = VALID_UPLOAD_SLOTS.get(cleanSlot);
    if (!label) {
      throw new HttpError(400, 'Invalid document upload slot identifier.', 'INVALID_SLOT');
    }
    return { slotId: cleanSlot, slotLabel: label };
  }

  private async requireAccessibleInvitation(
    token: string,
    options: { requireUnlocked?: boolean } = {}
  ): Promise<{ row: InvitationRow; invitation: OnboardingInvitation }> {
    const cleanToken = (token || '').trim();
    if (!cleanToken) {
      throw new HttpError(400, 'Invitation token is required.', 'MISSING_TOKEN');
    }

    if (!isValidInvitationTokenFormat(cleanToken)) {
      throw new HttpError(400, 'Invitation token format is invalid.', 'INVALID_TOKEN_FORMAT');
    }

    const tokenHash = hashInvitationToken(cleanToken);
    let row: InvitationRow | null = null;

    // 1. Primary lookup by SHA-256 token hash
    const { data: hashedRow, error: hashErr } = await this.adminClient
      .from('onboarding_invitations')
      .select('*')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (hashErr) {
      throw new HttpError(500, 'Failed to verify invitation.', 'DB_ERROR');
    }

    row = (hashedRow as InvitationRow | null) ?? null;

    // 2. Safe dual-read fallback for pre-migration rows not yet backfilled
    if (!row) {
      const { data: legacyRow, error: legacyErr } = await this.adminClient
        .from('onboarding_invitations')
        .select('*')
        .eq('token', cleanToken)
        .maybeSingle();

      if (legacyErr) {
        throw new HttpError(500, 'Failed to verify invitation.', 'DB_ERROR');
      }

      if (legacyRow) {
        row = legacyRow as InvitationRow;
        const hint = row.token_hint || formatInvitationTokenHint(cleanToken);
        // Opportunistically upgrade legacy plaintext row to SHA-256 hash & clear raw token
        await this.adminClient
          .from('onboarding_invitations')
          .update({
            token_hash: tokenHash,
            token_hint: hint,
            token: null,
          })
          .eq('id', row.id);
        row.token_hash = tokenHash;
        row.token_hint = hint;
        row.token = null;
      }
    }

    const nowIso = new Date().toISOString();
    const mapped = row ? mapInvitationRow(row, nowIso) : undefined;
    const access = isInvitationAccessible(mapped, nowIso);

    if (!access.accessible || !row || !mapped) {
      throw new HttpError(
        row ? 403 : 404,
        row ? access.reason || 'Onboarding invitation has expired.' : 'Onboarding invitation link was not found.',
        row ? 'INVITATION_EXPIRED' : 'INVITATION_NOT_FOUND'
      );
    }

    if (options.requireUnlocked && row.submitted_at) {
      throw new HttpError(
        409,
        'This onboarding packet has already been submitted and locked against edits.',
        'SUBMISSION_LOCKED'
      );
    }

    return { row, invitation: mapped };
  }

  async verifyHrBearerToken(bearerToken: string): Promise<HrUserProfile> {
    const { data: userResult, error: authError } =
      await this.adminClient.auth.getUser(bearerToken);

    if (authError || !userResult?.user) {
      throw new HttpError(401, 'Invalid or expired HR authentication session.', 'UNAUTHORIZED');
    }

    const { data: hrRow, error: roleError } = await this.adminClient
      .from('hr_admin_users')
      .select('user_id, email, full_name, role, is_active')
      .eq('user_id', userResult.user.id)
      .maybeSingle();

    if (roleError) {
      throw new HttpError(500, 'Failed to verify HR permissions.', 'DB_ERROR');
    }

    if (!hrRow || !hrRow.is_active) {
      throw new HttpError(
        403,
        'Access denied. Your account is not an active DICS HR user.',
        'FORBIDDEN'
      );
    }

    if (hrRow.role !== 'hr_admin' && hrRow.role !== 'hr_reviewer') {
      throw new HttpError(
        403,
        'Access denied. Unrecognized HR role assignment.',
        'FORBIDDEN'
      );
    }

    return {
      userId: hrRow.user_id,
      email: hrRow.email || userResult.user.email || '',
      fullName: hrRow.full_name || hrRow.email || 'DICS HR User',
      role: hrRow.role,
    };
  }

  async listForms(): Promise<HRFormDefinition[]> {
    return HR_FORMS_CATALOG.map((f) => ({
      ...f,
      sectionSlots: f.sectionSlots.map((s) => ({ ...s })),
    }));
  }

  async listInvitations(): Promise<OnboardingInvitation[]> {
    const { data, error } = await this.adminClient
      .from('onboarding_invitations')
      .select(
        'id, token_hint, reference_label, department, target_role, status, submission_state, receipt_code, created_at, expires_at, submitted_at'
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw new HttpError(500, 'Failed to load invitations.', 'DB_ERROR');
    }

    const nowIso = new Date().toISOString();
    return ((data ?? []) as InvitationRow[]).map((row) => mapInvitationRow(row, nowIso));
  }

  async createInvitation(
    adminUser: HrUserProfile,
    input: { referenceLabel: string; department: string; targetRole: string; expiryDays: number }
  ): Promise<OnboardingInvitation> {
    if (adminUser.role !== 'hr_admin') {
      throw new HttpError(403, 'Only HR Admins may create invitations.', 'FORBIDDEN');
    }

    const validation = validateInvitationInput(input);
    if (!validation.valid || !validation.normalized) {
      throw new HttpError(400, validation.error || 'Invalid invitation parameters.', 'INVALID_INPUT');
    }

    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);
    const tokenHint = formatInvitationTokenHint(rawToken);
    const now = new Date();
    const expires = new Date(
      now.getTime() + validation.normalized.expiryDays * 24 * 60 * 60 * 1000
    );

    const { data, error } = await this.adminClient
      .from('onboarding_invitations')
      .insert({
        token: null,
        token_hash: tokenHash,
        token_hint: tokenHint,
        reference_label: validation.normalized.referenceLabel,
        department: validation.normalized.department,
        target_role: validation.normalized.targetRole,
        status: 'active',
        submission_state: 'not_submitted',
        created_by_admin_id: adminUser.userId,
        created_at: now.toISOString(),
        expires_at: expires.toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new HttpError(500, 'Failed to create invitation.', 'DB_ERROR');
    }

    const row = data as InvitationRow;
    await this.writeAuditLog({
      invitationId: row.id,
      actorType: 'hr_admin',
      actorId: adminUser.userId,
      action: 'INVITATION_CREATED',
      metadata: {
        referenceLabel: row.reference_label,
        department: row.department,
        targetRole: row.target_role,
        expiresAt: row.expires_at,
        tokenHint,
      },
    });

    // Raw token is returned ONLY ONCE at creation time and never persisted in DB
    return mapInvitationRow(row, now.toISOString(), { oneTimeRawToken: rawToken });
  }

  async expireInvitation(adminUser: HrUserProfile, id: string): Promise<OnboardingInvitation> {
    if (adminUser.role !== 'hr_admin') {
      throw new HttpError(403, 'Only HR Admins may expire invitations.', 'FORBIDDEN');
    }
    if (!isValidUuid(id)) {
      throw new HttpError(400, 'Invalid invitation identifier.', 'INVALID_ID');
    }

    const { data, error } = await this.adminClient
      .from('onboarding_invitations')
      .update({ status: 'expired' })
      .eq('id', id)
      .select(
        'id, token_hint, reference_label, department, target_role, status, submission_state, receipt_code, created_at, expires_at, submitted_at'
      )
      .maybeSingle();

    if (error) {
      throw new HttpError(500, 'Failed to expire invitation.', 'DB_ERROR');
    }
    if (!data) {
      throw new HttpError(404, 'Invitation record was not found.', 'NOT_FOUND');
    }

    const row = data as InvitationRow;
    await this.writeAuditLog({
      invitationId: row.id,
      actorType: 'hr_admin',
      actorId: adminUser.userId,
      action: 'INVITATION_EXPIRED',
    });

    return mapInvitationRow(row, new Date().toISOString());
  }

  async getSessionByToken(token: string): Promise<OnboardingSessionHydration> {
    const { row, invitation } = await this.requireAccessibleInvitation(token);

    const [{ data: formRows, error: formErr }, { data: docRows, error: docErr }] =
      await Promise.all([
        this.adminClient
          .from('onboarding_form_responses')
          .select('form_id, payload, is_completed, updated_at')
          .eq('invitation_id', row.id),
        this.adminClient
          .from('onboarding_documents')
          .select('*')
          .eq('invitation_id', row.id)
          .order('uploaded_at', { ascending: true }),
      ]);

    if (formErr) {
      throw new HttpError(500, 'Failed to load saved form responses.', 'DB_ERROR');
    }
    if (docErr) {
      throw new HttpError(500, 'Failed to load uploaded documents.', 'DB_ERROR');
    }

    const formResponses = hydrateResponses((formRows ?? []) as FormResponseRow[]);
    const uploadedDocuments = ((docRows ?? []) as DocumentRow[]).map(mapDocumentRow);

    return {
      invitation,
      session: {
        invitationToken: invitation.tokenHint || row.id,
        formResponses,
        uploadedDocuments,
        finalDeclarationAccepted: Boolean(row.final_declaration_accepted),
        submittedAt: row.submitted_at ?? null,
        receiptCode: row.receipt_code ?? null,
      },
    };
  }

  async saveFormResponse(
    token: string,
    formId: AnyFormId,
    payload: OnboardingFormResponses[AnyFormId]
  ): Promise<{ formId: AnyFormId; isCompleted: boolean; updatedAt: string }> {
    if (!VALID_FORM_IDS.has(formId)) {
      throw new HttpError(400, `Unknown HR form identifier: ${formId}`, 'INVALID_FORM_ID');
    }

    const { row } = await this.requireAccessibleInvitation(token, { requireUnlocked: true });

    const candidateResponses = createInitialFormResponses();
    (candidateResponses as unknown as Record<string, unknown>)[formId] = payload;
    const isCompleted = validateFormCompletion(formId, candidateResponses).valid;
    const updatedAt = new Date().toISOString();

    const cleanPayload = {
      ...payload,
      updatedAt,
    };

    const { error: upsertErr } = await this.adminClient
      .from('onboarding_form_responses')
      .upsert(
        {
          invitation_id: row.id,
          form_id: formId,
          payload: cleanPayload,
          is_completed: isCompleted,
          updated_at: updatedAt,
        },
        { onConflict: 'invitation_id,form_id' }
      );

    if (upsertErr) {
      throw new HttpError(500, 'Failed to save form draft.', 'DB_ERROR');
    }

    if (row.submission_state === 'not_submitted') {
      await this.adminClient
        .from('onboarding_invitations')
        .update({ submission_state: 'in_progress' })
        .eq('id', row.id);
    }

    await this.writeAuditLog({
      invitationId: row.id,
      actorType: 'employee',
      actorId: `employee:${row.id}`,
      action: 'FORM_DRAFT_SAVED',
      metadata: { formId, isCompleted },
    });

    return { formId, isCompleted, updatedAt };
  }

  async saveFinalDeclaration(
    token: string,
    accepted: boolean
  ): Promise<{ accepted: boolean }> {
    const { row } = await this.requireAccessibleInvitation(token, { requireUnlocked: true });
    const { error } = await this.adminClient
      .from('onboarding_invitations')
      .update({ final_declaration_accepted: Boolean(accepted) })
      .eq('id', row.id);

    if (error) {
      throw new HttpError(500, 'Failed to update declaration state.', 'DB_ERROR');
    }
    return { accepted: Boolean(accepted) };
  }

  async createSignedDocumentUploadUrl(
    token: string,
    input: { slotId: string; fileName: string; mimeType: string; sizeBytes: number }
  ): Promise<SignedUploadUrlResponse> {
    const { row } = await this.requireAccessibleInvitation(token, { requireUnlocked: true });
    const { slotId } = this.resolveValidatedSlot(input.slotId);

    const validation = validateDocumentFile({
      name: input.fileName,
      sizeBytes: Number(input.sizeBytes),
      mimeType: input.mimeType,
    });
    if (!validation.valid) {
      throw new HttpError(400, validation.error || 'Invalid upload file.', 'INVALID_FILE');
    }

    const ext = extractFileExtension(input.fileName);
    const docUuid = crypto.randomUUID();
    // Scope path strictly by server invitation UUID + random document UUID (never bearer token)
    const storagePath = `onboarding/${row.id}/${slotId}/${docUuid}.${ext}`;

    const { data, error } = await this.adminClient.storage
      .from(this.storageBucket)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      throw new HttpError(500, 'Failed to issue signed upload URL.', 'STORAGE_ERROR');
    }

    return {
      uploadUrl: data.signedUrl,
      token: data.token,
      storageBucket: this.storageBucket,
      storagePath,
    };
  }

  async recordUploadedDocument(
    token: string,
    input: {
      slotId: string;
      slotLabel?: string;
      fileName: string;
      mimeType?: string;
      sizeBytes?: number;
      storagePath: string;
    }
  ): Promise<UploadedDocumentItem> {
    const { row } = await this.requireAccessibleInvitation(token, { requireUnlocked: true });
    const { slotId, slotLabel } = this.resolveValidatedSlot(input.slotId);

    if (
      typeof input.storagePath !== 'string' ||
      input.storagePath.includes('..') ||
      input.storagePath.includes('\\') ||
      input.storagePath.includes('\0')
    ) {
      throw new HttpError(400, 'Invalid storage object path.', 'INVALID_PATH');
    }

    const expectedPathRegex = new RegExp(
      `^onboarding/${row.id}/${slotId}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(pdf|jpg|jpeg|png)$`,
      'i'
    );
    if (!expectedPathRegex.test(input.storagePath)) {
      throw new HttpError(
        400,
        'Storage path does not match server-issued upload path for this invitation.',
        'INVALID_PATH'
      );
    }

    const pathExt = extractFileExtension(input.storagePath);

    // Inspect authoritative object metadata directly in Supabase Storage (never trust client size/MIME)
    const { data: storageInfo, error: infoErr } = await this.adminClient.storage
      .from(this.storageBucket)
      .info(input.storagePath);

    if (infoErr || !storageInfo) {
      throw new HttpError(
        400,
        'Uploaded file could not be verified in private storage.',
        'STORAGE_OBJECT_NOT_FOUND'
      );
    }

    const trustedSize = Number(storageInfo.size);
    const trustedMime = String(storageInfo.contentType || '')
      .split(';')[0]
      .trim()
      .toLowerCase();

    const sizeValid = Number.isFinite(trustedSize) && trustedSize > 0 && trustedSize <= MAX_DOCUMENT_SIZE_BYTES;
    const mimeValid = (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(trustedMime);
    const extMatchesStorageMime = doesExtensionMatchMimeType(pathExt, trustedMime);

    if (!sizeValid || !mimeValid || !extMatchesStorageMime) {
      // Remove non-compliant object from private storage before rejecting
      await this.adminClient.storage.from(this.storageBucket).remove([input.storagePath]);
      throw new HttpError(
        400,
        'Uploaded storage object failed size (<= 10 MB) or PDF/JPEG/PNG content-type verification.',
        'INVALID_FILE'
      );
    }

    // Reject client attempts to pass falsified MIME or size metadata
    if (
      typeof input.mimeType === 'string' &&
      input.mimeType.trim().length > 0 &&
      input.mimeType.trim().toLowerCase() !== trustedMime
    ) {
      throw new HttpError(
        400,
        'Submitted MIME type does not match stored object metadata.',
        'METADATA_MISMATCH'
      );
    }

    if (
      typeof input.sizeBytes === 'number' &&
      Number.isFinite(input.sizeBytes) &&
      input.sizeBytes !== trustedSize
    ) {
      throw new HttpError(
        400,
        'Submitted file size does not match stored object metadata.',
        'METADATA_MISMATCH'
      );
    }

    const rawBaseName = sanitizeFileName(input.fileName || '');
    const clientExt = extractFileExtension(rawBaseName);
    const safeDisplayName = doesExtensionMatchMimeType(clientExt, trustedMime)
      ? rawBaseName
      : `document.${pathExt}`;

    const { data, error } = await this.adminClient
      .from('onboarding_documents')
      .insert({
        invitation_id: row.id,
        slot_id: slotId,
        slot_label: slotLabel,
        file_name: safeDisplayName,
        mime_type: trustedMime,
        size_bytes: trustedSize,
        storage_bucket: this.storageBucket,
        storage_path: input.storagePath,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new HttpError(500, 'Failed to record document metadata.', 'DB_ERROR');
    }

    await this.writeAuditLog({
      invitationId: row.id,
      actorType: 'employee',
      actorId: `employee:${row.id}`,
      action: 'DOCUMENT_UPLOADED',
      metadata: {
        documentId: data.id,
        slotId,
        mimeType: trustedMime,
        sizeBytes: trustedSize,
      },
    });

    return mapDocumentRow(data as DocumentRow);
  }

  async deleteUploadedDocument(token: string, documentId: string): Promise<void> {
    if (!isValidUuid(documentId)) {
      throw new HttpError(400, 'Invalid document identifier.', 'INVALID_ID');
    }

    const { row } = await this.requireAccessibleInvitation(token, { requireUnlocked: true });

    const { data: doc, error: fetchErr } = await this.adminClient
      .from('onboarding_documents')
      .select('*')
      .eq('id', documentId)
      .eq('invitation_id', row.id)
      .maybeSingle();

    if (fetchErr) {
      throw new HttpError(500, 'Failed to locate document.', 'DB_ERROR');
    }
    if (!doc) {
      throw new HttpError(404, 'Document was not found for this invitation.', 'NOT_FOUND');
    }

    const { error: storageRemoveErr } = await this.adminClient.storage
      .from(doc.storage_bucket || this.storageBucket)
      .remove([doc.storage_path]);

    if (storageRemoveErr) {
      throw new HttpError(
        502,
        'Failed to delete file from private storage; metadata was preserved.',
        'STORAGE_DELETE_ERROR'
      );
    }

    const { error: delErr } = await this.adminClient
      .from('onboarding_documents')
      .delete()
      .eq('id', documentId)
      .eq('invitation_id', row.id);

    if (delErr) {
      throw new HttpError(500, 'Failed to remove document record.', 'DB_ERROR');
    }

    await this.writeAuditLog({
      invitationId: row.id,
      actorType: 'employee',
      actorId: `employee:${row.id}`,
      action: 'DOCUMENT_DELETED',
      metadata: { documentId },
    });
  }

  async submitOnboardingPacket(
    token: string,
    finalDeclarationAccepted: boolean
  ): Promise<{ receiptCode: string; submittedAt: string; message: string }> {
    const { row } = await this.requireAccessibleInvitation(token, { requireUnlocked: true });
    const hydrated = await this.getSessionByToken(token);

    const sessionForValidation = {
      ...hydrated.session,
      finalDeclarationAccepted: Boolean(finalDeclarationAccepted),
    };

    const progress = calculateOnboardingProgress(sessionForValidation);
    if (!progress.readyForSubmission) {
      throw new HttpError(
        400,
        `Submission incomplete. Remaining form numbers: [${progress.incompleteFormNumbers.join(', ')}]; documents: ${progress.uploadedDocumentsCount}; declaration accepted: ${progress.finalDeclarationAccepted}.`,
        'INCOMPLETE_SUBMISSION'
      );
    }

    const submittedAt = new Date().toISOString();
    const receiptCode = generateSubmissionReceiptCode();

    const { error: updateErr } = await this.adminClient
      .from('onboarding_invitations')
      .update({
        final_declaration_accepted: true,
        submitted_at: submittedAt,
        receipt_code: receiptCode,
        submission_state: 'submitted',
      })
      .eq('id', row.id)
      .is('submitted_at', null);

    if (updateErr) {
      throw new HttpError(500, 'Failed to finalize submission.', 'DB_ERROR');
    }

    await this.writeAuditLog({
      invitationId: row.id,
      actorType: 'employee',
      actorId: `employee:${row.id}`,
      action: 'ONBOARDING_SUBMITTED',
      metadata: { receiptCode, uploadedDocumentsCount: progress.uploadedDocumentsCount },
    });

    return {
      receiptCode,
      submittedAt,
      message: 'All nine DICS Global HR onboarding forms and supporting documents have been saved and locked.',
    };
  }

  async listSubmissions(): Promise<HrSubmissionSummary[]> {
    const invitations = await this.listInvitations();
    const [{ data: formRows }, { data: docRows }] = await Promise.all([
      this.adminClient
        .from('onboarding_form_responses')
        .select('invitation_id, form_id, payload, is_completed'),
      this.adminClient
        .from('onboarding_documents')
        .select('invitation_id'),
    ]);

    const formStats = new Map<string, { completed: number; applicantName: string }>();
    for (const r of (formRows ?? []) as Array<{
      invitation_id: string;
      form_id: string;
      payload: Record<string, unknown>;
      is_completed: boolean;
    }>) {
      const entry = formStats.get(r.invitation_id) ?? { completed: 0, applicantName: '' };
      if (r.is_completed) entry.completed += 1;
      if (r.form_id === 'form-01' && typeof r.payload?.nameInCapitals === 'string') {
        entry.applicantName = r.payload.nameInCapitals;
      }
      formStats.set(r.invitation_id, entry);
    }

    const docCounts = new Map<string, number>();
    for (const d of (docRows ?? []) as Array<{ invitation_id: string }>) {
      docCounts.set(d.invitation_id, (docCounts.get(d.invitation_id) ?? 0) + 1);
    }

    return invitations.map((inv) => {
      const stats = formStats.get(inv.id) ?? { completed: 0, applicantName: '' };
      return {
        invitation: inv,
        completedFormsCount: stats.completed,
        documentsCount: docCounts.get(inv.id) ?? 0,
        applicantName: stats.applicantName,
      };
    });
  }

  async getSubmissionDetail(invitationId: string): Promise<HrSubmissionDetail> {
    if (!isValidUuid(invitationId)) {
      throw new HttpError(400, 'Invalid invitation identifier.', 'INVALID_ID');
    }

    const { data: invRow, error: invErr } = await this.adminClient
      .from('onboarding_invitations')
      .select(
        'id, token_hint, reference_label, department, target_role, status, submission_state, receipt_code, created_at, expires_at, submitted_at'
      )
      .eq('id', invitationId)
      .maybeSingle();

    if (invErr) {
      throw new HttpError(500, 'Failed to load submission.', 'DB_ERROR');
    }
    if (!invRow) {
      throw new HttpError(404, 'Invitation submission was not found.', 'NOT_FOUND');
    }

    const [
      { data: formRows },
      { data: docRows },
      { data: officeRow },
      { data: auditRows },
    ] = await Promise.all([
      this.adminClient
        .from('onboarding_form_responses')
        .select('form_id, payload, is_completed, updated_at')
        .eq('invitation_id', invitationId),
      this.adminClient
        .from('onboarding_documents')
        .select('*')
        .eq('invitation_id', invitationId)
        .order('uploaded_at', { ascending: true }),
      this.adminClient
        .from('hr_office_use_entries')
        .select('*')
        .eq('invitation_id', invitationId)
        .maybeSingle(),
      this.adminClient
        .from('onboarding_audit_logs')
        .select('*')
        .eq('invitation_id', invitationId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const officeUse = officeRow
      ? {
          invitationId,
          form01SelectionStatus: officeRow.form01_selection_status || '',
          form01SelectedAs: officeRow.form01_selected_as || '',
          form01ReportingTo: officeRow.form01_reporting_to || '',
          form01ReviewDate: officeRow.form01_review_date || '',
          form03EmpNo: officeRow.form03_emp_no || '',
          form04EffectiveDate: officeRow.form04_effective_date || '',
          form04RevisionDate: officeRow.form04_revision_date || '',
          form04EmpNo: officeRow.form04_emp_no || '',
          form04PostEmploymentStatuses: officeRow.form04_post_employment_statuses || {},
          form04HrRemarks: officeRow.form04_hr_remarks || '',
          form04DataEnteredBy: officeRow.form04_data_entered_by || '',
          form04DataEnteredDate: officeRow.form04_data_entered_date || '',
          form04DataCheckedBy: officeRow.form04_data_checked_by || '',
          form04DataCheckedDate: officeRow.form04_data_checked_date || '',
          form05EmployerCertDate: officeRow.form05_employer_cert_date || '',
          form05AuthorizedOfficer: officeRow.form05_authorized_officer || '',
          form06EmployerCodeNo: officeRow.form06_employer_code_no || '',
          form06DateOfAppointment: officeRow.form06_date_of_appointment || '',
          form08EmployerUanVerified: officeRow.form08_employer_uan_verified || '',
          form08MemberId: officeRow.form08_member_id || '',
          form08AuthorizedSignatory: officeRow.form08_authorized_signatory || '',
          form09EmployerCertDate: officeRow.form09_employer_cert_date || '',
          form09EmployerDesignation: officeRow.form09_employer_designation || '',
          form09DuplicateIssuedToEmployee: Boolean(officeRow.form09_duplicate_issued_to_employee),
          updatedByAdminId: officeRow.updated_by_admin_id ?? null,
          updatedAt: officeRow.updated_at ?? null,
        }
      : createEmptyOfficeUseEntry(invitationId);

    const auditLogs: AuditLogEntry[] = ((auditRows ?? []) as Array<{
      id: string;
      invitation_id: string | null;
      actor_type: 'employee' | 'hr_admin' | 'system';
      actor_id: string;
      action: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }>).map((a) => ({
      id: a.id,
      invitationId: a.invitation_id,
      actorType: a.actor_type,
      actorId: a.actor_id,
      action: a.action,
      metadata: a.metadata ?? {},
      createdAt: a.created_at,
    }));

    return {
      invitation: mapInvitationRow(invRow as InvitationRow, new Date().toISOString()),
      formResponses: hydrateResponses((formRows ?? []) as FormResponseRow[]),
      uploadedDocuments: ((docRows ?? []) as DocumentRow[]).map(mapDocumentRow),
      officeUse,
      auditLogs,
    };
  }

  async saveOfficeUseEntry(
    adminUser: HrUserProfile,
    invitationId: string,
    patch: Partial<HrOfficeUseEntry> & { markVerified?: boolean }
  ): Promise<HrOfficeUseEntry> {
    if (adminUser.role !== 'hr_admin') {
      throw new HttpError(403, 'Only HR Admins may update Office Use verification fields.', 'FORBIDDEN');
    }
    if (!isValidUuid(invitationId)) {
      throw new HttpError(400, 'Invalid invitation identifier.', 'INVALID_ID');
    }

    const current = (await this.getSubmissionDetail(invitationId)).officeUse;
    const {
      invitationId: _ignoreInvId,
      updatedByAdminId: _ignoreAdminId,
      updatedAt: _ignoreUpdatedAt,
      markVerified,
      ...safePatch
    } = patch;

    const merged: HrOfficeUseEntry = {
      ...current,
      ...safePatch,
      invitationId,
      updatedByAdminId: adminUser.userId,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await this.adminClient.from('hr_office_use_entries').upsert({
      invitation_id: invitationId,
      form01_selection_status: merged.form01SelectionStatus,
      form01_selected_as: merged.form01SelectedAs,
      form01_reporting_to: merged.form01ReportingTo,
      form01_review_date: merged.form01ReviewDate,
      form03_emp_no: merged.form03EmpNo,
      form04_effective_date: merged.form04EffectiveDate,
      form04_revision_date: merged.form04RevisionDate,
      form04_emp_no: merged.form04EmpNo,
      form04_post_employment_statuses: merged.form04PostEmploymentStatuses,
      form04_hr_remarks: merged.form04HrRemarks,
      form04_data_entered_by: merged.form04DataEnteredBy,
      form04_data_entered_date: merged.form04DataEnteredDate,
      form04_data_checked_by: merged.form04DataCheckedBy,
      form04_data_checked_date: merged.form04DataCheckedDate,
      form05_employer_cert_date: merged.form05EmployerCertDate,
      form05_authorized_officer: merged.form05AuthorizedOfficer,
      form06_employer_code_no: merged.form06EmployerCodeNo,
      form06_date_of_appointment: merged.form06DateOfAppointment,
      form08_employer_uan_verified: merged.form08EmployerUanVerified,
      form08_member_id: merged.form08MemberId,
      form08_authorized_signatory: merged.form08AuthorizedSignatory,
      form09_employer_cert_date: merged.form09EmployerCertDate,
      form09_employer_designation: merged.form09EmployerDesignation,
      form09_duplicate_issued_to_employee: merged.form09DuplicateIssuedToEmployee,
      updated_by_admin_id: adminUser.userId,
      updated_at: merged.updatedAt,
    });

    if (error) {
      throw new HttpError(500, 'Failed to save HR Office Use fields.', 'DB_ERROR');
    }

    if (markVerified) {
      await this.adminClient
        .from('onboarding_invitations')
        .update({
          submission_state: 'hr_verified',
          hr_completed_at: merged.updatedAt,
        })
        .eq('id', invitationId);
    }

    await this.writeAuditLog({
      invitationId,
      actorType: 'hr_admin',
      actorId: adminUser.userId,
      action: markVerified ? 'HR_SUBMISSION_VERIFIED' : 'HR_OFFICE_USE_UPDATED',
    });

    return merged;
  }

  async getAdminSignedDownloadUrl(
    adminUser: HrUserProfile,
    documentId: string
  ): Promise<SignedDownloadUrlResponse> {
    if (adminUser.role !== 'hr_admin') {
      throw new HttpError(
        403,
        'Only HR Admins are authorized to download candidate documents.',
        'FORBIDDEN'
      );
    }
    if (!isValidUuid(documentId)) {
      throw new HttpError(400, 'Invalid document identifier.', 'INVALID_ID');
    }

    const { data: doc, error: docErr } = await this.adminClient
      .from('onboarding_documents')
      .select('*')
      .eq('id', documentId)
      .maybeSingle();

    if (docErr) {
      throw new HttpError(500, 'Failed to load document metadata.', 'DB_ERROR');
    }
    if (!doc) {
      throw new HttpError(404, 'Requested document record was not found.', 'NOT_FOUND');
    }

    const expiresInSeconds = 120;
    const { data: signed, error: signErr } = await this.adminClient.storage
      .from(doc.storage_bucket || this.storageBucket)
      .createSignedUrl(doc.storage_path, expiresInSeconds);

    if (signErr || !signed) {
      throw new HttpError(500, 'Failed to create signed download URL.', 'STORAGE_ERROR');
    }

    await this.writeAuditLog({
      invitationId: doc.invitation_id,
      actorType: 'hr_admin',
      actorId: adminUser.userId,
      action: 'DOCUMENT_DOWNLOAD_URL_ISSUED',
      metadata: { documentId: doc.id },
    });

    return {
      downloadUrl: signed.signedUrl,
      expiresInSeconds,
      fileName: doc.file_name,
    };
  }

  async exportSubmissionFormPdf(
    adminUser: HrUserProfile,
    invitationId: string,
    formId: AnyFormId
  ): Promise<{ pdfBytes: Uint8Array; fileName: string }> {
    if (adminUser.role !== 'hr_admin') {
      throw new HttpError(
        403,
        'Only HR Admins are authorized to export individual onboarding form PDFs.',
        'FORBIDDEN'
      );
    }
    if (!VALID_FORM_IDS.has(formId)) {
      throw new HttpError(400, 'Invalid onboarding form identifier.', 'INVALID_FORM_ID');
    }

    const detail = await this.getSubmissionDetail(invitationId);
    const templateBytes = await this.loadOriginalTemplateBytes(formId);
    const needsPhoto = formId === 'form-01' || formId === 'form-06';
    const photoAssets = needsPhoto ? await this.resolvePhotoAssetsForSubmission(detail) : undefined;
    const pdfBytes = await buildFilledOriginalFormPdf(formId, detail, templateBytes, photoAssets);
    const fileName = getOriginalFormPdfFileName(formId);

    await this.writeAuditLog({
      invitationId: detail.invitation.id,
      actorType: 'hr_admin',
      actorId: adminUser.userId,
      action: 'FORM_PDF_EXPORTED',
      metadata: {
        formId,
        receiptCode: detail.invitation.receiptCode,
        fileName,
      },
    });

    return { pdfBytes, fileName };
  }

  async exportSubmissionFormsZip(
    adminUser: HrUserProfile,
    invitationId: string
  ): Promise<{ zipBytes: Uint8Array; fileName: string }> {
    if (adminUser.role !== 'hr_admin') {
      throw new HttpError(
        403,
        'Only HR Admins are authorized to export the complete onboarding forms ZIP archive.',
        'FORBIDDEN'
      );
    }

    const detail = await this.getSubmissionDetail(invitationId);
    const templateEntries = await Promise.all(
      ORIGINAL_FORM_PDF_DESCRIPTORS.map(
        async (desc) => [desc.formId, await this.loadOriginalTemplateBytes(desc.formId)] as const
      )
    );
    const templatesByFormId = Object.fromEntries(templateEntries) as Record<AnyFormId, Uint8Array>;
    const photoAssets = await this.resolvePhotoAssetsForSubmission(detail);
    const zipBytes = await buildAllNineOriginalFormsZip(detail, templatesByFormId, photoAssets);
    const fileName = buildOnboardingFormsZipFileName(detail);

    await this.writeAuditLog({
      invitationId: detail.invitation.id,
      actorType: 'hr_admin',
      actorId: adminUser.userId,
      action: 'ALL_FORMS_ZIP_EXPORTED',
      metadata: {
        receiptCode: detail.invitation.receiptCode,
        fileName,
      },
    });

    return { zipBytes, fileName };
  }
}
