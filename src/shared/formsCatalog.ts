import type { HRFormDefinition } from './types';

/**
 * Stage 1 structural registry for the nine original DICS Global onboarding documents.
 * Content fields are intentionally kept as neutral template placeholders until the
 * original nine HR documents are supplied and mapped in Stage 2.
 */
export const HR_FORMS_CATALOG: HRFormDefinition[] = Array.from({ length: 9 }, (_, index) => {
  const num = index + 1;
  const padded = String(num).padStart(2, '0');
  return {
    id: `form-${padded}`,
    formNumber: num,
    code: `DICS-HR-${padded}`,
    title: `Original HR Document ${padded} — Template Slot`,
    summary:
      'Structural container reserved for the corresponding original DICS Global onboarding form. Exact field labels and clauses will be mapped directly from the source document.',
    mappingStatus: 'awaiting_source_document',
    sectionSlots: [
      {
        id: `form-${padded}-sec-a`,
        heading: 'Section A — Source Form Header & Reference Block',
        description: 'Reserved for original document metadata, version identifier, and applicant reference.',
      },
      {
        id: `form-${padded}-sec-b`,
        heading: 'Section B — Structured Input Fields (Pending Mapping)',
        description: 'Configurable field schema to mirror the exact entries of original HR document ' + padded + '.',
      },
      {
        id: `form-${padded}-sec-c`,
        heading: 'Section C — Applicant Confirmation & Sign-Off Block',
        description: 'Reserved for document-specific attestation and date capture.',
      },
    ],
    attachmentSlotId: `attachment-slot-${padded}`,
    attachmentSlotLabel: `Document Attachment Slot ${padded} (Configurable)`,
  };
});

export interface DocumentUploadCategory {
  slotId: string;
  label: string;
  description: string;
  linkedFormCode: string;
}

export const DOCUMENT_UPLOAD_CATEGORIES: DocumentUploadCategory[] = [
  {
    slotId: 'upload-slot-general',
    label: 'General Onboarding Document Slot',
    description: 'Primary upload container mapped to private Supabase Storage path.',
    linkedFormCode: 'DICS-HR-01 to 09',
  },
  {
    slotId: 'upload-slot-signed-forms',
    label: 'Signed / Scanned Original Form Slot',
    description: 'Reserved for any wet-signed or scanned copy required by the original HR forms.',
    linkedFormCode: 'Configurable',
  },
  {
    slotId: 'upload-slot-supporting',
    label: 'Supporting Verification Record Slot',
    description: 'Additional supporting PDF or image file attached to the invitation token.',
    linkedFormCode: 'Configurable',
  },
];
