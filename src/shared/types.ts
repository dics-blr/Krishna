export type AdminNavSection = 'overview' | 'invitations' | 'forms' | 'architecture';

export type InvitationStatus = 'preview' | 'active' | 'expired';

export type MappingStatus = 'awaiting_source_document' | 'mapped';

export interface FormSectionSlot {
  id: string;
  heading: string;
  description: string;
}

export interface HRFormDefinition {
  id: string;
  formNumber: number;
  code: string;
  title: string;
  summary: string;
  mappingStatus: MappingStatus;
  sectionSlots: FormSectionSlot[];
  attachmentSlotId: string;
  attachmentSlotLabel: string;
}

export interface OnboardingInvitation {
  id: string;
  token: string;
  referenceLabel: string;
  department: string;
  targetRole: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  invitePath: string;
  submissionState: 'not_submitted' | 'preview_completed';
}

export interface FormSlotDraft {
  formId: string;
  templateFieldOne: string;
  templateFieldTwo: string;
  applicantNotes: string;
  reviewedAndConfirmed: boolean;
  updatedAt: string | null;
}

export interface UploadedDocumentItem {
  id: string;
  slotId: string;
  slotLabel: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageBucketPath: string;
  uploadedAt: string;
  storageMode: 'stage1_memory_preview';
}

export interface OnboardingSessionState {
  invitationToken: string;
  formsById: Record<string, FormSlotDraft>;
  uploadedDocuments: UploadedDocumentItem[];
  finalDeclarationAccepted: boolean;
  submittedAt: string | null;
  receiptCode: string | null;
}

export interface ProgressBreakdown {
  completedFormsCount: number;
  totalFormsCount: number;
  hasUploadedDocument: boolean;
  uploadedDocumentsCount: number;
  finalDeclarationAccepted: boolean;
  isSubmitted: boolean;
  percentComplete: number;
  readyForSubmission: boolean;
  incompleteFormNumbers: number[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface SupabaseReadinessInfo {
  configured: boolean;
  mode: 'stage1_preview' | 'supabase_connected';
  databaseSchemaFile: string;
  storageBucketName: string;
  authNotice: string;
}
