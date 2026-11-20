import test from 'node:test';
import assert from 'node:assert/strict';
import { HR_FORMS_CATALOG } from './formsCatalog';
import {
  DICS_DEPARTMENTS,
  DICS_JOB_DESIGNATIONS,
  buildSupabaseStoragePath,
  calculateOnboardingProgress,
  createEmptyOfficeUseEntry,
  createInitialFormResponses,
  createInitialSessionState,
  filterInvitations,
  formatBytes,
  formatInvitationTokenHint,
  generateInvitationToken,
  generateSubmissionReceiptCode,
  getEffectiveInvitationStatus,
  getFormProgressState,
  getFormResponseSummary,
  getFriendlyFormTitle,
  getFriendlySubmissionStatus,
  isInvitationAccessible,
  isValidInvitationTokenFormat,
  isValidUuid,
  prefillFormFromBioData,
  validateDepartmentAndDesignation,
  validateDocumentFile,
  validateFormCompletion,
  validateInvitationInput,
} from './onboardingLogic';
import { Stage1InMemoryRepository } from '../lib/supabase/repository';
import type { AnyFormId, OnboardingFormResponses, OnboardingInvitation } from './types';

function populateAllForms(responses: OnboardingFormResponses): void {
  const sig = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  responses['form-01'] = {
    ...responses['form-01'],
    nameInCapitals: 'SAMPLE APPLICANT NAME',
    positionAppliedFor: 'Control Systems Engineer',
    presentAddress: 'Peenya 2nd Stage, Bengaluru',
    permanentAddress: 'Peenya 2nd Stage, Bengaluru',
    mobileNo: '9876543210',
    email: 'applicant@example.com',
    dateOfBirth: '1995-05-10',
    fatherName: 'Sample Father',
    emergencyContactName: 'Sample Emergency Contact',
    emergencyContactTel: '9876500001',
    reference1Name: 'Ref One',
    reference1Tel: '9876500002',
    reference2Name: 'Ref Two',
    reference2Tel: '9876500003',
    declarationConfirmed: true,
    place: 'Bengaluru',
    date: '2026-11-18',
    applicantSignatureDataUrl: sig,
    updatedAt: '2026-11-18T00:00:00.000Z',
  };

  responses['form-02'] = {
    ...responses['form-02'],
    name: 'SAMPLE APPLICANT NAME',
    fatherName: 'Sample Father',
    designation: 'Control Systems Engineer',
    dateOfBirth: '1995-05-10',
    dateOfJoining: '2026-11-18',
    contactNumber: '9876543210',
    presentAddress: 'Peenya 2nd Stage, Bengaluru',
    permanentAddress: 'Peenya 2nd Stage, Bengaluru',
    emergency1Name: 'Sample Emergency Contact',
    emergency1Mobile: '9876500001',
    date: '2026-11-18',
    signatureDataUrl: sig,
    declarationConfirmed: true,
    updatedAt: '2026-11-18T00:00:00.000Z',
  };

  responses['form-03'] = {
    ...responses['form-03'],
    employeeName: 'SAMPLE APPLICANT NAME',
    dateOfJoining: '2026-11-18',
    designation: 'Control Systems Engineer',
    department: 'Instrumentation & Controls',
    familyMembers: responses['form-03'].familyMembers.map((row, idx) =>
      idx === 0
        ? { ...row, memberName: 'SAMPLE APPLICANT NAME', dateOfBirth: '1995-05-10', gender: 'Male' }
        : row
    ),
    policyNoteConfirmed: true,
    employeeSignatureDataUrl: sig,
    updatedAt: '2026-11-18T00:00:00.000Z',
  };

  responses['form-04'] = {
    ...responses['form-04'],
    employeeName: 'SAMPLE APPLICANT NAME',
    designation: 'Control Systems Engineer',
    department: 'Instrumentation & Controls',
    employeeConfirmed: true,
    employeeConfirmDate: '2026-11-18',
    updatedAt: '2026-11-18T00:00:00.000Z',
  };

  responses['form-05'] = {
    ...responses['form-05'],
    nameInBlockLetters: 'SAMPLE APPLICANT NAME',
    fatherOrHusbandName: 'Sample Father',
    dateOfBirth: '1995-05-10',
    sex: 'Male',
    maritalStatus: 'Unmarried',
    permanentAddress: 'Peenya 2nd Stage, Bengaluru',
    partANominees: [
      {
        nomineeNameAndAddress: 'Sample Nominee, Bengaluru',
        relationship: 'Mother',
        dateOfBirth: '1970-01-01',
        shareProportion: '100%',
        minorGuardianDetails: '',
      },
    ],
    partASubscriberSignatureDataUrl: sig,
    partBDate: '2026-11-18',
    partBPlace: 'Bengaluru',
    partBSubscriberSignatureDataUrl: sig,
    declarationConfirmed: true,
    updatedAt: '2026-11-18T00:00:00.000Z',
  };

  responses['form-06'] = {
    ...responses['form-06'],
    nameInBlockLetters: 'SAMPLE APPLICANT NAME',
    fatherOrHusbandName: 'Sample Father',
    dateOfBirth: '1995-05-10',
    maritalStatus: 'U',
    sex: 'M',
    presentAddress: 'Peenya 2nd Stage, Bengaluru',
    presentPinCode: '560058',
    permanentAddress: 'Peenya 2nd Stage, Bengaluru',
    permanentPinCode: '560058',
    nomineeName: 'Sample Nominee',
    nomineeRelationship: 'Mother',
    nomineeAddress: 'Bengaluru',
    declarationConfirmed: true,
    ipSignatureDataUrl: sig,
    updatedAt: '2026-11-18T00:00:00.000Z',
  };

  responses['form-07'] = {
    ...responses['form-07'],
    nomineeName: 'Sample Nominee',
    relationshipWithEmployee: 'Mother',
    nomineeAddress: 'Bengaluru',
    witness1Details: 'Witness One, Bengaluru',
    witness2Details: 'Witness Two, Bengaluru',
    date: '2026-11-18',
    signatureDataUrl: sig,
    declarationConfirmed: true,
    updatedAt: '2026-11-18T00:00:00.000Z',
  };

  responses['form-08'] = {
    ...responses['form-08'],
    memberName: 'SAMPLE APPLICANT NAME',
    fatherOrSpouseName: 'Sample Father',
    dateOfBirth: '1995-05-10',
    gender: 'Male',
    maritalStatus: 'Unmarried',
    emailId: 'applicant@example.com',
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
    updatedAt: '2026-11-18T00:00:00.000Z',
  };

  responses['form-09'] = {
    ...responses['form-09'],
    employeeFullNameHeader: 'SAMPLE APPLICANT NAME',
    nominees: [
      {
        nomineeNameAndAddress: 'Sample Nominee, Bengaluru',
        relationship: 'Mother',
        age: '56',
        shareProportion: '100%',
      },
    ],
    statementEmployeeName: 'SAMPLE APPLICANT NAME',
    statementSex: 'Male',
    statementMaritalStatus: 'unmarried',
    statementDepartmentBranch: 'Instrumentation & Controls',
    permanentDistrict: 'Bengaluru Urban',
    permanentState: 'Karnataka',
    employeePlace: 'Bengaluru',
    employeeDate: '2026-11-18',
    employeeSignatureDataUrl: sig,
    witness1NameAndAddress: 'Witness One, Bengaluru',
    witness1SignatureDataUrl: sig,
    witness2NameAndAddress: 'Witness Two, Bengaluru',
    witness2SignatureDataUrl: sig,
    declarationConfirmed: true,
    updatedAt: '2026-11-18T00:00:00.000Z',
  };
}

test('catalog contains all 9 mapped original HR forms in sequence', () => {
  assert.equal(HR_FORMS_CATALOG.length, 9);
  assert.equal(HR_FORMS_CATALOG[0].code, 'DICS-HR-01');
  assert.equal(HR_FORMS_CATALOG[0].sourceFilename, 'Bio Data Form.pdf');
  assert.equal(HR_FORMS_CATALOG[8].code, 'DICS-HR-09');
  assert.equal(HR_FORMS_CATALOG[8].sourceFilename, 'Gratuity_Act_Form-F-Nomination-Gratuity.pdf');
  for (const form of HR_FORMS_CATALOG) {
    assert.equal(form.mappingStatus, 'mapped');
  }
});

test('validateFormCompletion fails on initial empty forms and passes when required fields + signatures are filled', () => {
  const responses = createInitialFormResponses();
  for (const form of HR_FORMS_CATALOG) {
    const res = validateFormCompletion(form.id as AnyFormId, responses);
    assert.equal(res.valid, false, `${form.code} should start invalid`);
    assert.ok(res.missingFields.length > 0, `${form.code} should report missing fields`);
  }

  populateAllForms(responses);
  for (const form of HR_FORMS_CATALOG) {
    const res = validateFormCompletion(form.id as AnyFormId, responses);
    assert.equal(
      res.valid,
      true,
      `${form.code} should be valid when populated (missing: ${res.missingFields.join(', ')})`
    );
  }
});

test('prefillFormFromBioData fills empty common fields without overwriting user entries', () => {
  const responses = createInitialFormResponses();
  responses['form-01'].nameInCapitals = 'ARUN KUMAR';
  responses['form-01'].fatherName = 'RAMESH KUMAR';
  responses['form-01'].positionAppliedFor = 'Controls Engineer';
  responses['form-01'].dateOfBirth = '1994-03-15';
  responses['form-01'].mobileNo = '9999988888';
  responses['form-01'].aadharNo = '111122223333';

  responses['form-02'].name = 'EXISTING CUSTOM NAME';
  const prefilled02 = prefillFormFromBioData('form-02', responses['form-01'], responses['form-02']);
  assert.equal(prefilled02.name, 'EXISTING CUSTOM NAME');
  assert.equal(prefilled02.fatherName, 'RAMESH KUMAR');
  assert.equal(prefilled02.designation, 'Controls Engineer');

  const prefilled08 = prefillFormFromBioData('form-08', responses['form-01'], responses['form-08']);
  assert.equal(prefilled08.memberName, 'ARUN KUMAR');
  assert.equal(prefilled08.aadharNumber, '111122223333');
});

test('calculateOnboardingProgress tracks all 9 forms, uploads, and submission deterministically', () => {
  const session = createInitialSessionState('dics-test-token');
  const initial = calculateOnboardingProgress(session);
  assert.equal(initial.completedFormsCount, 0);
  assert.equal(initial.totalFormsCount, 9);
  assert.equal(initial.percentComplete, 0);
  assert.equal(initial.readyForSubmission, false);
  assert.deepEqual(initial.incompleteFormNumbers, [1, 2, 3, 4, 5, 6, 7, 8, 9]);

  populateAllForms(session.formResponses);

  const afterForms = calculateOnboardingProgress(session);
  assert.equal(afterForms.completedFormsCount, 9);
  assert.equal(afterForms.incompleteFormNumbers.length, 0);
  assert.equal(afterForms.readyForSubmission, false); // still needs upload + declaration
  assert.equal(getFormResponseSummary('form-01', session.formResponses), 'SAMPLE APPLICANT NAME');

  // Add a document upload
  session.uploadedDocuments.push({
    id: 'doc-1',
    slotId: 'upload-slot-general',
    slotLabel: 'General / Signed Statutory Form Scans',
    fileName: 'sample-record.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 20480,
    storageBucketPath: buildSupabaseStoragePath('dics-test-token', 'upload-slot-general', 'sample-record.pdf'),
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

test('validateDocumentFile enforces MIME type, matching file extension, path safety, and size limits', () => {
  assert.equal(
    validateDocumentFile({ name: 'form.pdf', sizeBytes: 1024, mimeType: 'application/pdf' }).valid,
    true
  );
  assert.equal(
    validateDocumentFile({ name: 'scan.JPEG', sizeBytes: 1024, mimeType: 'image/jpeg' }).valid,
    true
  );
  assert.equal(
    validateDocumentFile({ name: 'photo.png', sizeBytes: 1024, mimeType: 'image/png' }).valid,
    true
  );
  assert.equal(
    validateDocumentFile({ name: 'script.exe', sizeBytes: 1024, mimeType: 'application/x-msdownload' }).valid,
    false
  );
  assert.equal(
    validateDocumentFile({ name: 'malware.exe', sizeBytes: 1024, mimeType: 'application/pdf' }).valid,
    false
  );
  assert.equal(
    validateDocumentFile({ name: 'fake.pdf', sizeBytes: 1024, mimeType: 'image/png' }).valid,
    false
  );
  assert.equal(
    validateDocumentFile({ name: '../evil.pdf', sizeBytes: 1024, mimeType: 'application/pdf' }).valid,
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

test('generateInvitationToken creates stronger 192-bit unique tokens and validates legacy + new formats', () => {
  const tokens = new Set<string>();
  for (let i = 0; i < 50; i += 1) {
    const token = generateInvitationToken(tokens);
    assert.match(token, /^dics-[0-9a-f]{48}$/);
    assert.equal(isValidInvitationTokenFormat(token), true);
    assert.equal(tokens.has(token), false);
    tokens.add(token);
  }

  // Legacy 96-bit token format (24 hex chars) remains valid for dual-read compatibility
  assert.equal(isValidInvitationTokenFormat('dics-abcdef1234567890abcdef12'), true);
  assert.equal(isValidInvitationTokenFormat('dics-doesnotexist'), false);
  assert.equal(isValidInvitationTokenFormat('../etc/passwd'), false);
  assert.equal(formatInvitationTokenHint('dics-abcdef1234567890abcdef12'), 'dics-••••ef12');
  assert.equal(isValidUuid('00000000-0000-4000-8000-000000000001'), true);
  assert.equal(isValidUuid('not-a-uuid'), false);
});

test('validateInvitationInput rejects empty or invalid submissions and normalizes valid ones', () => {
  assert.equal(
    validateInvitationInput({
      referenceLabel: '   ',
      department: 'Instrumentation & Controls',
      targetRole: 'Engineer',
      expiryDays: 14,
    }).valid,
    false
  );
  assert.equal(
    validateInvitationInput({
      referenceLabel: 'Batch A',
      department: 'Instrumentation & Controls',
      targetRole: ' ',
      expiryDays: 14,
    }).valid,
    false
  );
  assert.equal(
    validateInvitationInput({
      referenceLabel: 'Batch A',
      department: 'Instrumentation & Controls',
      targetRole: 'Engineer',
      expiryDays: 0,
    }).valid,
    false
  );
  const ok = validateInvitationInput({
    referenceLabel: '  Control Eng Batch  ',
    department: ' Instrumentation & Controls ',
    targetRole: ' Control Systems Engineer ',
    expiryDays: 14,
  });
  assert.equal(ok.valid, true);
  assert.deepEqual(ok.normalized, {
    referenceLabel: 'Control Eng Batch',
    department: 'Instrumentation & Controls',
    targetRole: 'Control Systems Engineer',
    expiryDays: 14,
  });
});

test('isInvitationAccessible and getEffectiveInvitationStatus validate existence and expiry', () => {
  const activeInvite: OnboardingInvitation = {
    id: 'inv-1',
    token: 'dics-abcdef1234567890abcdef12',
    referenceLabel: 'Controls Batch Link',
    department: 'Instrumentation & Controls',
    targetRole: 'Control Engineer',
    status: 'active',
    createdAt: '2026-11-18T00:00:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z',
    invitePath: '/onboard/dics-abcdef1234567890abcdef12',
    submissionState: 'not_submitted',
  };

  assert.equal(getEffectiveInvitationStatus(activeInvite, '2026-11-18T12:00:00.000Z'), 'active');
  assert.equal(getEffectiveInvitationStatus(activeInvite, '2027-01-02T00:00:00.000Z'), 'expired');
  assert.equal(isInvitationAccessible(activeInvite, '2026-11-18T12:00:00.000Z').accessible, true);
  assert.equal(isInvitationAccessible(activeInvite, '2027-01-02T00:00:00.000Z').accessible, false);
  assert.equal(
    isInvitationAccessible({ ...activeInvite, status: 'expired' }, '2026-11-18T12:00:00.000Z').accessible,
    false
  );
  assert.equal(isInvitationAccessible(undefined).accessible, false);
});

test('filterInvitations supports text search across fields and status filters', () => {
  const list: OnboardingInvitation[] = [
    {
      id: 'inv-1',
      token: 'dics-111111111111111111111111',
      referenceLabel: 'Alpha Batch',
      department: 'Automation Engineering',
      targetRole: 'PLC Programmer',
      status: 'active',
      createdAt: '2026-11-18T00:00:00.000Z',
      expiresAt: '2026-12-31T00:00:00.000Z',
      invitePath: '/onboard/dics-111111111111111111111111',
      submissionState: 'not_submitted',
    },
    {
      id: 'inv-2',
      token: 'dics-222222222222222222222222',
      referenceLabel: 'Beta Calibration',
      department: 'Quality & Calibration',
      targetRole: 'QA Specialist',
      status: 'expired',
      createdAt: '2026-11-01T00:00:00.000Z',
      expiresAt: '2026-12-31T00:00:00.000Z',
      invitePath: '/onboard/dics-222222222222222222222222',
      submissionState: 'not_submitted',
    },
  ];

  const now = '2026-11-18T12:00:00.000Z';
  assert.equal(filterInvitations(list, '', 'all', now).length, 2);
  assert.equal(filterInvitations(list, '', 'active', now).length, 1);
  assert.equal(filterInvitations(list, '', 'expired', now).length, 1);
  assert.equal(filterInvitations(list, 'plc', 'all', now)[0].id, 'inv-1');
  assert.equal(filterInvitations(list, '222222', 'expired', now)[0].id, 'inv-2');
  assert.equal(filterInvitations(list, '222222', 'active', now).length, 0);
});

test('formatBytes formats sizes legibly', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(2048), '2.0 KB');
  assert.equal(formatBytes(1048576), '1.00 MB');
});

test('Stage 2 helpers and Stage1InMemoryRepository persist drafts, lock submissions, and store Office Use verification', async () => {
  assert.match(generateSubmissionReceiptCode(), /^DICS-ONB-[0-9A-F]{10}$/);
  const emptyOffice = createEmptyOfficeUseEntry('inv-test');
  assert.equal(emptyOffice.invitationId, 'inv-test');
  assert.equal(emptyOffice.form09DuplicateIssuedToEmployee, false);

  const repo = new Stage1InMemoryRepository();
  const inv = await repo.createInvitation({
    referenceLabel: 'Fallback Stage 2 Test',
    department: 'Automation Engineering',
    targetRole: 'Systems Engineer',
    expiryDays: 7,
  });

  const allForms = createInitialFormResponses();
  populateAllForms(allForms);
  for (const f of HR_FORMS_CATALOG) {
    const id = f.id as AnyFormId;
    const saved = await repo.saveFormDraft(inv.token, id, allForms[id]);
    assert.equal(saved.isCompleted, true);
  }

  const fakeFile = new File(['%PDF-1.4 sample'], 'aadhar.pdf', { type: 'application/pdf' });
  const uploaded = await repo.uploadOnboardingDocument(
    inv.token,
    'upload-slot-kyc-id',
    'KYC Identity',
    fakeFile
  );
  assert.equal(uploaded.storageMode, 'stage1_memory_preview');

  const hydrated = await repo.loadOnboardingSession(inv.token);
  assert.equal(hydrated.session.formResponses['form-01'].nameInCapitals, 'SAMPLE APPLICANT NAME');
  assert.equal(hydrated.session.uploadedDocuments.length, 1);

  await repo.saveFinalDeclaration(inv.token, true);
  const receipt = await repo.submitPreviewOnboarding(inv.token, {
    ...hydrated.session,
    finalDeclarationAccepted: true,
  });
  assert.match(receipt.receiptCode, /^DICS-PREVIEW-/);

  // Subsequent edits rejected after submission lock
  await assert.rejects(
    () => repo.saveFormDraft(inv.token, 'form-01', allForms['form-01']),
    /locked/i
  );

  // HR Office Use update
  const updatedOffice = await repo.saveOfficeUseEntry(inv.id, {
    form01SelectionStatus: 'Selected',
    form03EmpNo: 'DICS-042',
    markVerified: true,
  });
  assert.equal(updatedOffice.form03EmpNo, 'DICS-042');
  const detail = await repo.getSubmissionDetail(inv.id);
  assert.equal(detail.invitation.submissionState, 'hr_verified');
});

test('department and job designation options and custom Other validation work cleanly', () => {
  assert.ok(DICS_DEPARTMENTS.includes('Instrumentation & Controls'));
  assert.ok(DICS_DEPARTMENTS.includes('Other'));
  assert.ok(DICS_JOB_DESIGNATIONS.includes('Senior Engineer'));
  assert.ok(DICS_JOB_DESIGNATIONS.includes('Other'));

  const validStandard = validateDepartmentAndDesignation({
    departmentOption: 'Engineering',
    customDepartment: '',
    designationOption: 'Design Engineer',
    customDesignation: '',
  });
  assert.equal(validStandard.valid, true);
  assert.equal(validStandard.department, 'Engineering');
  assert.equal(validStandard.targetRole, 'Design Engineer');

  const missingCustomDept = validateDepartmentAndDesignation({
    departmentOption: 'Other',
    customDepartment: ' ',
    designationOption: 'Engineer',
    customDesignation: '',
  });
  assert.equal(missingCustomDept.valid, false);

  const missingCustomRole = validateDepartmentAndDesignation({
    departmentOption: 'Service',
    customDepartment: '',
    designationOption: 'Other',
    customDesignation: 'A',
  });
  assert.equal(missingCustomRole.valid, false);

  const validCustomBoth = validateDepartmentAndDesignation({
    departmentOption: 'Other',
    customDepartment: ' R&D Testing ',
    designationOption: 'Other',
    customDesignation: ' Lead Specialist ',
  });
  assert.equal(validCustomBoth.valid, true);
  assert.equal(validCustomBoth.department, 'R&D Testing');
  assert.equal(validCustomBoth.targetRole, 'Lead Specialist');
});

test('friendly form titles, statuses, and progress states map cleanly for UI display', () => {
  assert.equal(getFriendlyFormTitle('form-01'), 'Bio Data Form');
  assert.equal(getFriendlyFormTitle('form-05'), 'EPF Nomination Form');
  assert.equal(getFriendlyFormTitle('form-09'), 'Gratuity Form F');

  assert.equal(getFriendlySubmissionStatus('not_submitted').label, 'Not Started');
  assert.equal(getFriendlySubmissionStatus('in_progress').label, 'In Progress');
  assert.equal(getFriendlySubmissionStatus('submitted').label, 'Submitted');
  assert.equal(getFriendlySubmissionStatus('hr_verified').label, 'Verified');

  const responses = createInitialFormResponses();
  assert.equal(getFormProgressState('form-01', responses), 'not_started');
  responses['form-01'].nameInCapitals = 'ARJUN RAO';
  responses['form-01'].updatedAt = '2026-11-20T00:00:00.000Z';
  assert.equal(getFormProgressState('form-01', responses), 'in_progress');
  populateAllForms(responses);
  assert.equal(getFormProgressState('form-01', responses), 'completed');
});
