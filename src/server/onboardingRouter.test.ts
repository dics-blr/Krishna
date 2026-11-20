import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { HR_FORMS_CATALOG } from '../shared/formsCatalog.ts';
import {
  calculateOnboardingProgress,
  createEmptyOfficeUseEntry,
  createInitialFormResponses,
  generateInvitationToken,
  generateRandomHex,
  generateSubmissionReceiptCode,
  getEffectiveInvitationStatus,
  isInvitationAccessible,
  validateDocumentFile,
  validateFormCompletion,
  validateInvitationInput,
} from '../shared/onboardingLogic.ts';
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
  UploadedDocumentItem,
} from '../shared/types.ts';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildAllNineOriginalFormsZip,
  buildFilledOriginalFormPdf,
  buildOnboardingFormsZipFileName,
  getOriginalFormPdfFileName,
  ORIGINAL_FORM_PDF_BY_ID,
  ORIGINAL_FORM_PDF_DESCRIPTORS,
} from '../shared/onboardingPdfGenerator.ts';
import { HttpError, type OnboardingDataStore } from './onboardingBackend.ts';
import { createOnboardingApiRouter } from './onboardingRouter.ts';

class MockSupabaseDataStore implements OnboardingDataStore {
  private invitations: OnboardingInvitation[] = [];
  private formsByToken = new Map<string, OnboardingFormResponses>();
  private declarationsByToken = new Map<string, boolean>();
  private docsByToken = new Map<string, UploadedDocumentItem[]>();
  private officeUseByInvId = new Map<string, HrOfficeUseEntry>();
  private auditLogs: AuditLogEntry[] = [];

  async verifyHrBearerToken(bearerToken: string): Promise<HrUserProfile> {
    if (bearerToken === 'valid-hr-admin-jwt') {
      return {
        userId: '00000000-0000-0000-0000-000000000001',
        email: 'hr@dicsglobal.com',
        fullName: 'DICS HR Admin',
        role: 'hr_admin',
      };
    }
    if (bearerToken === 'valid-hr-reviewer-jwt') {
      return {
        userId: '00000000-0000-0000-0000-000000000002',
        email: 'reviewer@dicsglobal.com',
        fullName: 'DICS HR Reviewer',
        role: 'hr_reviewer',
      };
    }
    if (bearerToken === 'non-hr-user-jwt') {
      throw new HttpError(403, 'Access denied. Not an active HR Admin.', 'FORBIDDEN');
    }
    throw new HttpError(401, 'Invalid HR token.', 'UNAUTHORIZED');
  }

  async listForms(): Promise<HRFormDefinition[]> {
    return HR_FORMS_CATALOG;
  }

  async listInvitations(): Promise<OnboardingInvitation[]> {
    const nowIso = new Date().toISOString();
    return this.invitations.map((inv) => ({
      ...inv,
      status: getEffectiveInvitationStatus(inv, nowIso),
    }));
  }

  async createInvitation(
    adminUser: HrUserProfile,
    input: { referenceLabel: string; department: string; targetRole: string; expiryDays: number }
  ): Promise<OnboardingInvitation> {
    const check = validateInvitationInput(input);
    if (!check.valid || !check.normalized) {
      throw new HttpError(400, check.error || 'Invalid input', 'INVALID_INPUT');
    }
    const token = generateInvitationToken();
    const now = new Date();
    const expires = new Date(now.getTime() + check.normalized.expiryDays * 86400_000);
    const inv: OnboardingInvitation = {
      id: `inv-${generateRandomHex(4)}`,
      token,
      referenceLabel: check.normalized.referenceLabel,
      department: check.normalized.department,
      targetRole: check.normalized.targetRole,
      status: 'active',
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      submittedAt: null,
      receiptCode: null,
      invitePath: `/onboard/${token}`,
      submissionState: 'not_submitted',
    };
    this.invitations.unshift(inv);
    this.formsByToken.set(token, createInitialFormResponses());
    this.declarationsByToken.set(token, false);
    this.docsByToken.set(token, []);
    this.auditLogs.push({
      id: `audit-${generateRandomHex(4)}`,
      invitationId: inv.id,
      actorType: 'hr_admin',
      actorId: adminUser.userId,
      action: 'INVITATION_CREATED',
      metadata: { token },
      createdAt: now.toISOString(),
    });
    return inv;
  }

  async expireInvitation(adminUser: HrUserProfile, id: string): Promise<OnboardingInvitation> {
    const idx = this.invitations.findIndex((i) => i.id === id);
    if (idx === -1) throw new HttpError(404, 'Not found', 'NOT_FOUND');
    this.invitations[idx] = { ...this.invitations[idx], status: 'expired' };
    this.auditLogs.push({
      id: `audit-${generateRandomHex(4)}`,
      invitationId: id,
      actorType: 'hr_admin',
      actorId: adminUser.userId,
      action: 'INVITATION_EXPIRED',
      metadata: {},
      createdAt: new Date().toISOString(),
    });
    return this.invitations[idx];
  }

  private getAccessible(token: string, requireUnlocked = false): OnboardingInvitation {
    const inv = this.invitations.find((i) => i.token === token);
    const access = isInvitationAccessible(inv);
    if (!access.accessible || !inv) {
      throw new HttpError(inv ? 403 : 404, access.reason || 'Not found');
    }
    if (requireUnlocked && inv.submittedAt) {
      throw new HttpError(409, 'Submission locked.', 'SUBMISSION_LOCKED');
    }
    return inv;
  }

  async getSessionByToken(token: string): Promise<OnboardingSessionHydration> {
    const inv = this.getAccessible(token);
    return {
      invitation: inv,
      session: {
        invitationToken: token,
        formResponses: this.formsByToken.get(token) ?? createInitialFormResponses(),
        uploadedDocuments: this.docsByToken.get(token) ?? [],
        finalDeclarationAccepted: this.declarationsByToken.get(token) ?? false,
        submittedAt: inv.submittedAt ?? null,
        receiptCode: inv.receiptCode ?? null,
      },
    };
  }

  async saveFormResponse(
    token: string,
    formId: AnyFormId,
    payload: OnboardingFormResponses[AnyFormId]
  ): Promise<{ formId: AnyFormId; isCompleted: boolean; updatedAt: string }> {
    const inv = this.getAccessible(token, true);
    const current = this.formsByToken.get(token) ?? createInitialFormResponses();
    const updatedAt = new Date().toISOString();
    const next = {
      ...current,
      [formId]: { ...payload, updatedAt },
    };
    this.formsByToken.set(token, next);
    const isCompleted = validateFormCompletion(formId, next).valid;
    if (inv.submissionState === 'not_submitted') {
      inv.submissionState = 'in_progress';
    }
    this.auditLogs.push({
      id: `audit-${generateRandomHex(4)}`,
      invitationId: inv.id,
      actorType: 'employee',
      actorId: token,
      action: 'FORM_DRAFT_SAVED',
      metadata: { formId, isCompleted },
      createdAt: updatedAt,
    });
    return { formId, isCompleted, updatedAt };
  }

  async saveFinalDeclaration(token: string, accepted: boolean): Promise<{ accepted: boolean }> {
    this.getAccessible(token, true);
    this.declarationsByToken.set(token, accepted);
    return { accepted };
  }

  async createSignedDocumentUploadUrl(
    token: string,
    input: { slotId: string; fileName: string; mimeType: string; sizeBytes: number }
  ): Promise<SignedUploadUrlResponse> {
    this.getAccessible(token, true);
    const check = validateDocumentFile({
      name: input.fileName,
      sizeBytes: input.sizeBytes,
      mimeType: input.mimeType,
    });
    if (!check.valid) throw new HttpError(400, check.error || 'Invalid file');
    const storagePath = `onboarding/${token}/${input.slotId}/${input.fileName}`;
    return {
      uploadUrl: `https://storage.supabase.test/upload/${storagePath}`,
      storageBucket: 'dics-onboarding-documents',
      storagePath,
    };
  }

  async recordUploadedDocument(
    token: string,
    input: {
      slotId: string;
      slotLabel: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      storagePath: string;
    }
  ): Promise<UploadedDocumentItem> {
    const inv = this.getAccessible(token, true);
    if (!input.storagePath.startsWith(`onboarding/${token}/`) || input.storagePath.includes('..')) {
      throw new HttpError(400, 'Invalid storage path.', 'INVALID_PATH');
    }
    const doc: UploadedDocumentItem = {
      id: `doc-${generateRandomHex(4)}`,
      slotId: input.slotId,
      slotLabel: input.slotLabel,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storageBucketPath: input.storagePath,
      uploadedAt: new Date().toISOString(),
      storageMode: 'supabase_private_storage',
    };
    const docs = this.docsByToken.get(token) ?? [];
    docs.push(doc);
    this.docsByToken.set(token, docs);
    this.auditLogs.push({
      id: `audit-${generateRandomHex(4)}`,
      invitationId: inv.id,
      actorType: 'employee',
      actorId: token,
      action: 'DOCUMENT_UPLOADED',
      metadata: { fileName: doc.fileName },
      createdAt: doc.uploadedAt,
    });
    return doc;
  }

  async deleteUploadedDocument(token: string, documentId: string): Promise<void> {
    this.getAccessible(token, true);
    const docs = this.docsByToken.get(token) ?? [];
    this.docsByToken.set(
      token,
      docs.filter((d) => d.id !== documentId)
    );
  }

  async submitOnboardingPacket(
    token: string,
    finalDeclarationAccepted: boolean
  ): Promise<{ receiptCode: string; submittedAt: string; message: string }> {
    const inv = this.getAccessible(token, true);
    const hydrated = await this.getSessionByToken(token);
    const progress = calculateOnboardingProgress({
      ...hydrated.session,
      finalDeclarationAccepted,
    });
    if (!progress.readyForSubmission) {
      throw new HttpError(400, 'Submission incomplete.');
    }
    const submittedAt = new Date().toISOString();
    const receiptCode = generateSubmissionReceiptCode();
    inv.submittedAt = submittedAt;
    inv.receiptCode = receiptCode;
    inv.submissionState = 'submitted';
    this.declarationsByToken.set(token, true);
    this.auditLogs.push({
      id: `audit-${generateRandomHex(4)}`,
      invitationId: inv.id,
      actorType: 'employee',
      actorId: token,
      action: 'ONBOARDING_SUBMITTED',
      metadata: { receiptCode },
      createdAt: submittedAt,
    });
    return {
      receiptCode,
      submittedAt,
      message: 'Locked.',
    };
  }

  async listSubmissions(): Promise<HrSubmissionSummary[]> {
    return this.invitations.map((inv) => ({
      invitation: inv,
      completedFormsCount: 9,
      documentsCount: (this.docsByToken.get(inv.token) ?? []).length,
      applicantName: (this.formsByToken.get(inv.token)?.['form-01'].nameInCapitals) || '',
    }));
  }

  async getSubmissionDetail(invitationId: string): Promise<HrSubmissionDetail> {
    const inv = this.invitations.find((i) => i.id === invitationId);
    if (!inv) throw new HttpError(404, 'Not found');
    return {
      invitation: inv,
      formResponses: this.formsByToken.get(inv.token) ?? createInitialFormResponses(),
      uploadedDocuments: this.docsByToken.get(inv.token) ?? [],
      officeUse: this.officeUseByInvId.get(invitationId) ?? createEmptyOfficeUseEntry(invitationId),
      auditLogs: this.auditLogs.filter((a) => a.invitationId === invitationId),
    };
  }

  async saveOfficeUseEntry(
    adminUser: HrUserProfile,
    invitationId: string,
    patch: Partial<HrOfficeUseEntry> & { markVerified?: boolean }
  ): Promise<HrOfficeUseEntry> {
    const inv = this.invitations.find((i) => i.id === invitationId);
    if (!inv) throw new HttpError(404, 'Not found');
    const updated: HrOfficeUseEntry = {
      ...(this.officeUseByInvId.get(invitationId) ?? createEmptyOfficeUseEntry(invitationId)),
      ...patch,
      invitationId,
      updatedByAdminId: adminUser.userId,
      updatedAt: new Date().toISOString(),
    };
    this.officeUseByInvId.set(invitationId, updated);
    if (patch.markVerified) {
      inv.submissionState = 'hr_verified';
    }
    return updated;
  }

  async getAdminSignedDownloadUrl(
    _adminUser: HrUserProfile,
    documentId: string
  ): Promise<SignedDownloadUrlResponse> {
    for (const docs of this.docsByToken.values()) {
      const match = docs.find((d) => d.id === documentId);
      if (match) {
        return {
          downloadUrl: `https://storage.supabase.test/download/${match.storageBucketPath}`,
          expiresInSeconds: 120,
          fileName: match.fileName,
        };
      }
    }
    throw new HttpError(404, 'Document not found');
  }

  async exportSubmissionFormPdf(
    adminUser: HrUserProfile,
    invitationId: string,
    formId: AnyFormId
  ): Promise<{ pdfBytes: Uint8Array; fileName: string }> {
    const detail = await this.getSubmissionDetail(invitationId);
    const desc = ORIGINAL_FORM_PDF_BY_ID[formId];
    if (!desc) throw new HttpError(400, 'Invalid form id', 'INVALID_FORM_ID');
    const tplBuf = await fs.readFile(path.resolve(process.cwd(), 'public/assets/aistudio', desc.templateFile));
    const pdfBytes = await buildFilledOriginalFormPdf(formId, detail, new Uint8Array(tplBuf));
    const fileName = getOriginalFormPdfFileName(formId);
    this.auditLogs.push({
      id: `audit-${generateRandomHex(4)}`,
      invitationId: detail.invitation.id,
      actorType: 'hr_admin',
      actorId: adminUser.userId,
      action: 'FORM_PDF_EXPORTED',
      metadata: { formId, receiptCode: detail.invitation.receiptCode, fileName },
      createdAt: new Date().toISOString(),
    });
    return { pdfBytes, fileName };
  }

  async exportSubmissionFormsZip(
    adminUser: HrUserProfile,
    invitationId: string
  ): Promise<{ zipBytes: Uint8Array; fileName: string }> {
    const detail = await this.getSubmissionDetail(invitationId);
    const entries = await Promise.all(
      ORIGINAL_FORM_PDF_DESCRIPTORS.map(async (desc) => {
        const buf = await fs.readFile(path.resolve(process.cwd(), 'public/assets/aistudio', desc.templateFile));
        return [desc.formId, new Uint8Array(buf)] as const;
      })
    );
    const templates = Object.fromEntries(entries) as Record<AnyFormId, Uint8Array>;
    const zipBytes = await buildAllNineOriginalFormsZip(detail, templates);
    const fileName = buildOnboardingFormsZipFileName(detail);
    this.auditLogs.push({
      id: `audit-${generateRandomHex(4)}`,
      invitationId: detail.invitation.id,
      actorType: 'hr_admin',
      actorId: adminUser.userId,
      action: 'ALL_FORMS_ZIP_EXPORTED',
      metadata: { receiptCode: detail.invitation.receiptCode, fileName },
      createdAt: new Date().toISOString(),
    });
    return { zipBytes, fileName };
  }
}

function buildFullyPopulatedForms(): OnboardingFormResponses {
  const sig =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const r = createInitialFormResponses();
  r['form-01'] = {
    ...r['form-01'],
    nameInCapitals: 'ARUN KUMAR',
    positionAppliedFor: 'Control Systems Engineer',
    presentAddress: 'Peenya, Bengaluru',
    permanentAddress: 'Peenya, Bengaluru',
    mobileNo: '9876543210',
    email: 'arun@example.com',
    dateOfBirth: '1994-05-10',
    emergencyContactName: 'Suresh',
    emergencyContactTel: '9876500001',
    reference1Name: 'Ref 1',
    reference1Tel: '9876500002',
    reference2Name: 'Ref 2',
    reference2Tel: '9876500003',
    declarationConfirmed: true,
    place: 'Bengaluru',
    date: '2026-11-18',
    applicantSignatureDataUrl: sig,
  };
  r['form-02'] = {
    ...r['form-02'],
    name: 'ARUN KUMAR',
    fatherName: 'Suresh',
    designation: 'Control Systems Engineer',
    dateOfBirth: '1994-05-10',
    dateOfJoining: '2026-11-18',
    contactNumber: '9876543210',
    presentAddress: 'Peenya, Bengaluru',
    permanentAddress: 'Peenya, Bengaluru',
    emergency1Name: 'Suresh',
    emergency1Mobile: '9876500001',
    date: '2026-11-18',
    signatureDataUrl: sig,
    declarationConfirmed: true,
  };
  r['form-03'] = {
    ...r['form-03'],
    employeeName: 'ARUN KUMAR',
    dateOfJoining: '2026-11-18',
    designation: 'Control Systems Engineer',
    department: 'Instrumentation & Controls',
    familyMembers: r['form-03'].familyMembers.map((row, idx) =>
      idx === 0 ? { ...row, memberName: 'ARUN KUMAR', dateOfBirth: '1994-05-10', gender: 'Male' } : row
    ),
    policyNoteConfirmed: true,
    employeeSignatureDataUrl: sig,
  };
  r['form-04'] = {
    ...r['form-04'],
    employeeName: 'ARUN KUMAR',
    designation: 'Control Systems Engineer',
    department: 'Instrumentation & Controls',
    employeeConfirmed: true,
    employeeConfirmDate: '2026-11-18',
  };
  r['form-05'] = {
    ...r['form-05'],
    nameInBlockLetters: 'ARUN KUMAR',
    fatherOrHusbandName: 'Suresh',
    dateOfBirth: '1994-05-10',
    sex: 'Male',
    maritalStatus: 'Unmarried',
    permanentAddress: 'Peenya, Bengaluru',
    partANominees: [
      {
        nomineeNameAndAddress: 'Suresh, Bengaluru',
        relationship: 'Father',
        dateOfBirth: '1965-01-01',
        shareProportion: '100%',
        minorGuardianDetails: '',
      },
    ],
    partASubscriberSignatureDataUrl: sig,
    partBDate: '2026-11-18',
    partBPlace: 'Bengaluru',
    partBSubscriberSignatureDataUrl: sig,
    declarationConfirmed: true,
  };
  r['form-06'] = {
    ...r['form-06'],
    nameInBlockLetters: 'ARUN KUMAR',
    fatherOrHusbandName: 'Suresh',
    dateOfBirth: '1994-05-10',
    maritalStatus: 'U',
    sex: 'M',
    presentAddress: 'Peenya, Bengaluru',
    presentPinCode: '560058',
    permanentAddress: 'Peenya, Bengaluru',
    permanentPinCode: '560058',
    nomineeName: 'Suresh',
    nomineeRelationship: 'Father',
    nomineeAddress: 'Bengaluru',
    declarationConfirmed: true,
    ipSignatureDataUrl: sig,
  };
  r['form-07'] = {
    ...r['form-07'],
    nomineeName: 'Suresh',
    relationshipWithEmployee: 'Father',
    nomineeAddress: 'Bengaluru',
    witness1Details: 'W1',
    witness2Details: 'W2',
    date: '2026-11-18',
    signatureDataUrl: sig,
    declarationConfirmed: true,
  };
  r['form-08'] = {
    ...r['form-08'],
    memberName: 'ARUN KUMAR',
    fatherOrSpouseName: 'Suresh',
    dateOfBirth: '1994-05-10',
    gender: 'Male',
    maritalStatus: 'Unmarried',
    emailId: 'arun@example.com',
    mobileNo: '9876543210',
    earlierMemberEpf1952: 'No',
    earlierMemberEps1995: 'No',
    internationalWorker: 'No',
    bankAccountNo: '000012345678',
    ifscCode: 'SBIN0000001',
    aadharNumber: '123456789012',
    undertakingAccepted: true,
    date: '2026-11-18',
    place: 'Bengaluru',
    memberSignatureDataUrl: sig,
  };
  r['form-09'] = {
    ...r['form-09'],
    employeeFullNameHeader: 'ARUN KUMAR',
    nominees: [{ nomineeNameAndAddress: 'Suresh', relationship: 'Father', age: '61', shareProportion: '100%' }],
    statementEmployeeName: 'ARUN KUMAR',
    statementSex: 'Male',
    statementMaritalStatus: 'unmarried',
    statementDepartmentBranch: 'Instrumentation & Controls',
    permanentDistrict: 'Bengaluru',
    permanentState: 'Karnataka',
    employeePlace: 'Bengaluru',
    employeeDate: '2026-11-18',
    employeeSignatureDataUrl: sig,
    witness1NameAndAddress: 'W1',
    witness1SignatureDataUrl: sig,
    witness2NameAndAddress: 'W2',
    witness2SignatureDataUrl: sig,
    declarationConfirmed: true,
  };
  return r;
}

async function startTestServer(
  getStore: () => OnboardingDataStore | null,
  routerOptions?: Parameters<typeof createOnboardingApiRouter>[1]
) {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use('/api', createOnboardingApiRouter(getStore, routerOptions));

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

test('backend API enforces HR Auth (401/403/503) and returns 503 when server Supabase env is unconfigured', async () => {
  const unconfigured = await startTestServer(() => null);
  try {
    const noAuthRes = await fetch(`${unconfigured.baseUrl}/api/admin/invitations`);
    assert.equal(noAuthRes.status, 401);

    const withTokenUnconfigured = await fetch(`${unconfigured.baseUrl}/api/admin/invitations`, {
      headers: { Authorization: 'Bearer some-jwt' },
    });
    assert.equal(withTokenUnconfigured.status, 503);
    const body = (await withTokenUnconfigured.json()) as { code: string };
    assert.equal(body.code, 'SUPABASE_NOT_CONFIGURED');

    const formsRes = await fetch(`${unconfigured.baseUrl}/api/forms`);
    assert.equal(formsRes.status, 200);
    const formsBody = (await formsRes.json()) as { forms: HRFormDefinition[] };
    assert.equal(formsBody.forms.length, 9);
  } finally {
    await unconfigured.close();
  }
});

test('full Stage 2 onboarding API flow: HR Auth, invitation lifecycle, 9-form draft resume, signed upload/download, submit lock (409), and Office Use verification', async () => {
  const store = new MockSupabaseDataStore();
  const srv = await startTestServer(() => store);
  const authHeaders = {
    Authorization: 'Bearer valid-hr-admin-jwt',
    'Content-Type': 'application/json',
  };

  try {
    // 1. Non-HR user gets 403 Forbidden
    const forbiddenRes = await fetch(`${srv.baseUrl}/api/admin/me`, {
      headers: { Authorization: 'Bearer non-hr-user-jwt' },
    });
    assert.equal(forbiddenRes.status, 403);

    // 2. HR Admin creates invitation
    const createRes = await fetch(`${srv.baseUrl}/api/admin/invitations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        referenceLabel: 'Candidate Nov Batch',
        department: 'Instrumentation & Controls',
        targetRole: 'Controls Engineer',
        expiryDays: 14,
      }),
    });
    assert.equal(createRes.status, 201);
    const { invitation } = (await createRes.json()) as { invitation: OnboardingInvitation };
    assert.match(invitation.token, /^dics-[0-9a-f]{48}$/);

    // 3. Unknown token returns 404
    const missingTokenRes = await fetch(`${srv.baseUrl}/api/onboard/dics-doesnotexist`);
    assert.equal(missingTokenRes.status, 404);

    // 4. Employee saves all 9 forms via PUT /api/onboard/:token/forms/:formId
    const populated = buildFullyPopulatedForms();
    for (const form of HR_FORMS_CATALOG) {
      const formId = form.id as AnyFormId;
      const saveRes = await fetch(
        `${srv.baseUrl}/api/onboard/${invitation.token}/forms/${formId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: populated[formId] }),
        }
      );
      assert.equal(saveRes.status, 200);
      const saveBody = (await saveRes.json()) as { isCompleted: boolean };
      assert.equal(saveBody.isCompleted, true, `${formId} should validate as complete`);
    }

    // 5. Reload hydration restores saved draft responses
    const reloadRes = await fetch(`${srv.baseUrl}/api/onboard/${invitation.token}`);
    assert.equal(reloadRes.status, 200);
    const hydrated = (await reloadRes.json()) as OnboardingSessionHydration;
    assert.equal(hydrated.session.formResponses['form-01'].nameInCapitals, 'ARUN KUMAR');
    assert.equal(hydrated.session.formResponses['form-09'].employeeFullNameHeader, 'ARUN KUMAR');

    // 6. Document signed upload URL + path traversal block + metadata record
    const uploadUrlRes = await fetch(
      `${srv.baseUrl}/api/onboard/${invitation.token}/documents/upload-url`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: 'upload-slot-kyc-id',
          fileName: 'pan-card.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12000,
        }),
      }
    );
    assert.equal(uploadUrlRes.status, 200);
    const signedUpload = (await uploadUrlRes.json()) as SignedUploadUrlResponse;
    assert.ok(signedUpload.storagePath.startsWith(`onboarding/${invitation.token}/`));

    const badPathRes = await fetch(
      `${srv.baseUrl}/api/onboard/${invitation.token}/documents`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: 'upload-slot-kyc-id',
          slotLabel: 'KYC Identity',
          fileName: 'pan-card.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12000,
          storagePath: 'onboarding/other-token/../secret.pdf',
        }),
      }
    );
    assert.equal(badPathRes.status, 400);

    const recordDocRes = await fetch(
      `${srv.baseUrl}/api/onboard/${invitation.token}/documents`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: 'upload-slot-kyc-id',
          slotLabel: 'KYC Identity',
          fileName: 'pan-card.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12000,
          storagePath: signedUpload.storagePath,
        }),
      }
    );
    assert.equal(recordDocRes.status, 201);
    const { document } = (await recordDocRes.json()) as { document: UploadedDocumentItem };

    // 7. Submit packet -> generates receipt & locks against further edits (409)
    const submitRes = await fetch(`${srv.baseUrl}/api/onboard/${invitation.token}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalDeclarationAccepted: true }),
    });
    assert.equal(submitRes.status, 200);
    const receipt = (await submitRes.json()) as { receiptCode: string; submittedAt: string };
    assert.match(receipt.receiptCode, /^DICS-ONB-/);

    const postLockEditRes = await fetch(
      `${srv.baseUrl}/api/onboard/${invitation.token}/forms/form-01`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: populated['form-01'] }),
      }
    );
    assert.equal(postLockEditRes.status, 409);

    // 8. HR Admin inspects submission, downloads signed URL, saves Office Use & marks verified
    const detailRes = await fetch(`${srv.baseUrl}/api/admin/submissions/${invitation.id}`, {
      headers: { Authorization: 'Bearer valid-hr-admin-jwt' },
    });
    assert.equal(detailRes.status, 200);
    const { detail } = (await detailRes.json()) as { detail: HrSubmissionDetail };
    assert.equal(detail.uploadedDocuments.length, 1);
    assert.ok(detail.auditLogs.some((a) => a.action === 'ONBOARDING_SUBMITTED'));

    const downloadUrlRes = await fetch(
      `${srv.baseUrl}/api/admin/documents/${document.id}/download-url`,
      { headers: { Authorization: 'Bearer valid-hr-admin-jwt' } }
    );
    assert.equal(downloadUrlRes.status, 200);

    const officeRes = await fetch(
      `${srv.baseUrl}/api/admin/submissions/${invitation.id}/office-use`,
      {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          form01SelectionStatus: 'Selected',
          form03EmpNo: 'DICS-EMP-109',
          markVerified: true,
        }),
      }
    );
    assert.equal(officeRes.status, 200);

    // 8b. HR Admin downloads individual original form PDF & all-9 ZIP; unauthenticated gets 401
    const unauthPdfRes = await fetch(
      `${srv.baseUrl}/api/admin/submissions/${invitation.id}/forms/form-01/pdf`
    );
    assert.equal(unauthPdfRes.status, 401);

    const adminPdfRes = await fetch(
      `${srv.baseUrl}/api/admin/submissions/${invitation.id}/forms/form-01/pdf`,
      { headers: { Authorization: 'Bearer valid-hr-admin-jwt' } }
    );
    assert.equal(adminPdfRes.status, 200);
    assert.equal(adminPdfRes.headers.get('content-type'), 'application/pdf');
    assert.equal(
      adminPdfRes.headers.get('content-disposition'),
      'attachment; filename="DICS-HR-01_Bio-Data_Form.pdf"'
    );
    const pdfArrayBuffer = await adminPdfRes.arrayBuffer();
    assert.equal(Buffer.from(pdfArrayBuffer.slice(0, 5)).toString('ascii'), '%PDF-');

    const adminZipRes = await fetch(
      `${srv.baseUrl}/api/admin/submissions/${invitation.id}/pdfs.zip`,
      { headers: { Authorization: 'Bearer valid-hr-admin-jwt' } }
    );
    assert.equal(adminZipRes.status, 200);
    assert.equal(adminZipRes.headers.get('content-type'), 'application/zip');
    assert.match(
      adminZipRes.headers.get('content-disposition') || '',
      /^attachment; filename="DICS-Onboarding-Forms-/
    );
    const zipArrayBuffer = await adminZipRes.arrayBuffer();
    assert.equal(Buffer.from(zipArrayBuffer.slice(0, 2)).toString('ascii'), 'PK');

    // 9. Expiring an invitation blocks subsequent employee access (403)
    const expireRes = await fetch(
      `${srv.baseUrl}/api/admin/invitations/${invitation.id}/expire`,
      {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-hr-admin-jwt' },
      }
    );
    assert.equal(expireRes.status, 200);

    const expiredAccessRes = await fetch(`${srv.baseUrl}/api/onboard/${invitation.token}`);
    assert.equal(expiredAccessRes.status, 403);
  } finally {
    await srv.close();
  }
});

test('route-level middleware restricts hr_reviewer to read-only routes and blocks writes & document downloads (403)', async () => {
  const store = new MockSupabaseDataStore();
  const srv = await startTestServer(() => store);
  const reviewerHeaders = {
    Authorization: 'Bearer valid-hr-reviewer-jwt',
    'Content-Type': 'application/json',
  };

  try {
    // Allowed read routes for hr_reviewer
    const meRes = await fetch(`${srv.baseUrl}/api/admin/me`, { headers: reviewerHeaders });
    assert.equal(meRes.status, 200);
    const listInvRes = await fetch(`${srv.baseUrl}/api/admin/invitations`, {
      headers: reviewerHeaders,
    });
    assert.equal(listInvRes.status, 200);
    const listSubRes = await fetch(`${srv.baseUrl}/api/admin/submissions`, {
      headers: reviewerHeaders,
    });
    assert.equal(listSubRes.status, 200);

    // Blocked admin-only routes for hr_reviewer
    const createRes = await fetch(`${srv.baseUrl}/api/admin/invitations`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({
        referenceLabel: 'Unauthorized Batch',
        department: 'Automation Engineering',
        targetRole: 'Engineer',
        expiryDays: 7,
      }),
    });
    assert.equal(createRes.status, 403);

    const expireRes = await fetch(`${srv.baseUrl}/api/admin/invitations/some-id/expire`, {
      method: 'POST',
      headers: reviewerHeaders,
    });
    assert.equal(expireRes.status, 403);

    const officeRes = await fetch(`${srv.baseUrl}/api/admin/submissions/some-id/office-use`, {
      method: 'PUT',
      headers: reviewerHeaders,
      body: JSON.stringify({ form01SelectionStatus: 'Selected' }),
    });
    assert.equal(officeRes.status, 403);

    const downloadRes = await fetch(`${srv.baseUrl}/api/admin/documents/some-doc/download-url`, {
      headers: reviewerHeaders,
    });
    assert.equal(downloadRes.status, 403);

    const pdfExportRes = await fetch(`${srv.baseUrl}/api/admin/submissions/some-id/forms/form-01/pdf`, {
      headers: reviewerHeaders,
    });
    assert.equal(pdfExportRes.status, 403);

    const zipExportRes = await fetch(`${srv.baseUrl}/api/admin/submissions/some-id/pdfs.zip`, {
      headers: reviewerHeaders,
    });
    assert.equal(zipExportRes.status, 403);
  } finally {
    await srv.close();
  }
});

test('rate limiting enforces 429 on employee token and HR admin endpoints after exceeding configured limits', async () => {
  const store = new MockSupabaseDataStore();
  const srv = await startTestServer(() => store, {
    employeeRateLimit: { windowMs: 60_000, maxRequests: 2 },
    adminRateLimit: { windowMs: 60_000, maxRequests: 2 },
  });

  try {
    // Employee token endpoints: 2 allowed, 3rd returns 429
    const emp1 = await fetch(`${srv.baseUrl}/api/onboard/dics-111111111111111111111111`);
    assert.equal(emp1.status, 404);
    const emp2 = await fetch(`${srv.baseUrl}/api/onboard/dics-222222222222222222222222`);
    assert.equal(emp2.status, 404);
    const emp3 = await fetch(`${srv.baseUrl}/api/onboard/dics-333333333333333333333333`);
    assert.equal(emp3.status, 429);
    assert.ok(emp3.headers.get('retry-after'));
    const empBody = (await emp3.json()) as { code: string };
    assert.equal(empBody.code, 'RATE_LIMIT_EXCEEDED');

    // HR admin endpoints: 2 allowed, 3rd returns 429
    const adm1 = await fetch(`${srv.baseUrl}/api/admin/me`, {
      headers: { Authorization: 'Bearer valid-hr-admin-jwt' },
    });
    assert.equal(adm1.status, 200);
    const adm2 = await fetch(`${srv.baseUrl}/api/admin/invitations`, {
      headers: { Authorization: 'Bearer valid-hr-admin-jwt' },
    });
    assert.equal(adm2.status, 200);
    const adm3 = await fetch(`${srv.baseUrl}/api/admin/submissions`, {
      headers: { Authorization: 'Bearer valid-hr-admin-jwt' },
    });
    assert.equal(adm3.status, 429);
    const admBody = (await adm3.json()) as { code: string };
    assert.equal(admBody.code, 'RATE_LIMIT_EXCEEDED');
  } finally {
    await srv.close();
  }
});
