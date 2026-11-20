import { HR_FORMS_CATALOG } from '../../shared/formsCatalog';
import {
  buildSupabaseStoragePath,
  calculateOnboardingProgress,
  createEmptyOfficeUseEntry,
  createInitialFormResponses,
  formatInvitationTokenHint,
  generateInvitationToken,
  generatePreviewReceiptCode,
  generateRandomHex,
  getEffectiveInvitationStatus,
  isFormSlotCompleted,
  isInvitationAccessible,
  validateDocumentFile,
  validateInvitationInput,
} from '../../shared/onboardingLogic';
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
} from '../../shared/onboardingPdfGenerator';
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
  OnboardingSessionState,
  SignedDownloadUrlResponse,
  SignedUploadUrlResponse,
  SupabaseReadinessInfo,
  UploadedDocumentItem,
} from '../../shared/types';
import { configureSupabasePublicEnv, getSupabaseBrowserClient } from './browserClient';
import { getSupabaseConfig } from './config';

export interface CreateInvitationInput {
  referenceLabel: string;
  department: string;
  targetRole: string;
  expiryDays: number;
}

export interface PreviewSubmitReceipt {
  receiptCode: string;
  submittedAt: string;
  mode: 'stage1_preview' | 'supabase_connected';
  message: string;
}

export interface OnboardingRepository {
  setAccessTokenProvider(provider: (() => Promise<string | null>) | null): void;
  getReadiness(): Promise<SupabaseReadinessInfo>;
  getCurrentHrUser(): Promise<HrUserProfile | null>;
  listForms(): Promise<HRFormDefinition[]>;
  listInvitations(): Promise<OnboardingInvitation[]>;
  createInvitation(input: CreateInvitationInput): Promise<OnboardingInvitation>;
  expireInvitation(id: string): Promise<OnboardingInvitation>;
  getInvitationByToken(token: string): Promise<OnboardingInvitation>;
  loadOnboardingSession(token: string): Promise<OnboardingSessionHydration>;
  saveFormDraft(
    token: string,
    formId: AnyFormId,
    payload: OnboardingFormResponses[AnyFormId]
  ): Promise<{ formId: AnyFormId; isCompleted: boolean; updatedAt: string }>;
  saveFinalDeclaration(token: string, accepted: boolean): Promise<{ accepted: boolean }>;
  uploadOnboardingDocument(
    token: string,
    slotId: string,
    slotLabel: string,
    file: File
  ): Promise<UploadedDocumentItem>;
  deleteOnboardingDocument(token: string, documentId: string): Promise<void>;
  submitPreviewOnboarding(
    token: string,
    session: OnboardingSessionState
  ): Promise<PreviewSubmitReceipt>;
  listSubmissions(): Promise<HrSubmissionSummary[]>;
  getSubmissionDetail(invitationId: string): Promise<HrSubmissionDetail>;
  saveOfficeUseEntry(
    invitationId: string,
    patch: Partial<HrOfficeUseEntry> & { markVerified?: boolean }
  ): Promise<HrOfficeUseEntry>;
  getDocumentDownloadUrl(documentId: string): Promise<SignedDownloadUrlResponse>;
  exportSubmissionFormPdf(
    invitationId: string,
    formId: AnyFormId
  ): Promise<{ blob: Blob; fileName: string }>;
  exportSubmissionAllFormsZip(invitationId: string): Promise<{ blob: Blob; fileName: string }>;
}

/**
 * Stage 1 Client-Side In-Memory Repository (Development Fallback).
 * Used automatically when Supabase environment variables are unconfigured placeholders.
 * Stores invitations, drafts, document metadata, office-use updates, and audit events
 * purely in browser memory for the active session.
 */
export class Stage1InMemoryRepository implements OnboardingRepository {
  private invitations: OnboardingInvitation[] = [];
  private formResponsesByToken = new Map<string, OnboardingFormResponses>();
  private declarationsByToken = new Map<string, boolean>();
  private documentsByToken = new Map<string, UploadedDocumentItem[]>();
  private previewObjectUrls = new Map<string, string>();
  private previewPhotoAssets = new Map<string, PhotoImageAsset>();
  private templateCache = new Map<AnyFormId, Uint8Array>();
  private officeUseByInvitationId = new Map<string, HrOfficeUseEntry>();
  private auditLogsByInvitationId = new Map<string, AuditLogEntry[]>();

  setAccessTokenProvider(): void {
    // No-op in Stage 1 fallback mode
  }

  private appendAudit(
    invitationId: string,
    actorType: 'employee' | 'hr_admin' | 'system',
    actorId: string,
    action: string,
    metadata: Record<string, unknown> = {}
  ): void {
    const existing = this.auditLogsByInvitationId.get(invitationId) ?? [];
    existing.unshift({
      id: `audit-${generateRandomHex(6)}`,
      invitationId,
      actorType,
      actorId,
      action,
      metadata,
      createdAt: new Date().toISOString(),
    });
    this.auditLogsByInvitationId.set(invitationId, existing);
  }

  async getReadiness(): Promise<SupabaseReadinessInfo> {
    return getSupabaseConfig().readiness;
  }

  async getCurrentHrUser(): Promise<HrUserProfile | null> {
    return null;
  }

  async listForms(): Promise<HRFormDefinition[]> {
    return HR_FORMS_CATALOG.map((form) => ({
      ...form,
      sectionSlots: form.sectionSlots.map((slot) => ({ ...slot })),
    }));
  }

  async listInvitations(): Promise<OnboardingInvitation[]> {
    const nowIso = new Date().toISOString();
    return this.invitations.map((inv) => ({
      ...inv,
      status: getEffectiveInvitationStatus(inv, nowIso),
    }));
  }

  async createInvitation(input: CreateInvitationInput): Promise<OnboardingInvitation> {
    const validation = validateInvitationInput(input);
    if (!validation.valid || !validation.normalized) {
      throw new Error(validation.error || 'Please provide valid invitation details.');
    }

    const existingTokens = new Set(this.invitations.map((item) => item.token));
    const token = generateInvitationToken(existingTokens);
    const now = new Date();
    const expires = new Date(
      now.getTime() + validation.normalized.expiryDays * 24 * 60 * 60 * 1000
    );

    const invitation: OnboardingInvitation = {
      id: `inv-${generateRandomHex(6)}`,
      token,
      tokenHint: formatInvitationTokenHint(token),
      referenceLabel: validation.normalized.referenceLabel,
      department: validation.normalized.department,
      targetRole: validation.normalized.targetRole,
      status: 'active',
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      submittedAt: null,
      receiptCode: null,
      invitePath: `/onboard/${token}`,
      submissionState: 'not_submitted',
    };

    this.invitations.unshift(invitation);
    this.formResponsesByToken.set(token, createInitialFormResponses());
    this.declarationsByToken.set(token, false);
    this.documentsByToken.set(token, []);
    this.appendAudit(invitation.id, 'hr_admin', 'stage1-preview', 'INVITATION_CREATED', {
      referenceLabel: invitation.referenceLabel,
    });
    return { ...invitation };
  }

  async expireInvitation(id: string): Promise<OnboardingInvitation> {
    const index = this.invitations.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('Invitation record was not found in the current session.');
    }

    const updated: OnboardingInvitation = {
      ...this.invitations[index],
      status: 'expired',
    };
    this.invitations[index] = updated;
    this.appendAudit(updated.id, 'hr_admin', 'stage1-preview', 'INVITATION_EXPIRED');
    return { ...updated };
  }

  async getInvitationByToken(token: string): Promise<OnboardingInvitation> {
    const nowIso = new Date().toISOString();
    const invitation = this.invitations.find((item) => item.token === token);
    const access = isInvitationAccessible(invitation, nowIso);

    if (!access.accessible || !invitation) {
      throw new Error(access.reason || 'Onboarding invitation link not found.');
    }

    return {
      ...invitation,
      status: getEffectiveInvitationStatus(invitation, nowIso),
    };
  }

  async loadOnboardingSession(token: string): Promise<OnboardingSessionHydration> {
    const invitation = await this.getInvitationByToken(token);
    const formResponses =
      this.formResponsesByToken.get(token) ?? createInitialFormResponses();
    const uploadedDocuments = this.documentsByToken.get(token) ?? [];
    const finalDeclarationAccepted = this.declarationsByToken.get(token) ?? false;

    return {
      invitation,
      session: {
        invitationToken: token,
        formResponses,
        uploadedDocuments: [...uploadedDocuments],
        finalDeclarationAccepted,
        submittedAt: invitation.submittedAt ?? null,
        receiptCode: invitation.receiptCode ?? null,
      },
    };
  }

  async saveFormDraft(
    token: string,
    formId: AnyFormId,
    payload: OnboardingFormResponses[AnyFormId]
  ): Promise<{ formId: AnyFormId; isCompleted: boolean; updatedAt: string }> {
    const invitation = await this.getInvitationByToken(token);
    if (invitation.submittedAt) {
      throw new Error('This onboarding packet has already been submitted and locked.');
    }

    const updatedAt = new Date().toISOString();
    const currentResponses =
      this.formResponsesByToken.get(token) ?? createInitialFormResponses();
    const nextResponses: OnboardingFormResponses = {
      ...currentResponses,
      [formId]: {
        ...payload,
        updatedAt,
      },
    };
    this.formResponsesByToken.set(token, nextResponses);

    const isCompleted = isFormSlotCompleted(formId, nextResponses);
    this.invitations = this.invitations.map((item) =>
      item.token === token && item.submissionState === 'not_submitted'
        ? { ...item, submissionState: 'in_progress' }
        : item
    );
    this.appendAudit(invitation.id, 'employee', `employee:${invitation.id}`, 'FORM_DRAFT_SAVED', {
      formId,
      isCompleted,
    });

    return { formId, isCompleted, updatedAt };
  }

  async saveFinalDeclaration(token: string, accepted: boolean): Promise<{ accepted: boolean }> {
    const invitation = await this.getInvitationByToken(token);
    if (invitation.submittedAt) {
      throw new Error('This onboarding packet has already been submitted and locked.');
    }
    this.declarationsByToken.set(token, Boolean(accepted));
    return { accepted: Boolean(accepted) };
  }

  async uploadOnboardingDocument(
    token: string,
    slotId: string,
    slotLabel: string,
    file: File
  ): Promise<UploadedDocumentItem> {
    const invitation = await this.getInvitationByToken(token);
    if (invitation.submittedAt) {
      throw new Error('This onboarding packet has already been submitted and locked.');
    }

    const check = validateDocumentFile({
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
    });
    if (!check.valid) {
      throw new Error(check.error || 'Invalid upload file.');
    }

    const doc: UploadedDocumentItem = {
      id: `doc-${generateRandomHex(6)}`,
      slotId,
      slotLabel,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storageBucketPath: buildSupabaseStoragePath(invitation.id, slotId, file.name),
      uploadedAt: new Date().toISOString(),
      storageMode: 'stage1_memory_preview',
    };

    const existing = this.documentsByToken.get(token) ?? [];
    this.documentsByToken.set(token, [...existing, doc]);

    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        this.previewObjectUrls.set(doc.id, URL.createObjectURL(file));
      } catch {
        // Ignore in non-DOM test environments
      }
    }

    const lowerMime = file.type.toLowerCase();
    if (
      slotId === 'upload-slot-photograph' &&
      (lowerMime === 'image/jpeg' || lowerMime === 'image/jpg' || lowerMime === 'image/png') &&
      typeof file.arrayBuffer === 'function'
    ) {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (bytes.length > 0) {
          this.previewPhotoAssets.set(doc.id, { bytes, mimeType: file.type });
        }
      } catch {
        // Ignore if file bytes cannot be read in preview
      }
    }

    this.appendAudit(invitation.id, 'employee', `employee:${invitation.id}`, 'DOCUMENT_UPLOADED', {
      fileName: doc.fileName,
      slotId: doc.slotId,
    });
    return doc;
  }

  async deleteOnboardingDocument(token: string, documentId: string): Promise<void> {
    const invitation = await this.getInvitationByToken(token);
    if (invitation.submittedAt) {
      throw new Error('This onboarding packet has already been submitted and locked.');
    }
    const existing = this.documentsByToken.get(token) ?? [];
    this.documentsByToken.set(
      token,
      existing.filter((d) => d.id !== documentId)
    );
    const objectUrl = this.previewObjectUrls.get(documentId);
    if (objectUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(objectUrl);
      this.previewObjectUrls.delete(documentId);
    }
  }

  async submitPreviewOnboarding(
    token: string,
    session: OnboardingSessionState
  ): Promise<PreviewSubmitReceipt> {
    const nowIso = new Date().toISOString();
    const invitation = this.invitations.find((item) => item.token === token);
    const access = isInvitationAccessible(invitation, nowIso);

    if (!access.accessible || !invitation) {
      throw new Error(access.reason || 'Onboarding invitation link not found.');
    }
    if (invitation.submittedAt) {
      throw new Error('This onboarding packet has already been submitted and locked.');
    }

    const progress = calculateOnboardingProgress(session);
    if (!progress.readyForSubmission) {
      throw new Error(
        'All nine form slots, at least one document upload, and the final confirmation checkbox are required before submission.'
      );
    }

    const submittedAt = new Date().toISOString();
    const receiptCode = generatePreviewReceiptCode();

    this.formResponsesByToken.set(token, session.formResponses);
    this.documentsByToken.set(token, session.uploadedDocuments);
    this.declarationsByToken.set(token, true);
    this.invitations = this.invitations.map((item) =>
      item.token === token
        ? {
            ...item,
            submissionState: 'preview_completed',
            submittedAt,
            receiptCode,
          }
        : item
    );
    this.appendAudit(invitation.id, 'employee', `employee:${invitation.id}`, 'ONBOARDING_SUBMITTED', {
      receiptCode,
    });

    return {
      receiptCode,
      submittedAt,
      mode: 'stage1_preview',
      message:
        'Stage 1 dry-run verification succeeded. Configure Supabase credentials and migrations to persist submissions permanently.',
    };
  }

  async listSubmissions(): Promise<HrSubmissionSummary[]> {
    const invs = await this.listInvitations();
    return invs.map((inv) => {
      const responses = this.formResponsesByToken.get(inv.token) ?? createInitialFormResponses();
      const docs = this.documentsByToken.get(inv.token) ?? [];
      let completedFormsCount = 0;
      for (const f of HR_FORMS_CATALOG) {
        if (isFormSlotCompleted(f.id as AnyFormId, responses)) {
          completedFormsCount += 1;
        }
      }
      return {
        invitation: inv,
        completedFormsCount,
        documentsCount: docs.length,
        applicantName: responses['form-01'].nameInCapitals || '',
      };
    });
  }

  async getSubmissionDetail(invitationId: string): Promise<HrSubmissionDetail> {
    const inv = this.invitations.find((i) => i.id === invitationId);
    if (!inv) {
      throw new Error('Invitation record was not found.');
    }
    return {
      invitation: { ...inv, status: getEffectiveInvitationStatus(inv) },
      formResponses: this.formResponsesByToken.get(inv.token) ?? createInitialFormResponses(),
      uploadedDocuments: [...(this.documentsByToken.get(inv.token) ?? [])],
      officeUse:
        this.officeUseByInvitationId.get(invitationId) ?? createEmptyOfficeUseEntry(invitationId),
      auditLogs: [...(this.auditLogsByInvitationId.get(invitationId) ?? [])],
    };
  }

  async saveOfficeUseEntry(
    invitationId: string,
    patch: Partial<HrOfficeUseEntry> & { markVerified?: boolean }
  ): Promise<HrOfficeUseEntry> {
    const current =
      this.officeUseByInvitationId.get(invitationId) ?? createEmptyOfficeUseEntry(invitationId);
    const updated: HrOfficeUseEntry = {
      ...current,
      ...patch,
      invitationId,
      updatedByAdminId: 'stage1-preview',
      updatedAt: new Date().toISOString(),
    };
    this.officeUseByInvitationId.set(invitationId, updated);
    if (patch.markVerified) {
      this.invitations = this.invitations.map((inv) =>
        inv.id === invitationId ? { ...inv, submissionState: 'hr_verified' } : inv
      );
    }
    this.appendAudit(
      invitationId,
      'hr_admin',
      'stage1-preview',
      patch.markVerified ? 'HR_SUBMISSION_VERIFIED' : 'HR_OFFICE_USE_UPDATED'
    );
    return updated;
  }

  async getDocumentDownloadUrl(documentId: string): Promise<SignedDownloadUrlResponse> {
    for (const docs of this.documentsByToken.values()) {
      const match = docs.find((d) => d.id === documentId);
      if (match) {
        const previewUrl = this.previewObjectUrls.get(documentId);
        if (!previewUrl) {
          throw new Error(
            'Document preview URL is unavailable in memory. Connect Supabase Storage for persistent signed downloads.'
          );
        }
        return {
          downloadUrl: previewUrl,
          expiresInSeconds: 120,
          fileName: match.fileName,
        };
      }
    }
    throw new Error('Document record not found.');
  }

  private async fetchOriginalTemplateBytes(formId: AnyFormId): Promise<Uint8Array> {
    const cached = this.templateCache.get(formId);
    if (cached) return cached;
    const desc = ORIGINAL_FORM_PDF_BY_ID[formId];
    if (!desc) {
      throw new Error(`Unknown form template: ${formId}`);
    }
    const res = await fetch(desc.templateAssetPath);
    if (!res.ok) {
      throw new Error(`Failed to load original PDF template (${desc.code}).`);
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    this.templateCache.set(formId, bytes);
    return bytes;
  }

  private resolvePreviewPhotos(detail: HrSubmissionDetail): OnboardingPdfPhotoAssets {
    const f1Doc = pickPhotographDocumentForForm(
      detail.uploadedDocuments,
      detail.formResponses['form-01'].photoFileName
    );
    const f6Doc = pickPhotographDocumentForForm(detail.uploadedDocuments, '');
    return {
      form01Photo: f1Doc ? this.previewPhotoAssets.get(f1Doc.id) ?? null : null,
      form06Photo: f6Doc ? this.previewPhotoAssets.get(f6Doc.id) ?? null : null,
    };
  }

  async exportSubmissionFormPdf(
    invitationId: string,
    formId: AnyFormId
  ): Promise<{ blob: Blob; fileName: string }> {
    const detail = await this.getSubmissionDetail(invitationId);
    const templateBytes = await this.fetchOriginalTemplateBytes(formId);
    const pdfBytes = await buildFilledOriginalFormPdf(
      formId,
      detail,
      templateBytes,
      this.resolvePreviewPhotos(detail)
    );
    const fileName = getOriginalFormPdfFileName(formId);
    this.appendAudit(invitationId, 'hr_admin', 'stage1-preview', 'FORM_PDF_EXPORTED', {
      formId,
      fileName,
    });
    return {
      blob: new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }),
      fileName,
    };
  }

  async exportSubmissionAllFormsZip(
    invitationId: string
  ): Promise<{ blob: Blob; fileName: string }> {
    const detail = await this.getSubmissionDetail(invitationId);
    const entries = await Promise.all(
      ORIGINAL_FORM_PDF_DESCRIPTORS.map(
        async (desc) => [desc.formId, await this.fetchOriginalTemplateBytes(desc.formId)] as const
      )
    );
    const templatesByFormId = Object.fromEntries(entries) as Record<AnyFormId, Uint8Array>;
    const zipBytes = await buildAllNineOriginalFormsZip(
      detail,
      templatesByFormId,
      this.resolvePreviewPhotos(detail)
    );
    const fileName = buildOnboardingFormsZipFileName(detail);
    this.appendAudit(invitationId, 'hr_admin', 'stage1-preview', 'ALL_FORMS_ZIP_EXPORTED', {
      fileName,
    });
    return {
      blob: new Blob([new Uint8Array(zipBytes)], { type: 'application/zip' }),
      fileName,
    };
  }
}

/**
 * Stage 2 Production Repository backed by Express API routes (/api/*) and Supabase
 * PostgreSQL + Auth + private Storage signed URLs. Never uses SUPABASE_SERVICE_ROLE_KEY
 * directly in the browser.
 */
export class SupabaseApiRepository implements OnboardingRepository {
  private accessTokenProvider: (() => Promise<string | null>) | null = null;

  setAccessTokenProvider(provider: (() => Promise<string | null>) | null): void {
    this.accessTokenProvider = provider;
  }

  private async resolveAccessToken(): Promise<string | null> {
    if (this.accessTokenProvider) {
      return this.accessTokenProvider();
    }
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session?.access_token ?? null;
  }

  private async apiRequest<T>(
    path: string,
    init: RequestInit & { requireAuth?: boolean } = {}
  ): Promise<T> {
    const { requireAuth = false, headers: rawHeaders, ...rest } = init;
    const headers = new Headers(rawHeaders);
    if (rest.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (requireAuth) {
      const token = await this.resolveAccessToken();
      if (!token) {
        throw new Error('HR Admin sign-in is required to access this endpoint.');
      }
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(path, { ...rest, headers });
    const text = await res.text();
    let parsed: Record<string, unknown> = {};
    if (text) {
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new Error(`Unexpected server response (${res.status}).`);
      }
    }

    if (!res.ok) {
      const errMessage =
        typeof parsed.error === 'string' && parsed.error.length > 0
          ? parsed.error
          : `Request failed with status ${res.status}.`;
      throw new Error(errMessage);
    }

    return parsed as T;
  }

  async getReadiness(): Promise<SupabaseReadinessInfo> {
    try {
      const health = await this.apiRequest<{ supabase: SupabaseReadinessInfo }>('/api/health');
      if (health.supabase.publicAuthConfig) {
        configureSupabasePublicEnv(
          health.supabase.publicAuthConfig.url,
          health.supabase.publicAuthConfig.anonKey
        );
      }
      return {
        ...health.supabase,
        authEnforced: true,
      };
    } catch {
      return {
        ...getSupabaseConfig().readiness,
        authEnforced: true,
      };
    }
  }

  async getCurrentHrUser(): Promise<HrUserProfile | null> {
    const token = await this.resolveAccessToken();
    if (!token) return null;
    try {
      const res = await this.apiRequest<{ hrUser: HrUserProfile }>('/api/admin/me', {
        requireAuth: true,
      });
      return res.hrUser;
    } catch {
      return null;
    }
  }

  async listForms(): Promise<HRFormDefinition[]> {
    const res = await this.apiRequest<{ forms: HRFormDefinition[] }>('/api/forms');
    return res.forms;
  }

  async listInvitations(): Promise<OnboardingInvitation[]> {
    const res = await this.apiRequest<{ invitations: OnboardingInvitation[] }>(
      '/api/admin/invitations',
      { requireAuth: true }
    );
    return res.invitations;
  }

  async createInvitation(input: CreateInvitationInput): Promise<OnboardingInvitation> {
    const res = await this.apiRequest<{ invitation: OnboardingInvitation }>(
      '/api/admin/invitations',
      {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify(input),
      }
    );
    return res.invitation;
  }

  async expireInvitation(id: string): Promise<OnboardingInvitation> {
    const res = await this.apiRequest<{ invitation: OnboardingInvitation }>(
      `/api/admin/invitations/${encodeURIComponent(id)}/expire`,
      {
        method: 'POST',
        requireAuth: true,
      }
    );
    return res.invitation;
  }

  async getInvitationByToken(token: string): Promise<OnboardingInvitation> {
    const res = await this.loadOnboardingSession(token);
    return res.invitation;
  }

  async loadOnboardingSession(token: string): Promise<OnboardingSessionHydration> {
    return this.apiRequest<OnboardingSessionHydration>(
      `/api/onboard/${encodeURIComponent(token)}`
    );
  }

  async saveFormDraft(
    token: string,
    formId: AnyFormId,
    payload: OnboardingFormResponses[AnyFormId]
  ): Promise<{ formId: AnyFormId; isCompleted: boolean; updatedAt: string }> {
    return this.apiRequest<{ formId: AnyFormId; isCompleted: boolean; updatedAt: string }>(
      `/api/onboard/${encodeURIComponent(token)}/forms/${encodeURIComponent(formId)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ payload }),
      }
    );
  }

  async saveFinalDeclaration(token: string, accepted: boolean): Promise<{ accepted: boolean }> {
    return this.apiRequest<{ accepted: boolean }>(
      `/api/onboard/${encodeURIComponent(token)}/declaration`,
      {
        method: 'PUT',
        body: JSON.stringify({ accepted }),
      }
    );
  }

  async uploadOnboardingDocument(
    token: string,
    slotId: string,
    slotLabel: string,
    file: File
  ): Promise<UploadedDocumentItem> {
    const check = validateDocumentFile({
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
    });
    if (!check.valid) {
      throw new Error(check.error || 'Invalid upload file.');
    }

    const signed = await this.apiRequest<SignedUploadUrlResponse>(
      `/api/onboard/${encodeURIComponent(token)}/documents/upload-url`,
      {
        method: 'POST',
        body: JSON.stringify({
          slotId,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      }
    );

    const uploadRes = await fetch(signed.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Private storage upload failed with status ${uploadRes.status}.`);
    }

    const recorded = await this.apiRequest<{ document: UploadedDocumentItem }>(
      `/api/onboard/${encodeURIComponent(token)}/documents`,
      {
        method: 'POST',
        body: JSON.stringify({
          slotId,
          slotLabel,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          storagePath: signed.storagePath,
        }),
      }
    );

    return recorded.document;
  }

  async deleteOnboardingDocument(token: string, documentId: string): Promise<void> {
    await this.apiRequest<{ deleted: boolean }>(
      `/api/onboard/${encodeURIComponent(token)}/documents/${encodeURIComponent(documentId)}`,
      { method: 'DELETE' }
    );
  }

  async submitPreviewOnboarding(
    token: string,
    session: OnboardingSessionState
  ): Promise<PreviewSubmitReceipt> {
    const res = await this.apiRequest<{
      receiptCode: string;
      submittedAt: string;
      message: string;
    }>(`/api/onboard/${encodeURIComponent(token)}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        finalDeclarationAccepted: session.finalDeclarationAccepted,
      }),
    });

    return {
      receiptCode: res.receiptCode,
      submittedAt: res.submittedAt,
      mode: 'supabase_connected',
      message: res.message,
    };
  }

  async listSubmissions(): Promise<HrSubmissionSummary[]> {
    const res = await this.apiRequest<{ submissions: HrSubmissionSummary[] }>(
      '/api/admin/submissions',
      { requireAuth: true }
    );
    return res.submissions;
  }

  async getSubmissionDetail(invitationId: string): Promise<HrSubmissionDetail> {
    const res = await this.apiRequest<{ detail: HrSubmissionDetail }>(
      `/api/admin/submissions/${encodeURIComponent(invitationId)}`,
      { requireAuth: true }
    );
    return res.detail;
  }

  async saveOfficeUseEntry(
    invitationId: string,
    patch: Partial<HrOfficeUseEntry> & { markVerified?: boolean }
  ): Promise<HrOfficeUseEntry> {
    const res = await this.apiRequest<{ officeUse: HrOfficeUseEntry }>(
      `/api/admin/submissions/${encodeURIComponent(invitationId)}/office-use`,
      {
        method: 'PUT',
        requireAuth: true,
        body: JSON.stringify(patch),
      }
    );
    return res.officeUse;
  }

  async getDocumentDownloadUrl(documentId: string): Promise<SignedDownloadUrlResponse> {
    return this.apiRequest<SignedDownloadUrlResponse>(
      `/api/admin/documents/${encodeURIComponent(documentId)}/download-url`,
      { requireAuth: true }
    );
  }

  private async fetchBinaryExport(
    path: string,
    fallbackFileName: string,
    defaultErrorPrefix: string
  ): Promise<{ blob: Blob; fileName: string }> {
    const token = await this.resolveAccessToken();
    if (!token) {
      throw new Error('HR Admin sign-in is required to export onboarding forms.');
    }

    const res = await fetch(path, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      let errMessage = `${defaultErrorPrefix} failed with status ${res.status}.`;
      try {
        const parsed = (await res.json()) as { error?: string };
        if (typeof parsed.error === 'string' && parsed.error.length > 0) {
          errMessage = parsed.error;
        }
      } catch {
        // Ignore JSON parse error for non-JSON error responses
      }
      throw new Error(errMessage);
    }

    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/i);
    const fileName = match?.[1] || fallbackFileName;
    const blob = await res.blob();
    return { blob, fileName };
  }

  async exportSubmissionFormPdf(
    invitationId: string,
    formId: AnyFormId
  ): Promise<{ blob: Blob; fileName: string }> {
    return this.fetchBinaryExport(
      `/api/admin/submissions/${encodeURIComponent(invitationId)}/forms/${encodeURIComponent(formId)}/pdf`,
      getOriginalFormPdfFileName(formId),
      'Form PDF export'
    );
  }

  async exportSubmissionAllFormsZip(
    invitationId: string
  ): Promise<{ blob: Blob; fileName: string }> {
    return this.fetchBinaryExport(
      `/api/admin/submissions/${encodeURIComponent(invitationId)}/pdfs.zip`,
      `DICS-Onboarding-Forms-${invitationId}.zip`,
      'Onboarding ZIP export'
    );
  }
}

export function createOnboardingRepository(): OnboardingRepository {
  return new SupabaseApiRepository();
}

export const onboardingRepository: OnboardingRepository = createOnboardingRepository();
