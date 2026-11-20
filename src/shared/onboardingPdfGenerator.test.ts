import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import {
  createEmptyOfficeUseEntry,
  createInitialFormResponses,
} from './onboardingLogic.ts';
import {
  buildAllNineOriginalFormsZip,
  buildFilledOriginalFormPdf,
  buildOnboardingFormsZipFileName,
  getOriginalFormPdfFileName,
  ORIGINAL_FORM_PDF_DESCRIPTORS,
  pickPhotographDocumentForForm,
  type OnboardingPdfPhotoAssets,
} from './onboardingPdfGenerator.ts';
import type { AnyFormId, HrSubmissionDetail } from './types.ts';

const SAMPLE_PNG_SIG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const SAMPLE_PHOTO_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAADklEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

async function loadAllOriginalTemplates(): Promise<Record<AnyFormId, Uint8Array>> {
  const entries = await Promise.all(
    ORIGINAL_FORM_PDF_DESCRIPTORS.map(async (desc) => {
      const filePath = path.resolve(process.cwd(), 'public/assets/aistudio', desc.templateFile);
      const buf = await fs.readFile(filePath);
      return [desc.formId, new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)] as const;
    })
  );
  return Object.fromEntries(entries) as Record<AnyFormId, Uint8Array>;
}

function createSampleSubmissionDetail(
  overrides: Partial<HrSubmissionDetail> = {}
): HrSubmissionDetail {
  const responses = createInitialFormResponses();
  responses['form-01'] = {
    ...responses['form-01'],
    nameInCapitals: 'TEST EMPLOYEE 001',
    positionAppliedFor: 'Senior Automation Engineer',
    photoFileName: 'passport-photo.png',
    presentAddress: 'Plot 42, Peenya Industrial Area, Phase 2, Bengaluru - 560058',
    permanentAddress: '12 MG Road, Mysuru, Karnataka - 570001',
    mobileNo: '9876543210',
    email: 'test.employee.001@example.com',
    dateOfBirth: '1993-08-15',
    placeOfBirth: 'Mysuru',
    heightCm: '175',
    weightKg: '72',
    bloodGroup: 'O+',
    motherTongue: 'Kannada',
    maritalStatus: 'Married',
    noOfDependents: '2',
    fatherName: 'Ramesh Rao',
    fatherOccupation: 'Retired Engineer',
    motherName: 'Lakshmi Rao',
    motherOccupation: 'Homemaker',
    spouseName: 'Ananya Rao',
    spouseOccupation: 'Teacher',
    childrenDetails: '1 Daughter (Age 4)',
    pfUanNo: '100998877665',
    esicNo: '5300011223',
    panNo: 'ABCDE1234F',
    aadharNo: '1234 5678 9012',
    languagesKnown: [
      { language: 'English', speak: true, read: true, write: true },
      { language: 'Kannada', speak: true, read: true, write: true },
      { language: 'Hindi', speak: true, read: true, write: false },
    ],
    educationalQualifications: [
      {
        examPassed: 'SSLC',
        institutionNameAndAddress: 'National Public School, Mysuru',
        subjects: 'Science, Math, English',
        periodFrom: '2008',
        periodTo: '2009',
        marksOrClass: '89% Distinction',
      },
      {
        examPassed: 'B.E. Electronics & Instrumentation',
        institutionNameAndAddress: 'SJCE Mysuru',
        subjects: 'PLC, SCADA, Process Control',
        periodFrom: '2011',
        periodTo: '2015',
        marksOrClass: '8.4 CGPA',
      },
    ],
    workExperience: [
      {
        companyName: 'Apex Controls Pvt Ltd',
        from: '2019-06',
        to: '2026-10',
        positionHeld: 'Automation Lead',
        salaryDrawn: 'Rs. 9,50,000 p.a.',
        reasonForLeaving: 'Career growth at DICS Global',
      },
    ],
    emergencyContactName: 'Ananya Rao',
    emergencyContactAddress: 'Bengaluru',
    emergencyContactRelationship: 'Spouse',
    emergencyContactTel: '9876500001',
    reference1Name: 'Kiran Kumar',
    reference1Address: 'Peenya, Bengaluru',
    reference1Tel: '9876500002',
    reference2Name: 'Meera Nair',
    reference2Address: 'Yeshwanthpur, Bengaluru',
    reference2Tel: '9876500003',
    declarationConfirmed: true,
    place: 'Bengaluru',
    date: '2026-11-18',
    applicantSignatureDataUrl: SAMPLE_PNG_SIG,
    updatedAt: '2026-11-18T08:15:00.000Z',
  };

  responses['form-02'] = {
    ...responses['form-02'],
    name: 'TEST EMPLOYEE 001',
    fatherName: 'Ramesh Rao',
    designation: 'Senior Automation Engineer',
    dateOfBirth: '1993-08-15',
    dateOfJoining: '2026-11-18',
    contactNumber: '9876543210',
    presentAddress: responses['form-01'].presentAddress,
    permanentAddress: responses['form-01'].permanentAddress,
    emergency1Name: 'Ananya Rao',
    emergency1Mobile: '9876500001',
    emergency1Relationship: 'Spouse',
    emergency2Name: 'Ramesh Rao',
    emergency2Mobile: '9876500009',
    emergency2Relationship: 'Father',
    date: '2026-11-18',
    signatureName: 'TEST EMPLOYEE 001',
    signatureDataUrl: SAMPLE_PNG_SIG,
    declarationConfirmed: true,
    updatedAt: '2026-11-18T08:20:00.000Z',
  };

  responses['form-03'] = {
    ...responses['form-03'],
    employeeName: 'TEST EMPLOYEE 001',
    empNo: 'DICS-EMP-001',
    dateOfJoining: '2026-11-18',
    designation: 'Senior Automation Engineer',
    department: 'Automation Engineering',
    familyMembers: [
      { slNo: 1, memberName: 'TEST EMPLOYEE 001', relationship: 'Self', dateOfBirth: '1993-08-15', gender: 'Male' },
      { slNo: 2, memberName: 'Ananya Rao', relationship: 'Spouse', dateOfBirth: '1995-02-11', gender: 'Female' },
    ],
    policyNoteConfirmed: true,
    employeeSignatureDataUrl: SAMPLE_PNG_SIG,
    declarationDate: '2026-11-18',
    updatedAt: '2026-11-18T08:22:00.000Z',
  };

  responses['form-04'] = {
    ...responses['form-04'],
    employeeName: 'TEST EMPLOYEE 001',
    dateOfJoining: '2026-11-18',
    designation: 'Senior Automation Engineer',
    department: 'Automation Engineering',
    itemStatuses: {
      ...responses['form-04'].itemStatuses,
      'item-01': 'Submitted',
      'item-14-2': 'Submitted',
      'item-14-3': 'Submitted',
    },
    employeeRemarks: 'All KYC originals brought for verification.',
    employeeConfirmed: true,
    employeeConfirmDate: '2026-11-18',
    updatedAt: '2026-11-18T08:25:00.000Z',
  };

  responses['form-05'] = {
    ...responses['form-05'],
    nameInBlockLetters: 'TEST EMPLOYEE 001',
    fatherOrHusbandName: 'Ramesh Rao',
    dateOfBirth: '1993-08-15',
    sex: 'Male',
    maritalStatus: 'Married',
    permanentAddress: responses['form-01'].permanentAddress,
    temporaryAddress: responses['form-01'].presentAddress,
    partANominees: [
      {
        nomineeNameAndAddress: 'Ananya Rao, Mysuru',
        relationship: 'Spouse',
        dateOfBirth: '1995-02-11',
        shareProportion: '100%',
        minorGuardianDetails: '',
      },
    ],
    partASubscriberSignatureDataUrl: SAMPLE_PNG_SIG,
    partBFamilyMembers: [
      { slNo: 1, familyMemberName: 'Ananya Rao', address: 'Bengaluru', dateOfBirth: '1995-02-11', relationship: 'Spouse' },
    ],
    partBDate: '2026-11-18',
    partBPlace: 'Bengaluru',
    partBSubscriberSignatureDataUrl: SAMPLE_PNG_SIG,
    declarationConfirmed: true,
    updatedAt: '2026-11-18T08:30:00.000Z',
  };

  responses['form-06'] = {
    ...responses['form-06'],
    nameInBlockLetters: 'TEST EMPLOYEE 001',
    fatherOrHusbandName: 'Ramesh Rao',
    dateOfBirth: '1993-08-15',
    maritalStatus: 'M',
    sex: 'M',
    presentAddress: responses['form-01'].presentAddress,
    presentPinCode: '560058',
    presentPhoneOrEmail: '9876543210',
    permanentAddress: responses['form-01'].permanentAddress,
    permanentPinCode: '570001',
    permanentPhoneOrEmail: '9876543210',
    nomineeName: 'Ananya Rao',
    nomineeRelationship: 'Spouse',
    nomineeAddress: 'Bengaluru',
    familyMembers: [
      {
        slNo: 1,
        name: 'Ananya Rao',
        dobOrAge: '1995-02-11',
        relationship: 'Spouse',
        residingWithEmployee: 'Yes',
        residenceTown: 'Bengaluru',
        residenceState: 'Karnataka',
      },
    ],
    declarationConfirmed: true,
    ipSignatureDataUrl: SAMPLE_PNG_SIG,
    ticSignatureDataUrl: SAMPLE_PNG_SIG,
    ticDate: '2026-11-18',
    updatedAt: '2026-11-18T08:35:00.000Z',
  };

  responses['form-07'] = {
    ...responses['form-07'],
    nomineeName: 'Ananya Rao',
    relationshipWithEmployee: 'Spouse',
    nomineeAddress: 'Plot 42, Peenya, Bengaluru',
    witness1Details: 'Kiran Kumar, Bengaluru',
    witness2Details: 'Meera Nair, Bengaluru',
    date: '2026-11-18',
    signatureDataUrl: SAMPLE_PNG_SIG,
    declarationConfirmed: true,
    updatedAt: '2026-11-18T08:40:00.000Z',
  };

  responses['form-08'] = {
    ...responses['form-08'],
    memberName: 'TEST EMPLOYEE 001',
    relationType: 'Father',
    fatherOrSpouseName: 'Ramesh Rao',
    dateOfBirth: '1993-08-15',
    gender: 'Male',
    maritalStatus: 'Married',
    emailId: 'test.employee.001@example.com',
    mobileNo: '9876543210',
    earlierMemberEpf1952: 'Yes',
    earlierMemberEps1995: 'Yes',
    previousUan: '100998877665',
    internationalWorker: 'No',
    bankAccountNo: '00001234567890',
    ifscCode: 'SBIN0004321',
    aadharNumber: '123456789012',
    panNumber: 'ABCDE1234F',
    undertakingAccepted: true,
    date: '2026-11-18',
    place: 'Bengaluru',
    memberSignatureDataUrl: SAMPLE_PNG_SIG,
    updatedAt: '2026-11-18T08:45:00.000Z',
  };

  responses['form-09'] = {
    ...responses['form-09'],
    salutation: 'Shri',
    employeeFullNameHeader: 'TEST EMPLOYEE 001',
    nominees: [
      {
        nomineeNameAndAddress: 'Ananya Rao, Plot 42, Peenya, Bengaluru',
        relationship: 'Spouse',
        age: '31',
        shareProportion: '100%',
      },
    ],
    statementEmployeeName: 'TEST EMPLOYEE 001',
    statementSex: 'Male',
    statementReligion: 'Hindu',
    statementMaritalStatus: 'married',
    statementDepartmentBranch: 'Automation Engineering',
    statementPostHeldAndTicketNo: 'Senior Automation Engineer',
    statementDateOfAppointment: '2026-11-18',
    permanentVillage: 'Mysuru',
    permanentThana: 'Nazarbad',
    permanentSubDivision: 'Mysuru South',
    permanentPostOffice: 'Mysuru HO',
    permanentDistrict: 'Mysuru',
    permanentState: 'Karnataka',
    employeePlace: 'Bengaluru',
    employeeDate: '2026-11-18',
    employeeSignatureDataUrl: SAMPLE_PNG_SIG,
    witness1NameAndAddress: 'Kiran Kumar, Peenya, Bengaluru',
    witness1SignatureDataUrl: SAMPLE_PNG_SIG,
    witness2NameAndAddress: 'Meera Nair, Yeshwanthpur, Bengaluru',
    witness2SignatureDataUrl: SAMPLE_PNG_SIG,
    witnessPlace: 'Bengaluru',
    witnessDate: '2026-11-18',
    declarationConfirmed: true,
    updatedAt: '2026-11-18T08:50:00.000Z',
  };

  const officeUse = {
    ...createEmptyOfficeUseEntry('00000000-0000-4000-8000-000000000001'),
    form01SelectionStatus: 'Selected',
    form01SelectedAs: 'Senior Automation Engineer',
    form01ReportingTo: 'VP Engineering',
    form01ReviewDate: '2026-11-18',
    form03EmpNo: 'DICS-EMP-001',
    form04EffectiveDate: '2026-11-18',
    form04EmpNo: 'DICS-EMP-001',
    form04PostEmploymentStatuses: {
      resume: 'verified',
      pan_card: 'verified',
    },
    form04HrRemarks: 'All mandatory forms & documents verified for TEST-EMPLOYEE-001.',
    form04DataEnteredBy: 'DICS HR Admin',
    form04DataEnteredDate: '2026-11-18',
    form04DataCheckedBy: 'HR Manager',
    form04DataCheckedDate: '2026-11-18',
    form05EmployerCertDate: '2026-11-18',
    form05AuthorizedOfficer: 'DICS Authorized Signatory',
    form06EmployerCodeNo: 'KA-BLR-0009911',
    form06DateOfAppointment: '2026-11-18',
    form08EmployerUanVerified: 'KYC Approved with DSC',
    form08MemberId: 'KN/BLR/001234/0000101',
    form08AuthorizedSignatory: 'DICS Authorized Signatory',
    form09EmployerCertDate: '2026-11-18',
    form09EmployerDesignation: 'HR Manager',
    form09DuplicateIssuedToEmployee: true,
    updatedByAdminId: '00000000-0000-4000-8000-000000000999',
    updatedAt: '2026-11-18T09:15:00.000Z',
  };

  return {
    invitation: {
      id: '00000000-0000-4000-8000-000000000001',
      token: '',
      tokenHint: 'dics-••••0001',
      referenceLabel: 'TEST-EMPLOYEE-001',
      department: 'Automation Engineering',
      targetRole: 'Senior Automation Engineer',
      status: 'active',
      createdAt: '2026-11-18T07:00:00.000Z',
      expiresAt: '2026-12-02T07:00:00.000Z',
      submittedAt: '2026-11-18T09:00:00.000Z',
      receiptCode: 'DICS-ONB-TEST1',
      invitePath: '',
      submissionState: 'hr_verified',
    },
    formResponses: responses,
    uploadedDocuments: [
      {
        id: 'doc-photo-001',
        slotId: 'upload-slot-photograph',
        slotLabel: 'Passport Photograph',
        fileName: 'passport-photo.png',
        mimeType: 'image/png',
        sizeBytes: SAMPLE_PHOTO_BYTES.byteLength,
        storageBucketPath: 'onboarding/00000000-0000-4000-8000-000000000001/upload-slot-photograph/passport-photo.png',
        uploadedAt: '2026-11-18T08:54:00.000Z',
        storageMode: 'supabase_private_storage',
      },
      {
        id: 'doc-001',
        slotId: 'upload-slot-kyc-id',
        slotLabel: 'KYC Identity (PAN & Aadhaar)',
        fileName: 'test-employee-001-pan.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 245760,
        storageBucketPath: 'onboarding/00000000-0000-4000-8000-000000000001/upload-slot-kyc-id/abc.pdf',
        uploadedAt: '2026-11-18T08:55:00.000Z',
        storageMode: 'supabase_private_storage',
      },
    ],
    officeUse,
    auditLogs: [],
    ...overrides,
  };
}

test('buildFilledOriginalFormPdf preserves exact original page counts and page dimensions for all 9 templates', async () => {
  const templates = await loadAllOriginalTemplates();
  const detail = createSampleSubmissionDetail();
  const photoAssets: OnboardingPdfPhotoAssets = {
    form01Photo: { bytes: SAMPLE_PHOTO_BYTES, mimeType: 'image/png' },
    form06Photo: { bytes: SAMPLE_PHOTO_BYTES, mimeType: 'image/png' },
  };

  for (const desc of ORIGINAL_FORM_PDF_DESCRIPTORS) {
    const templateDoc = await PDFDocument.load(templates[desc.formId], { ignoreEncryption: true });
    const filledBytes = await buildFilledOriginalFormPdf(
      desc.formId,
      detail,
      templates[desc.formId],
      photoAssets
    );
    assert.equal(Buffer.from(filledBytes.slice(0, 5)).toString('ascii'), '%PDF-');

    const filledDoc = await PDFDocument.load(filledBytes);
    assert.equal(
      filledDoc.getPageCount(),
      templateDoc.getPageCount(),
      `${desc.code} must preserve exact original page count`
    );

    const tplSize = templateDoc.getPages()[0].getSize();
    const outSize = filledDoc.getPages()[0].getSize();
    assert.ok(Math.abs(tplSize.width - outSize.width) < 0.5, `${desc.code} width must match original`);
    assert.ok(Math.abs(tplSize.height - outSize.height) < 0.5, `${desc.code} height must match original`);

    assert.equal(getOriginalFormPdfFileName(desc.formId), desc.outputFileName);
  }
});

test('buildAllNineOriginalFormsZip packages all 9 named PDFs into a valid ZIP archive', async () => {
  const templates = await loadAllOriginalTemplates();
  const detail = createSampleSubmissionDetail();
  const photoAssets: OnboardingPdfPhotoAssets = {
    form01Photo: { bytes: SAMPLE_PHOTO_BYTES, mimeType: 'image/png' },
    form06Photo: { bytes: SAMPLE_PHOTO_BYTES, mimeType: 'image/png' },
  };

  const zipBytes = await buildAllNineOriginalFormsZip(detail, templates, photoAssets);
  assert.ok(zipBytes.byteLength > 50_000);
  const loadedZip = await JSZip.loadAsync(zipBytes);
  const fileNames = Object.keys(loadedZip.files).sort();

  const expectedNames = ORIGINAL_FORM_PDF_DESCRIPTORS.map((d) => d.outputFileName).sort();
  assert.deepEqual(fileNames, expectedNames);

  for (const name of expectedNames) {
    const content = await loadedZip.files[name].async('uint8array');
    assert.equal(Buffer.from(content.slice(0, 5)).toString('ascii'), '%PDF-');
  }

  assert.equal(buildOnboardingFormsZipFileName(detail), 'DICS-Onboarding-Forms-TEST-EMPLOYEE-001.zip');
});

test('pickPhotographDocumentForForm matches form01 photoFileName and falls back to upload-slot-photograph', () => {
  const detail = createSampleSubmissionDetail();
  const exact = pickPhotographDocumentForForm(detail.uploadedDocuments, 'passport-photo.png');
  assert.equal(exact?.id, 'doc-photo-001');

  const fallback = pickPhotographDocumentForForm(detail.uploadedDocuments, '');
  assert.equal(fallback?.id, 'doc-photo-001');

  const noImages = pickPhotographDocumentForForm(
    detail.uploadedDocuments.filter((d) => d.slotId !== 'upload-slot-photograph'),
    ''
  );
  assert.equal(noImages, null);
});

test('buildFilledOriginalFormPdf handles long Unicode strings, corrupt signatures, and missing photos gracefully', async () => {
  const templates = await loadAllOriginalTemplates();
  const emptyDetail: HrSubmissionDetail = {
    invitation: {
      id: '00000000-0000-4000-8000-000000000099',
      token: '',
      tokenHint: 'dics-••••0099',
      referenceLabel: 'DRAFT-CANDIDATE',
      department: 'Engineering',
      targetRole: 'Trainee',
      status: 'active',
      createdAt: '2026-11-18T07:00:00.000Z',
      expiresAt: '2026-11-28T07:00:00.000Z',
      submittedAt: null,
      receiptCode: null,
      invitePath: '',
      submissionState: 'in_progress',
    },
    formResponses: createInitialFormResponses(),
    uploadedDocuments: [],
    officeUse: createEmptyOfficeUseEntry('00000000-0000-4000-8000-000000000099'),
    auditLogs: [],
  };

  const longText = '“Peenya Industrial Estate” — Phase II, Bengaluru ₹50,000 stipend ✅. '.repeat(25);
  emptyDetail.formResponses['form-01'].presentAddress = longText;
  emptyDetail.formResponses['form-01'].applicantSignatureDataUrl = 'data:image/png;base64,NOT_VALID_PNG';
  emptyDetail.officeUse.form04HrRemarks = longText;

  for (const desc of ORIGINAL_FORM_PDF_DESCRIPTORS) {
    const out = await buildFilledOriginalFormPdf(desc.formId, emptyDetail, templates[desc.formId], {
      form01Photo: { bytes: new Uint8Array([1, 2, 3]), mimeType: 'image/png' },
      form06Photo: null,
    });
    const doc = await PDFDocument.load(out);
    assert.ok(doc.getPageCount() >= 1);
  }
});
