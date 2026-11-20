import {
  DICS_COMPANY_HEADER,
  HR_FORMS_CATALOG,
  PERSONAL_FILE_CHECKLIST_ITEMS,
} from './formsCatalog.ts';
import type {
  AnyFormId,
  ChecklistItemStatus,
  FileValidationResult,
  Form01BioData,
  Form02JoiningFormat,
  Form03Mediclaim,
  Form04Checklist,
  Form05EpfForm2,
  Form06EsicForm1,
  Form07Form25,
  Form08Form11,
  Form09GratuityFormF,
  HrOfficeUseEntry,
  InvitationStatus,
  InvitationStatusFilter,
  OnboardingFormResponses,
  OnboardingInvitation,
  OnboardingSessionState,
  ProgressBreakdown,
  SubmissionState,
} from './types.ts';

export const DICS_DEPARTMENTS = [
  'Engineering',
  'Electrical',
  'Instrumentation & Controls',
  'Automation',
  'Sales & Marketing',
  'Service',
  'Projects',
  'Production',
  'Quality',
  'Procurement',
  'Finance & Accounts',
  'Human Resources',
  'Administration',
  'IT',
  'Other',
] as const;

export const DICS_JOB_DESIGNATIONS = [
  'Engineer',
  'Senior Engineer',
  'Design Engineer',
  'Project Engineer',
  'Service Engineer',
  'Sales Engineer',
  'Manager',
  'Assistant Manager',
  'Technician',
  'Executive',
  'Trainee',
  'Other',
] as const;

export const FRIENDLY_FORM_TITLES: Record<AnyFormId, string> = {
  'form-01': 'Bio Data Form',
  'form-02': 'Joining Format',
  'form-03': 'Mediclaim Declaration',
  'form-04': 'Personal File Checklist',
  'form-05': 'EPF Nomination Form',
  'form-06': 'ESIC Declaration Form',
  'form-07': 'Form No. 25',
  'form-08': 'Form 11',
  'form-09': 'Gratuity Form F',
};

export function getFriendlyFormTitle(formId: string): string {
  return (FRIENDLY_FORM_TITLES as Record<string, string>)[formId] ?? 'Onboarding Form';
}

export function getFriendlySubmissionStatus(state: SubmissionState): {
  label: string;
  tone: 'neutral' | 'warning' | 'info' | 'success';
} {
  switch (state) {
    case 'hr_verified':
      return { label: 'Verified', tone: 'success' };
    case 'submitted':
    case 'preview_completed':
      return { label: 'Submitted', tone: 'info' };
    case 'in_progress':
      return { label: 'In Progress', tone: 'warning' };
    case 'not_submitted':
    default:
      return { label: 'Not Started', tone: 'neutral' };
  }
}

export function resolveCustomOptionValue(selectedOption: string, customValue: string): string {
  return selectedOption === 'Other' ? customValue.trim() : selectedOption.trim();
}

export function validateDepartmentAndDesignation(input: {
  departmentOption: string;
  customDepartment: string;
  designationOption: string;
  customDesignation: string;
}): {
  valid: boolean;
  department: string;
  targetRole: string;
  error?: string;
} {
  const department = resolveCustomOptionValue(input.departmentOption, input.customDepartment);
  const targetRole = resolveCustomOptionValue(input.designationOption, input.customDesignation);

  if (input.departmentOption === 'Other' && department.length < 2) {
    return {
      valid: false,
      department,
      targetRole,
      error: 'Please enter the department name (at least 2 characters).',
    };
  }
  if (department.length < 2) {
    return {
      valid: false,
      department,
      targetRole,
      error: 'Please select a valid department.',
    };
  }
  if (input.designationOption === 'Other' && targetRole.length < 2) {
    return {
      valid: false,
      department,
      targetRole,
      error: 'Please enter the job designation (at least 2 characters).',
    };
  }
  if (targetRole.length < 2) {
    return {
      valid: false,
      department,
      targetRole,
      error: 'Please select a valid job designation.',
    };
  }

  return { valid: true, department, targetRole };
}

export type FormProgressState = 'not_started' | 'in_progress' | 'completed';

export function getFormProgressState(
  formId: AnyFormId,
  responses: OnboardingFormResponses
): FormProgressState {
  if (isFormSlotCompleted(formId, responses)) {
    return 'completed';
  }
  const entry = responses[formId] as { updatedAt?: string | null };
  if (entry?.updatedAt) {
    return 'in_progress';
  }
  const summary = getFormResponseSummary(formId, responses);
  if (!summary.toLowerCase().startsWith('no ') && !summary.toLowerCase().startsWith('checklist not')) {
    return 'in_progress';
  }
  return 'not_started';
}

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export type AllowedDocumentMimeType = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];

export const ALLOWED_DOCUMENT_EXTENSIONS_BY_MIME: Record<
  AllowedDocumentMimeType,
  readonly string[]
> = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
};

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface InvitationInputPayload {
  referenceLabel: string;
  department: string;
  targetRole: string;
  expiryDays: number;
}

export interface InvitationValidationResult {
  valid: boolean;
  error?: string;
  normalized?: InvitationInputPayload;
}

export interface FormValidationResult {
  valid: boolean;
  missingFields: string[];
}

function createInitialForm01(): Form01BioData {
  return {
    nameInCapitals: '',
    positionAppliedFor: '',
    photoFileName: '',
    presentAddress: '',
    permanentAddress: '',
    mobileNo: '',
    email: '',
    dateOfBirth: '',
    placeOfBirth: '',
    heightCm: '',
    weightKg: '',
    bloodGroup: '',
    motherTongue: '',
    maritalStatus: '',
    noOfDependents: '',
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    spouseName: '',
    spouseOccupation: '',
    childrenDetails: '',
    pfUanNo: '',
    esicNo: '',
    panNo: '',
    aadharNo: '',
    languagesKnown: Array.from({ length: 4 }, () => ({
      language: '',
      speak: false,
      read: false,
      write: false,
    })),
    educationalQualifications: Array.from({ length: 5 }, () => ({
      examPassed: '',
      institutionNameAndAddress: '',
      subjects: '',
      periodFrom: '',
      periodTo: '',
      marksOrClass: '',
    })),
    breakInEducation: '',
    breakInEducationReason: '',
    extracurricularActivities: '',
    workExperience: Array.from({ length: 6 }, () => ({
      companyName: '',
      from: '',
      to: '',
      positionHeld: '',
      salaryDrawn: '',
      reasonForLeaving: '',
    })),
    discontinuityInEmployment: '',
    discontinuityReason: '',
    dismissedOrTerminated: '',
    convictedForOffences: '',
    dismissedOrConvictedDetails: '',
    psychologicalIssuesOrMedication: '',
    medicalConditions: '',
    emergencyContactName: '',
    emergencyContactAddress: '',
    emergencyContactRelationship: '',
    emergencyContactTel: '',
    reference1Name: '',
    reference1Address: '',
    reference1Tel: '',
    reference2Name: '',
    reference2Address: '',
    reference2Tel: '',
    declarationConfirmed: false,
    place: '',
    date: '',
    applicantSignatureDataUrl: '',
    updatedAt: null,
  };
}

function createInitialForm02(): Form02JoiningFormat {
  return {
    name: '',
    fatherName: '',
    designation: '',
    dateOfBirth: '',
    dateOfJoining: '',
    contactNumber: '',
    presentAddress: '',
    permanentAddress: '',
    emergency1Name: '',
    emergency1Mobile: '',
    emergency1Relationship: '',
    emergency2Name: '',
    emergency2Mobile: '',
    emergency2Relationship: '',
    date: '',
    signatureName: '',
    signatureDataUrl: '',
    declarationConfirmed: false,
    updatedAt: null,
  };
}

function createInitialForm03(): Form03Mediclaim {
  return {
    employeeName: '',
    empNo: '',
    dateOfJoining: '',
    designation: '',
    department: '',
    familyMembers: [
      { slNo: 1, memberName: '', relationship: 'Self', dateOfBirth: '', gender: '' },
      { slNo: 2, memberName: '', relationship: 'Spouse', dateOfBirth: '', gender: '' },
      { slNo: 3, memberName: '', relationship: 'Child-1', dateOfBirth: '', gender: '' },
      { slNo: 4, memberName: '', relationship: 'Child-2', dateOfBirth: '', gender: '' },
    ],
    policyNoteConfirmed: false,
    employeeSignatureDataUrl: '',
    declarationDate: '',
    updatedAt: null,
  };
}

function createInitialForm04(): Form04Checklist {
  const itemStatuses: Record<string, ChecklistItemStatus> = {};
  for (const cat of PERSONAL_FILE_CHECKLIST_ITEMS) {
    for (const item of cat.items) {
      itemStatuses[item.key] = '';
    }
  }
  return {
    employeeName: '',
    dateOfJoining: '',
    designation: '',
    department: '',
    itemStatuses,
    employeeRemarks: '',
    employeeConfirmed: false,
    employeeConfirmDate: '',
    updatedAt: null,
  };
}

function createInitialForm05(): Form05EpfForm2 {
  return {
    nameInBlockLetters: '',
    fatherOrHusbandName: '',
    dateOfBirth: '',
    sex: '',
    maritalStatus: '',
    accountNo: '',
    permanentAddress: '',
    temporaryAddress: '',
    dateOfJoiningEpf: '',
    dateOfJoiningEps: '',
    partANominees: [
      {
        nomineeNameAndAddress: '',
        relationship: '',
        dateOfBirth: '',
        shareProportion: '',
        minorGuardianDetails: '',
      },
      {
        nomineeNameAndAddress: '',
        relationship: '',
        dateOfBirth: '',
        shareProportion: '',
        minorGuardianDetails: '',
      },
    ],
    partACertifyNoFamily: false,
    partACertifyParentsDependent: false,
    partASubscriberSignatureDataUrl: '',
    partBFamilyMembers: Array.from({ length: 5 }, (_, idx) => ({
      slNo: idx + 1,
      familyMemberName: '',
      address: '',
      dateOfBirth: '',
      relationship: '',
    })),
    partBCertifyNoFamily: false,
    partBWidowPensionNomineeNameAddress: '',
    partBWidowPensionNomineeDob: '',
    partBWidowPensionNomineeRelationship: '',
    partBDate: '',
    partBPlace: '',
    partBSubscriberSignatureDataUrl: '',
    declarationConfirmed: false,
    updatedAt: null,
  };
}

function createInitialForm06(): Form06EsicForm1 {
  return {
    insuranceNo: '',
    nameInBlockLetters: '',
    fatherOrHusbandName: '',
    dateOfBirth: '',
    maritalStatus: '',
    sex: '',
    presentAddress: '',
    presentPinCode: '',
    presentPhoneOrEmail: '',
    permanentAddress: '',
    permanentPinCode: '',
    permanentPhoneOrEmail: '',
    branchOffice: '',
    dispensary: '',
    hasPreviousEmployment: false,
    previousInsNo: '',
    previousEmployerCodeNo: '',
    previousEmployerNameAndAddress: '',
    previousEmployerPhoneOrEmail: '',
    nomineeName: '',
    nomineeRelationship: '',
    nomineeAddress: '',
    photoFileName: '',
    familyMembers: Array.from({ length: 8 }, (_, idx) => ({
      slNo: idx + 1,
      name: '',
      dobOrAge: '',
      relationship: '',
      residingWithEmployee: '',
      residenceTown: '',
      residenceState: '',
    })),
    declarationConfirmed: false,
    ipSignatureDataUrl: '',
    ticSignatureDataUrl: '',
    ticDate: '',
    updatedAt: null,
  };
}

function createInitialForm07(): Form07Form25 {
  return {
    nomineeName: '',
    relationshipWithEmployee: '',
    nomineeAddress: '',
    witness1Details: '',
    witness2Details: '',
    date: '',
    signatureDataUrl: '',
    declarationConfirmed: false,
    updatedAt: null,
  };
}

function createInitialForm08(): Form08Form11 {
  return {
    memberName: '',
    relationType: 'Father',
    fatherOrSpouseName: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    emailId: '',
    mobileNo: '',
    earlierMemberEpf1952: '',
    earlierMemberEps1995: '',
    previousUan: '',
    previousPfAccountNo: '',
    previousExitDate: '',
    schemeCertificateNo: '',
    ppoNo: '',
    internationalWorker: '',
    countryOfOrigin: '',
    passportNo: '',
    passportValidFrom: '',
    passportValidTo: '',
    bankAccountNo: '',
    ifscCode: '',
    aadharNumber: '',
    panNumber: '',
    undertakingAccepted: false,
    date: '',
    place: '',
    memberSignatureDataUrl: '',
    updatedAt: null,
  };
}

function createInitialForm09(): Form09GratuityFormF {
  return {
    establishmentNameAndAddress: `${DICS_COMPANY_HEADER.companyName}, ${DICS_COMPANY_HEADER.address}`,
    salutation: 'Shri',
    employeeFullNameHeader: '',
    certifyNomineesAreFamily: true,
    declareNoFamily: false,
    fatherMotherNotDependent: false,
    husbandParentsNotDependent: false,
    excludedHusbandNoticeDate: '',
    nominees: [
      { nomineeNameAndAddress: '', relationship: '', age: '', shareProportion: '' },
      { nomineeNameAndAddress: '', relationship: '', age: '', shareProportion: '' },
      { nomineeNameAndAddress: '', relationship: '', age: '', shareProportion: '' },
    ],
    statementEmployeeName: '',
    statementSex: '',
    statementReligion: '',
    statementMaritalStatus: '',
    statementDepartmentBranch: '',
    statementPostHeldAndTicketNo: '',
    statementDateOfAppointment: '',
    permanentVillage: '',
    permanentThana: '',
    permanentSubDivision: '',
    permanentPostOffice: '',
    permanentDistrict: '',
    permanentState: '',
    employeePlace: '',
    employeeDate: '',
    employeeSignatureDataUrl: '',
    witness1NameAndAddress: '',
    witness1SignatureDataUrl: '',
    witness2NameAndAddress: '',
    witness2SignatureDataUrl: '',
    witnessPlace: '',
    witnessDate: '',
    declarationConfirmed: false,
    updatedAt: null,
  };
}

export function createInitialFormResponses(): OnboardingFormResponses {
  return {
    'form-01': createInitialForm01(),
    'form-02': createInitialForm02(),
    'form-03': createInitialForm03(),
    'form-04': createInitialForm04(),
    'form-05': createInitialForm05(),
    'form-06': createInitialForm06(),
    'form-07': createInitialForm07(),
    'form-08': createInitialForm08(),
    'form-09': createInitialForm09(),
  };
}

export function createInitialSessionState(invitationToken: string): OnboardingSessionState {
  return {
    invitationToken,
    formResponses: createInitialFormResponses(),
    uploadedDocuments: [],
    finalDeclarationAccepted: false,
    submittedAt: null,
    receiptCode: null,
  };
}

function isBlank(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

export function validateFormCompletion(
  formId: AnyFormId,
  responses: OnboardingFormResponses
): FormValidationResult {
  const missingFields: string[] = [];

  switch (formId) {
    case 'form-01': {
      const f = responses['form-01'];
      if (isBlank(f.nameInCapitals)) missingFields.push('Name (in Capitals)');
      if (isBlank(f.positionAppliedFor)) missingFields.push('Position applied for');
      if (isBlank(f.presentAddress)) missingFields.push('Present Address');
      if (isBlank(f.permanentAddress)) missingFields.push('Permanent Address');
      if (isBlank(f.mobileNo)) missingFields.push('Mobile No');
      if (isBlank(f.email)) missingFields.push('E-Mail');
      if (isBlank(f.dateOfBirth)) missingFields.push('Date of Birth');
      if (isBlank(f.emergencyContactName) || isBlank(f.emergencyContactTel)) {
        missingFields.push('Emergency Contact Name & Tel. No.');
      }
      if (
        isBlank(f.reference1Name) ||
        isBlank(f.reference1Tel) ||
        isBlank(f.reference2Name) ||
        isBlank(f.reference2Tel)
      ) {
        missingFields.push('Two non-related references (Name & Telephone No.)');
      }
      if (!f.declarationConfirmed) missingFields.push('Applicant certification checkbox');
      if (isBlank(f.place) || isBlank(f.date)) missingFields.push('Place & Date');
      if (isBlank(f.applicantSignatureDataUrl)) {
        missingFields.push('Signature of the Applicant');
      }
      break;
    }

    case 'form-02': {
      const f = responses['form-02'];
      if (isBlank(f.name)) missingFields.push('Name');
      if (isBlank(f.fatherName)) missingFields.push("Father's name");
      if (isBlank(f.designation)) missingFields.push('Designation');
      if (isBlank(f.dateOfBirth)) missingFields.push('Date of Birth');
      if (isBlank(f.dateOfJoining)) missingFields.push('Date of joining');
      if (isBlank(f.contactNumber)) missingFields.push('Contact Number');
      if (isBlank(f.presentAddress)) missingFields.push('Present Address');
      if (isBlank(f.permanentAddress)) missingFields.push('Permanent Address');
      if (isBlank(f.emergency1Name) || isBlank(f.emergency1Mobile)) {
        missingFields.push('Emergency Contact 1 (Name & Mobile No.)');
      }
      if (isBlank(f.date)) missingFields.push('Date');
      if (isBlank(f.signatureDataUrl)) missingFields.push('Employee Signature');
      if (!f.declarationConfirmed) missingFields.push('Employee confirmation checkbox');
      break;
    }

    case 'form-03': {
      const f = responses['form-03'];
      if (isBlank(f.employeeName)) missingFields.push('Name of the Employee');
      if (isBlank(f.dateOfJoining)) missingFields.push('Date of Joining');
      if (isBlank(f.designation)) missingFields.push('Designation');
      if (isBlank(f.department)) missingFields.push('Department');
      const selfRow = f.familyMembers[0];
      if (
        !selfRow ||
        isBlank(selfRow.memberName) ||
        isBlank(selfRow.dateOfBirth) ||
        isBlank(selfRow.gender)
      ) {
        missingFields.push('Family Particulars Row 1 (Self: Name, Date of Birth, Gender)');
      }
      if (!f.policyNoteConfirmed) missingFields.push('Mediclaim policy confirmation checkbox');
      if (isBlank(f.employeeSignatureDataUrl)) missingFields.push('Employee Signature');
      break;
    }

    case 'form-04': {
      const f = responses['form-04'];
      if (isBlank(f.employeeName)) missingFields.push('Employee Name');
      if (isBlank(f.designation)) missingFields.push('Designation');
      if (isBlank(f.department)) missingFields.push('Department');
      if (!f.employeeConfirmed) {
        missingFields.push('Personal File document submission confirmation checkbox');
      }
      if (isBlank(f.employeeConfirmDate)) missingFields.push('Confirmation Date');
      break;
    }

    case 'form-05': {
      const f = responses['form-05'];
      if (isBlank(f.nameInBlockLetters)) missingFields.push('Name (in Block letters)');
      if (isBlank(f.fatherOrHusbandName)) missingFields.push("Father's/Husband's Name");
      if (isBlank(f.dateOfBirth)) missingFields.push('Date of Birth');
      if (isBlank(f.sex)) missingFields.push('Sex');
      if (isBlank(f.maritalStatus)) missingFields.push('Marital Status');
      if (isBlank(f.permanentAddress)) missingFields.push('Permanent Address');
      const hasPartANominee = f.partANominees.some(
        (n) => !isBlank(n.nomineeNameAndAddress) && !isBlank(n.relationship) && !isBlank(n.shareProportion)
      );
      if (!hasPartANominee) {
        missingFields.push('Part A (EPF) — at least one nominee (Name/Address, Relationship, Share)');
      }
      if (isBlank(f.partASubscriberSignatureDataUrl)) {
        missingFields.push('Part A — Signature or thumb impression of the subscriber');
      }
      if (isBlank(f.partBDate) || isBlank(f.partBPlace)) {
        missingFields.push('Part B — Date & Place');
      }
      if (isBlank(f.partBSubscriberSignatureDataUrl)) {
        missingFields.push('Part B — Signature or thumb impression of the subscriber');
      }
      if (!f.declarationConfirmed) missingFields.push('Form 2 declaration confirmation checkbox');
      break;
    }

    case 'form-06': {
      const f = responses['form-06'];
      if (isBlank(f.nameInBlockLetters)) missingFields.push('Name (in block letters)');
      if (isBlank(f.fatherOrHusbandName)) missingFields.push("Father's/Husband's Name");
      if (isBlank(f.dateOfBirth)) missingFields.push('Date of Birth');
      if (isBlank(f.maritalStatus)) missingFields.push('Marital Status');
      if (isBlank(f.sex)) missingFields.push('Sex');
      if (isBlank(f.presentAddress) || isBlank(f.presentPinCode)) {
        missingFields.push('Present Address & Pin Code');
      }
      if (isBlank(f.permanentAddress) || isBlank(f.permanentPinCode)) {
        missingFields.push('Permanent Address & Pin Code');
      }
      if (isBlank(f.nomineeName) || isBlank(f.nomineeRelationship) || isBlank(f.nomineeAddress)) {
        missingFields.push('Section (C) Nominee u/s 71 (Name, Relationship, Address)');
      }
      if (!f.declarationConfirmed) missingFields.push('ESIC 15-day intimation declaration checkbox');
      if (isBlank(f.ipSignatureDataUrl)) missingFields.push('Signature/T.I. of Insured Person (IP)');
      break;
    }

    case 'form-07': {
      const f = responses['form-07'];
      if (isBlank(f.nomineeName)) missingFields.push('Nominee Name');
      if (isBlank(f.relationshipWithEmployee)) missingFields.push('Relationship');
      if (isBlank(f.nomineeAddress)) missingFields.push('Nominee Residential Address');
      if (isBlank(f.witness1Details)) missingFields.push('1. Witness');
      if (isBlank(f.witness2Details)) missingFields.push('2. Witness');
      if (isBlank(f.date)) missingFields.push('Date');
      if (isBlank(f.signatureDataUrl)) missingFields.push('Signature / Thumb Impression');
      if (!f.declarationConfirmed) missingFields.push('Nomination confirmation checkbox');
      break;
    }

    case 'form-08': {
      const f = responses['form-08'];
      if (isBlank(f.memberName)) missingFields.push('Name of the member');
      if (isBlank(f.fatherOrSpouseName)) missingFields.push("Father's/Spouse's Name");
      if (isBlank(f.dateOfBirth)) missingFields.push('Date of Birth');
      if (isBlank(f.gender)) missingFields.push('Gender');
      if (isBlank(f.maritalStatus)) missingFields.push('Marital Status');
      if (isBlank(f.emailId) || isBlank(f.mobileNo)) missingFields.push('Email ID & Mobile No.');
      if (isBlank(f.earlierMemberEpf1952) || isBlank(f.earlierMemberEps1995)) {
        missingFields.push('Earlier EPF 1952 & EPS 1995 membership (Yes / No)');
      }
      if (isBlank(f.internationalWorker)) missingFields.push('International Worker (Yes / No)');
      if (isBlank(f.bankAccountNo) || isBlank(f.ifscCode)) {
        missingFields.push('Bank Account No. & IFS Code');
      }
      if (isBlank(f.aadharNumber)) missingFields.push('AADHAR Number');
      if (!f.undertakingAccepted) missingFields.push('Undertaking acceptance checkbox');
      if (isBlank(f.date) || isBlank(f.place)) missingFields.push('Date & Place');
      if (isBlank(f.memberSignatureDataUrl)) missingFields.push('Signature of Member');
      break;
    }

    case 'form-09': {
      const f = responses['form-09'];
      if (isBlank(f.employeeFullNameHeader)) missingFields.push('Full Name (I, Shri/Shrimati/Kumari)');
      const hasNominee = f.nominees.some(
        (n) =>
          !isBlank(n.nomineeNameAndAddress) &&
          !isBlank(n.relationship) &&
          !isBlank(n.shareProportion)
      );
      if (!hasNominee) {
        missingFields.push('Nominee(s) — at least one nominee with address, relationship & proportion');
      }
      if (isBlank(f.statementEmployeeName)) missingFields.push('Statement 1. Name of employee in full');
      if (isBlank(f.statementSex)) missingFields.push('Statement 2. Sex');
      if (isBlank(f.statementMaritalStatus)) missingFields.push('Statement 4. Marital status');
      if (isBlank(f.statementDepartmentBranch)) missingFields.push('Statement 5. Department/Branch/Section');
      if (isBlank(f.permanentDistrict) || isBlank(f.permanentState)) {
        missingFields.push('Statement 8. Permanent address (District & State)');
      }
      if (isBlank(f.employeePlace) || isBlank(f.employeeDate)) {
        missingFields.push('Employee Place & Date');
      }
      if (isBlank(f.employeeSignatureDataUrl)) {
        missingFields.push('Signature/Thumb-impression of the Employee');
      }
      if (
        isBlank(f.witness1NameAndAddress) ||
        isBlank(f.witness1SignatureDataUrl) ||
        isBlank(f.witness2NameAndAddress) ||
        isBlank(f.witness2SignatureDataUrl)
      ) {
        missingFields.push('Declaration by Witnesses (Witness 1 & 2 names, addresses & signatures)');
      }
      if (!f.declarationConfirmed) missingFields.push('Form F nomination confirmation checkbox');
      break;
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

export function isFormSlotCompleted(
  formId: AnyFormId,
  responses: OnboardingFormResponses
): boolean {
  return validateFormCompletion(formId, responses).valid;
}

export function calculateOnboardingProgress(session: OnboardingSessionState): ProgressBreakdown {
  const totalFormsCount = HR_FORMS_CATALOG.length;
  const incompleteFormNumbers: number[] = [];
  let completedFormsCount = 0;

  for (const form of HR_FORMS_CATALOG) {
    const formId = form.id as AnyFormId;
    if (isFormSlotCompleted(formId, session.formResponses)) {
      completedFormsCount += 1;
    } else {
      incompleteFormNumbers.push(form.formNumber);
    }
  }

  const uploadedDocumentsCount = session.uploadedDocuments.length;
  const hasUploadedDocument = uploadedDocumentsCount > 0;
  const isSubmitted = Boolean(session.submittedAt);

  // Total milestones = 9 form modules + 1 document upload milestone + 1 final submission milestone = 11
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

/**
 * Returns a human-readable entry summary for FinalReviewPanel without inventing dummy values.
 */
export function getFormResponseSummary(
  formId: AnyFormId,
  responses: OnboardingFormResponses
): string {
  switch (formId) {
    case 'form-01':
      return responses['form-01'].nameInCapitals || 'No name entered yet';
    case 'form-02':
      return responses['form-02'].name || 'No joining name entered yet';
    case 'form-03':
      return responses['form-03'].employeeName || 'No employee name entered yet';
    case 'form-04':
      return responses['form-04'].employeeName || 'Checklist not confirmed yet';
    case 'form-05':
      return responses['form-05'].nameInBlockLetters || 'No EPF member name entered yet';
    case 'form-06':
      return responses['form-06'].nameInBlockLetters || 'No ESIC IP name entered yet';
    case 'form-07':
      return responses['form-07'].nomineeName
        ? `Nominee: ${responses['form-07'].nomineeName}`
        : 'No nominee entered yet';
    case 'form-08':
      return responses['form-08'].memberName || 'No Form 11 member name entered yet';
    case 'form-09':
      return responses['form-09'].employeeFullNameHeader || 'No Form F employee name entered yet';
  }
}

export function prefillFormFromBioData<K extends Exclude<AnyFormId, 'form-01'>>(
  formId: K,
  bio: Form01BioData,
  current: OnboardingFormResponses[K]
): OnboardingFormResponses[K] {
  const pick = (existing: string, fallback: string) =>
    existing.trim().length > 0 ? existing : fallback;

  switch (formId) {
    case 'form-02': {
      const f = current as Form02JoiningFormat;
      return {
        ...f,
        name: pick(f.name, bio.nameInCapitals),
        fatherName: pick(f.fatherName, bio.fatherName),
        designation: pick(f.designation, bio.positionAppliedFor),
        dateOfBirth: pick(f.dateOfBirth, bio.dateOfBirth),
        contactNumber: pick(f.contactNumber, bio.mobileNo),
        presentAddress: pick(f.presentAddress, bio.presentAddress),
        permanentAddress: pick(f.permanentAddress, bio.permanentAddress),
        emergency1Name: pick(f.emergency1Name, bio.emergencyContactName),
        emergency1Mobile: pick(f.emergency1Mobile, bio.emergencyContactTel),
        emergency1Relationship: pick(f.emergency1Relationship, bio.emergencyContactRelationship),
        signatureName: pick(f.signatureName, bio.nameInCapitals),
      } as OnboardingFormResponses[K];
    }
    case 'form-03': {
      const f = current as Form03Mediclaim;
      const updatedRows = f.familyMembers.map((row, idx) => {
        if (idx === 0) {
          return {
            ...row,
            memberName: pick(row.memberName, bio.nameInCapitals),
            dateOfBirth: pick(row.dateOfBirth, bio.dateOfBirth),
          };
        }
        if (idx === 1 && bio.spouseName) {
          return {
            ...row,
            memberName: pick(row.memberName, bio.spouseName),
          };
        }
        return row;
      });
      return {
        ...f,
        employeeName: pick(f.employeeName, bio.nameInCapitals),
        designation: pick(f.designation, bio.positionAppliedFor),
        familyMembers: updatedRows,
      } as OnboardingFormResponses[K];
    }
    case 'form-04': {
      const f = current as Form04Checklist;
      return {
        ...f,
        employeeName: pick(f.employeeName, bio.nameInCapitals),
        designation: pick(f.designation, bio.positionAppliedFor),
      } as OnboardingFormResponses[K];
    }
    case 'form-05': {
      const f = current as Form05EpfForm2;
      return {
        ...f,
        nameInBlockLetters: pick(f.nameInBlockLetters, bio.nameInCapitals.toUpperCase()),
        fatherOrHusbandName: pick(
          f.fatherOrHusbandName,
          bio.fatherName || bio.spouseName
        ),
        dateOfBirth: pick(f.dateOfBirth, bio.dateOfBirth),
        maritalStatus: pick(f.maritalStatus, bio.maritalStatus),
        accountNo: pick(f.accountNo, bio.pfUanNo),
        permanentAddress: pick(f.permanentAddress, bio.permanentAddress),
        temporaryAddress: pick(f.temporaryAddress, bio.presentAddress),
      } as OnboardingFormResponses[K];
    }
    case 'form-06': {
      const f = current as Form06EsicForm1;
      return {
        ...f,
        insuranceNo: pick(f.insuranceNo, bio.esicNo),
        nameInBlockLetters: pick(f.nameInBlockLetters, bio.nameInCapitals.toUpperCase()),
        fatherOrHusbandName: pick(
          f.fatherOrHusbandName,
          bio.fatherName || bio.spouseName
        ),
        dateOfBirth: pick(f.dateOfBirth, bio.dateOfBirth),
        presentAddress: pick(f.presentAddress, bio.presentAddress),
        presentPhoneOrEmail: pick(f.presentPhoneOrEmail, bio.mobileNo || bio.email),
        permanentAddress: pick(f.permanentAddress, bio.permanentAddress),
        permanentPhoneOrEmail: pick(f.permanentPhoneOrEmail, bio.mobileNo || bio.email),
      } as OnboardingFormResponses[K];
    }
    case 'form-07': {
      const f = current as Form07Form25;
      return f as OnboardingFormResponses[K];
    }
    case 'form-08': {
      const f = current as Form08Form11;
      return {
        ...f,
        memberName: pick(f.memberName, bio.nameInCapitals),
        fatherOrSpouseName: pick(
          f.fatherOrSpouseName,
          f.relationType === 'Spouse' && bio.spouseName ? bio.spouseName : bio.fatherName
        ),
        dateOfBirth: pick(f.dateOfBirth, bio.dateOfBirth),
        emailId: pick(f.emailId, bio.email),
        mobileNo: pick(f.mobileNo, bio.mobileNo),
        previousUan: pick(f.previousUan, bio.pfUanNo),
        aadharNumber: pick(f.aadharNumber, bio.aadharNo),
        panNumber: pick(f.panNumber, bio.panNo),
      } as OnboardingFormResponses[K];
    }
    case 'form-09': {
      const f = current as Form09GratuityFormF;
      return {
        ...f,
        employeeFullNameHeader: pick(f.employeeFullNameHeader, bio.nameInCapitals),
        statementEmployeeName: pick(f.statementEmployeeName, bio.nameInCapitals),
      } as OnboardingFormResponses[K];
    }
  }
}

export function extractFileExtension(fileName: string): string {
  const clean = fileName.trim();
  const lastDot = clean.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === clean.length - 1) {
    return '';
  }
  return clean.slice(lastDot + 1).toLowerCase();
}

export function doesExtensionMatchMimeType(extension: string, mimeType: string): boolean {
  const normalizedMime = mimeType.trim().toLowerCase() as AllowedDocumentMimeType;
  const allowedExts = ALLOWED_DOCUMENT_EXTENSIONS_BY_MIME[normalizedMime];
  if (!allowedExts) {
    return false;
  }
  return allowedExts.includes(extension.trim().toLowerCase());
}

export function validateDocumentFile(file: {
  name: string;
  sizeBytes: number;
  mimeType: string;
}): FileValidationResult {
  if (!file.name || file.name.trim().length === 0) {
    return { valid: false, error: 'File name is required.' };
  }

  if (/[\\/\0]/.test(file.name) || file.name.includes('..')) {
    return { valid: false, error: 'File name contains invalid path characters.' };
  }

  if (!Number.isFinite(file.sizeBytes) || file.sizeBytes <= 0) {
    return { valid: false, error: 'Selected file is empty.' };
  }

  if (file.sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File exceeds the 10 MB maximum upload limit.',
    };
  }

  const normalizedType = file.mimeType.trim().toLowerCase();
  const isAllowed = (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(normalizedType);
  if (!isAllowed) {
    return {
      valid: false,
      error: 'Only PDF, JPG, and PNG files are accepted.',
    };
  }

  const ext = extractFileExtension(file.name);
  if (!ext || !doesExtensionMatchMimeType(ext, normalizedType)) {
    return {
      valid: false,
      error: `File extension (.${ext || 'none'}) does not match content type ${normalizedType}.`,
    };
  }

  return { valid: true };
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
  return base.replace(/^-+|-+$/g, '') || 'document.pdf';
}

export function buildSupabaseStoragePath(
  scopeId: string,
  slotId: string,
  fileName: string
): string {
  const safeScope = scopeId.replace(/[^a-zA-Z0-9_-]/g, '') || 'unknown-scope';
  const safeSlot = slotId.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
  const safeName = sanitizeFileName(fileName);
  return `onboarding/${safeScope}/${safeSlot}/${safeName}`;
}

export function validateInvitationInput(input: {
  referenceLabel?: unknown;
  department?: unknown;
  targetRole?: unknown;
  expiryDays?: unknown;
}): InvitationValidationResult {
  const referenceLabel =
    typeof input.referenceLabel === 'string' ? input.referenceLabel.trim() : '';
  const department =
    typeof input.department === 'string' ? input.department.trim() : '';
  const targetRole =
    typeof input.targetRole === 'string' ? input.targetRole.trim() : '';
  const rawExpiry = Number(input.expiryDays);

  if (referenceLabel.length < 2) {
    return {
      valid: false,
      error: 'Reference label is required and must be at least 2 characters.',
    };
  }
  if (department.length < 2) {
    return {
      valid: false,
      error: 'Please select a valid department.',
    };
  }
  if (targetRole.length < 2) {
    return {
      valid: false,
      error: 'Target role placeholder is required and must be at least 2 characters.',
    };
  }
  if (!Number.isInteger(rawExpiry) || rawExpiry < 1 || rawExpiry > 90) {
    return {
      valid: false,
      error: 'Link validity window must be between 1 and 90 days.',
    };
  }

  return {
    valid: true,
    normalized: {
      referenceLabel,
      department,
      targetRole,
      expiryDays: rawExpiry,
    },
  };
}

export function getEffectiveInvitationStatus(
  invitation: Pick<OnboardingInvitation, 'status' | 'expiresAt'>,
  nowIso: string = new Date().toISOString()
): InvitationStatus {
  if (invitation.status === 'expired') {
    return 'expired';
  }
  const expiresMs = Date.parse(invitation.expiresAt);
  const nowMs = Date.parse(nowIso);
  if (Number.isNaN(expiresMs) || expiresMs <= nowMs) {
    return 'expired';
  }
  return 'active';
}

export function isInvitationAccessible(
  invitation: OnboardingInvitation | undefined,
  nowIso: string = new Date().toISOString()
): { accessible: boolean; reason?: string } {
  if (!invitation) {
    return {
      accessible: false,
      reason:
        'This onboarding invitation link could not be found or is no longer active. Please contact DICS Global HR for an updated link.',
    };
  }
  if (invitation.status === 'expired') {
    return { accessible: false, reason: 'This onboarding invitation link has expired.' };
  }
  const expiresMs = Date.parse(invitation.expiresAt);
  const nowMs = Date.parse(nowIso);
  if (Number.isNaN(expiresMs) || expiresMs <= nowMs) {
    return {
      accessible: false,
      reason: 'This onboarding invitation link has passed its expiry date.',
    };
  }
  return { accessible: true };
}

export function filterInvitations(
  invitations: readonly OnboardingInvitation[],
  searchQuery: string,
  statusFilter: InvitationStatusFilter = 'all',
  nowIso: string = new Date().toISOString()
): OnboardingInvitation[] {
  const q = searchQuery.trim().toLowerCase();

  return invitations.filter((inv) => {
    const effectiveStatus = getEffectiveInvitationStatus(inv, nowIso);
    if (statusFilter !== 'all' && effectiveStatus !== statusFilter) {
      return false;
    }

    if (!q) {
      return true;
    }

    return (
      inv.referenceLabel.toLowerCase().includes(q) ||
      inv.department.toLowerCase().includes(q) ||
      inv.targetRole.toLowerCase().includes(q) ||
      (inv.token || '').toLowerCase().includes(q) ||
      (inv.tokenHint || '').toLowerCase().includes(q) ||
      (inv.invitePath || '').toLowerCase().includes(q)
    );
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function generateRandomHex(byteLength: number): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('Secure browser random generator (crypto.getRandomValues) is unavailable.');
  }
  const bytes = new Uint8Array(byteLength);
  cryptoApi.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateInvitationToken(existingTokens?: ReadonlySet<string>): string {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    // 24 random bytes (192 bits) for stronger unguessable invitation links
    const token = `dics-${generateRandomHex(24)}`;
    if (!existingTokens || !existingTokens.has(token)) {
      return token;
    }
  }
  throw new Error('Failed to allocate a unique invitation token.');
}

/**
 * Accepts both new 192-bit tokens (48 hex chars) and legacy 96-bit tokens (24 hex chars)
 * for non-breaking dual-read migration compatibility.
 */
export function isValidInvitationTokenFormat(token: string): boolean {
  return /^dics-[0-9a-f]{24,64}$/.test(token.trim());
}

export function formatInvitationTokenHint(token: string): string {
  const clean = token.trim();
  if (clean.length < 10) return '••••';
  return `${clean.slice(0, 5)}••••${clean.slice(-4)}`;
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

export function generatePreviewReceiptCode(): string {
  return `DICS-PREVIEW-${generateRandomHex(4).toUpperCase()}`;
}

export function generateSubmissionReceiptCode(): string {
  return `DICS-ONB-${generateRandomHex(5).toUpperCase()}`;
}

export function createEmptyOfficeUseEntry(invitationId: string): HrOfficeUseEntry {
  return {
    invitationId,
    form01SelectionStatus: '',
    form01SelectedAs: '',
    form01ReportingTo: '',
    form01ReviewDate: '',
    form03EmpNo: '',
    form04EffectiveDate: '',
    form04RevisionDate: '',
    form04EmpNo: '',
    form04PostEmploymentStatuses: {},
    form04HrRemarks: '',
    form04DataEnteredBy: '',
    form04DataEnteredDate: '',
    form04DataCheckedBy: '',
    form04DataCheckedDate: '',
    form05EmployerCertDate: '',
    form05AuthorizedOfficer: '',
    form06EmployerCodeNo: '',
    form06DateOfAppointment: '',
    form08EmployerUanVerified: '',
    form08MemberId: '',
    form08AuthorizedSignatory: '',
    form09EmployerCertDate: '',
    form09EmployerDesignation: '',
    form09DuplicateIssuedToEmployee: false,
    updatedByAdminId: null,
    updatedAt: null,
  };
}

