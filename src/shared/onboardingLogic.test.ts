import test from 'node:test';
import assert from 'node:assert/strict';
import { HR_FORMS_CATALOG } from './formsCatalog';
import {
  buildSupabaseStoragePath,
  calculateOnboardingProgress,
  createInitialSessionState,
  formatBytes,
  isInvitationAccessible,
  validateDocumentFile,
} from './onboardingLogic';
import type { OnboardingInvitation } from './types';

test('catalog contains exactly 9 separate original HR form slots', () => {
  assert.equal(HR_FORMS_CATALOG.length, 9);
  assert.equal(HR_FORMS_CATALOG[0].code, 'DICS-HR-01');
  assert.equal(HR_FORMS_CATALOG[8].code, 'DICS-HR-09');
});

test('calculateOnboardingProgress tracks forms, uploads, and submission deterministically', () => {
  const session = createInitialSessionState('dics-stage1-preview');
  const initial = calculateOnboardingProgress(session);
  assert.equal(initial.completedFormsCount, 0);
  assert.equal(initial.totalFormsCount, 9);
  assert.equal(initial.percentComplete, 0);
  assert.equal(initial.readyForSubmission, false);
  assert.deepEqual(initial.incompleteFormNumbers, [1, 2, 3, 4, 5, 6, 7, 8, 9]);

  // Complete all 9 form slots
  for (const form of HR_FORMS_CATALOG) {
    session.formsById[form.id] = {
      ...session.formsById[form.id],
      templateFieldOne: 'Preview Reference Value',
      reviewedAndConfirmed: true,
      updatedAt: '2026-11-18T00:00:00.000Z',
    };
  }

  const afterForms = calculateOnboardingProgress(session);
  assert.equal(afterForms.completedFormsCount, 9);
  assert.equal(afterForms.incompleteFormNumbers.length, 0);
  assert.equal(afterForms.readyForSubmission, false); // still needs upload + declaration

  // Add a document upload
  session.uploadedDocuments.push({
    id: 'doc-1',
    slotId: 'upload-slot-general',
    slotLabel: 'General Onboarding Document Slot',
    fileName: 'sample-record.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 20480,
    storageBucketPath: buildSupabaseStoragePath('dics-stage1-preview', 'upload-slot-general', 'sample-record.pdf'),
    uploadedAt: '2026-11-18T00:05:00.000Z',
    storageMode: 'stage1_memory_preview',
  });
  session.finalDeclarationAccepted = true;

  const readyState = calculateOnboardingProgress(session);
  assert.equal(readyState.hasUploadedDocument, true);
  assert.equal(readyState.readyForSubmission, true);
  assert.equal(readyState.percentComplete, 91); // 10 of 11 milestones complete

  session.submittedAt = '2026-11-18T00:10:00.000Z';
  const submittedState = calculateOnboardingProgress(session);
  assert.equal(submittedState.percentComplete, 100);
});

test('validateDocumentFile enforces MIME type and size limits', () => {
  assert.equal(
    validateDocumentFile({ name: 'form.pdf', sizeBytes: 1024, mimeType: 'application/pdf' }).valid,
    true
  );
  assert.equal(
    validateDocumentFile({ name: 'scan.jpg', sizeBytes: 1024, mimeType: 'image/jpeg' }).valid,
    true
  );
  assert.equal(
    validateDocumentFile({ name: 'script.exe', sizeBytes: 1024, mimeType: 'application/x-msdownload' }).valid,
    false
  );
  assert.equal(
    validateDocumentFile({ name: 'huge.pdf', sizeBytes: 12 * 1024 * 1024, mimeType: 'application/pdf' }).valid,
    false
  );
  assert.equal(
    validateDocumentFile({ name: 'empty.pdf', sizeBytes: 0, mimeType: 'application/pdf' }).valid,
    false
  );
});

test('buildSupabaseStoragePath sanitizes filenames cleanly', () => {
  const path = buildSupabaseStoragePath('dics-token_01', 'upload-slot-general', 'Offer Letter (Signed) #1.pdf');
  assert.equal(path, 'onboarding/dics-token_01/upload-slot-general/Offer-Letter-Signed-1.pdf');
});

test('isInvitationAccessible validates existence and expiry dates', () => {
  const validInvite: OnboardingInvitation = {
    id: 'inv-1',
    token: 'dics-stage1-preview',
    referenceLabel: 'Sample Link',
    department: 'Controls Engineering',
    targetRole: 'Template Preview',
    status: 'preview',
    createdAt: '2026-11-18T00:00:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z',
    invitePath: '/onboard/dics-stage1-preview',
    submissionState: 'not_submitted',
  };

  assert.equal(isInvitationAccessible(validInvite, '2026-11-18T12:00:00.000Z').accessible, true);
  assert.equal(isInvitationAccessible(validInvite, '2027-01-02T00:00:00.000Z').accessible, false);
  assert.equal(isInvitationAccessible(undefined).accessible, false);
});

test('formatBytes formats sizes legibly', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(2048), '2.0 KB');
  assert.equal(formatBytes(1048576), '1.00 MB');
});
