import { HR_FORMS_CATALOG } from './formsCatalog';
import type {
  FileValidationResult,
  FormSlotDraft,
  OnboardingInvitation,
  OnboardingSessionState,
  ProgressBreakdown,
} from './types';

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function createInitialSessionState(invitationToken: string): OnboardingSessionState {
  const formsById: Record<string, FormSlotDraft> = {};
  for (const form of HR_FORMS_CATALOG) {
    formsById[form.id] = {
      formId: form.id,
      templateFieldOne: '',
      templateFieldTwo: '',
      applicantNotes: '',
      reviewedAndConfirmed: false,
      updatedAt: null,
    };
  }

  return {
    invitationToken,
    formsById,
    uploadedDocuments: [],
    finalDeclarationAccepted: false,
    submittedAt: null,
    receiptCode: null,
  };
}

export function isFormSlotCompleted(draft: FormSlotDraft | undefined): boolean {
  if (!draft) {
    return false;
  }
  return Boolean(
    draft.reviewedAndConfirmed &&
      draft.templateFieldOne.trim().length > 0
  );
}

export function calculateOnboardingProgress(session: OnboardingSessionState): ProgressBreakdown {
  const totalFormsCount = HR_FORMS_CATALOG.length;
  const incompleteFormNumbers: number[] = [];
  let completedFormsCount = 0;

  for (const form of HR_FORMS_CATALOG) {
    const draft = session.formsById[form.id];
    if (isFormSlotCompleted(draft)) {
      completedFormsCount += 1;
    } else {
      incompleteFormNumbers.push(form.formNumber);
    }
  }

  const uploadedDocumentsCount = session.uploadedDocuments.length;
  const hasUploadedDocument = uploadedDocumentsCount > 0;
  const isSubmitted = Boolean(session.submittedAt);

  // Total milestones = 9 form slots + 1 document upload milestone + 1 final submission milestone = 11
  const totalMilestones = totalFormsCount + 2;
  const completedMilestones =
    completedFormsCount +
    (hasUploadedDocument ? 1 : 0) +
    (isSubmitted ? 1 : 0);

  const percentComplete = Math.round((completedMilestones / totalMilestones) * 100);
  const readyForSubmission =
    completedFormsCount === totalFormsCount &&
    hasUploadedDocument &&
    session.finalDeclarationAccepted;

  return {
    completedFormsCount,
    totalFormsCount,
    hasUploadedDocument,
    uploadedDocumentsCount,
    finalDeclarationAccepted: session.finalDeclarationAccepted,
    isSubmitted,
    percentComplete,
    readyForSubmission,
    incompleteFormNumbers,
  };
}

export function validateDocumentFile(file: {
  name: string;
  sizeBytes: number;
  mimeType: string;
}): FileValidationResult {
  if (!file.name || file.name.trim().length === 0) {
    return { valid: false, error: 'File name is required.' };
  }

  if (file.sizeBytes <= 0) {
    return { valid: false, error: 'Selected file is empty.' };
  }

  if (file.sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File exceeds the 10 MB maximum upload limit.',
    };
  }

  const normalizedType = file.mimeType.toLowerCase();
  const isAllowed = (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(normalizedType);
  if (!isAllowed) {
    return {
      valid: false,
      error: 'Only PDF, JPG, and PNG files are accepted.',
    };
  }

  return { valid: true };
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
  return base.replace(/^-+|-+$/g, '') || 'document.pdf';
}

export function buildSupabaseStoragePath(
  invitationToken: string,
  slotId: string,
  fileName: string
): string {
  const safeToken = invitationToken.replace(/[^a-zA-Z0-9_-]/g, '') || 'unknown-token';
  const safeSlot = slotId.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
  const safeName = sanitizeFileName(fileName);
  return `onboarding/${safeToken}/${safeSlot}/${safeName}`;
}

export function isInvitationAccessible(
  invitation: OnboardingInvitation | undefined,
  nowIso: string = new Date().toISOString()
): { accessible: boolean; reason?: string } {
  if (!invitation) {
    return { accessible: false, reason: 'Invitation token was not found.' };
  }
  if (invitation.status === 'expired') {
    return { accessible: false, reason: 'This onboarding invitation link has expired.' };
  }
  if (Date.parse(invitation.expiresAt) < Date.parse(nowIso)) {
    return { accessible: false, reason: 'This onboarding invitation link has passed its expiry date.' };
  }
  return { accessible: true };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function generatePreviewToken(seedLabel: string): string {
  const slug = seedLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 18) || 'invite';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `dics-${slug}-${suffix}`;
}
