export type AdminNavSection =
  | 'overview'
  | 'invitations'
  | 'submissions'
  | 'verification'
  | 'forms'
  | 'architecture';

export type InvitationStatus = 'active' | 'expired';

export type InvitationStatusFilter = 'all' | InvitationStatus;

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
  shortTitle: string;
  title: string;
  sourceFilename: string;
  sourceAssetPath: string;
  documentReference: string;
  pageCount: number;
  summary: string;
  mappingStatus: MappingStatus;
  sectionSlots: FormSectionSlot[];
  attachmentSlotId: string;
  attachmentSlotLabel: string;
}

export type SubmissionState =
  | 'not_submitted'
  | 'in_progress'
  | 'preview_completed'
  | 'submitted'
  | 'hr_verified';

export interface OnboardingInvitation {
  id: string;
  token: string;
  tokenHint?: string;
  referenceLabel: string;
  department: string;
  targetRole: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  receiptCode?: string | null;
  invitePath: string;
  submissionState: SubmissionState;
}

/* -------------------------------------------------------------------------- */
/*  Nine Original DICS Global HR Form Data Schemas                            */
/* -------------------------------------------------------------------------- */

export interface LanguageKnownRow {
  language: string;
  speak: boolean;
  read: boolean;
  write: boolean;
}

export interface EducationRow {
  examPassed: string;
  institutionNameAndAddress: string;
  subjects: string;
  periodFrom: string;
  periodTo: string;
  marksOrClass: string;
}

export interface WorkExperienceRow {
  companyName: string;
  from: string;
  to: string;
  positionHeld: string;
  salaryDrawn: string;
  reasonForLeaving: string;
}

export interface Form01BioData {
  nameInCapitals: string;
  positionAppliedFor: string;
  photoFileName: string;
  presentAddress: string;
  permanentAddress: string;
  mobileNo: string;
  email: string;
  dateOfBirth: string;
  placeOfBirth: string;
  heightCm: string;
  weightKg: string;
  bloodGroup: string;
  motherTongue: string;
  maritalStatus: string;
  noOfDependents: string;
  fatherName: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  spouseName: string;
  spouseOccupation: string;
  childrenDetails: string;
  pfUanNo: string;
  esicNo: string;
  panNo: string;
  aadharNo: string;
  languagesKnown: LanguageKnownRow[];
  educationalQualifications: EducationRow[];
  breakInEducation: '' | 'Yes' | 'No';
  breakInEducationReason: string;
  extracurricularActivities: string;
  workExperience: WorkExperienceRow[];
  discontinuityInEmployment: '' | 'Yes' | 'No';
  discontinuityReason: string;
  dismissedOrTerminated: '' | 'Yes' | 'No';
  convictedForOffences: '' | 'Yes' | 'No';
  dismissedOrConvictedDetails: string;
  psychologicalIssuesOrMedication: string;
  medicalConditions: string;
  emergencyContactName: string;
  emergencyContactAddress: string;
  emergencyContactRelationship: string;
  emergencyContactTel: string;
  reference1Name: string;
  reference1Address: string;
  reference1Tel: string;
  reference2Name: string;
  reference2Address: string;
  reference2Tel: string;
  declarationConfirmed: boolean;
  place: string;
  date: string;
  applicantSignatureDataUrl: string;
  updatedAt: string | null;
}

export interface Form02JoiningFormat {
  name: string;
  fatherName: string;
  designation: string;
  dateOfBirth: string;
  dateOfJoining: string;
  contactNumber: string;
  presentAddress: string;
  permanentAddress: string;
  emergency1Name: string;
  emergency1Mobile: string;
  emergency1Relationship: string;
  emergency2Name: string;
  emergency2Mobile: string;
  emergency2Relationship: string;
  date: string;
  signatureName: string;
  signatureDataUrl: string;
  declarationConfirmed: boolean;
  updatedAt: string | null;
}

export interface MediclaimFamilyRow {
  slNo: number;
  memberName: string;
  relationship: 'Self' | 'Spouse' | 'Child-1' | 'Child-2';
  dateOfBirth: string;
  gender: '' | 'Male' | 'Female' | 'Other';
}

export interface Form03Mediclaim {
  employeeName: string;
  empNo: string;
  dateOfJoining: string;
  designation: string;
  department: string;
  familyMembers: MediclaimFamilyRow[];
  policyNoteConfirmed: boolean;
  employeeSignatureDataUrl: string;
  declarationDate: string;
  updatedAt: string | null;
}

export type ChecklistItemStatus = '' | 'Submitted' | 'Will Submit' | 'Not Applicable';

export interface Form04Checklist {
  employeeName: string;
  dateOfJoining: string;
  designation: string;
  department: string;
  itemStatuses: Record<string, ChecklistItemStatus>;
  employeeRemarks: string;
  employeeConfirmed: boolean;
  employeeConfirmDate: string;
  updatedAt: string | null;
}

export interface EpfPartANomineeRow {
  nomineeNameAndAddress: string;
  relationship: string;
  dateOfBirth: string;
  shareProportion: string;
  minorGuardianDetails: string;
}

export interface EpfPartBFamilyRow {
  slNo: number;
  familyMemberName: string;
  address: string;
  dateOfBirth: string;
  relationship: string;
}

export interface Form05EpfForm2 {
  nameInBlockLetters: string;
  fatherOrHusbandName: string;
  dateOfBirth: string;
  sex: string;
  maritalStatus: string;
  accountNo: string;
  permanentAddress: string;
  temporaryAddress: string;
  dateOfJoiningEpf: string;
  dateOfJoiningEps: string;
  partANominees: EpfPartANomineeRow[];
  partACertifyNoFamily: boolean;
  partACertifyParentsDependent: boolean;
  partASubscriberSignatureDataUrl: string;
  partBFamilyMembers: EpfPartBFamilyRow[];
  partBCertifyNoFamily: boolean;
  partBWidowPensionNomineeNameAddress: string;
  partBWidowPensionNomineeDob: string;
  partBWidowPensionNomineeRelationship: string;
  partBDate: string;
  partBPlace: string;
  partBSubscriberSignatureDataUrl: string;
  declarationConfirmed: boolean;
  updatedAt: string | null;
}

export interface EsicFamilyRow {
  slNo: number;
  name: string;
  dobOrAge: string;
  relationship: string;
  residingWithEmployee: '' | 'Yes' | 'No';
  residenceTown: string;
  residenceState: string;
}

export interface Form06EsicForm1 {
  insuranceNo: string;
  nameInBlockLetters: string;
  fatherOrHusbandName: string;
  dateOfBirth: string;
  maritalStatus: '' | 'M' | 'U' | 'W';
  sex: '' | 'M' | 'F';
  presentAddress: string;
  presentPinCode: string;
  presentPhoneOrEmail: string;
  permanentAddress: string;
  permanentPinCode: string;
  permanentPhoneOrEmail: string;
  branchOffice: string;
  dispensary: string;
  hasPreviousEmployment: boolean;
  previousInsNo: string;
  previousEmployerCodeNo: string;
  previousEmployerNameAndAddress: string;
  previousEmployerPhoneOrEmail: string;
  nomineeName: string;
  nomineeRelationship: string;
  nomineeAddress: string;
  photoFileName: string;
  familyMembers: EsicFamilyRow[];
  declarationConfirmed: boolean;
  ipSignatureDataUrl: string;
  ticSignatureDataUrl: string;
  ticDate: string;
  updatedAt: string | null;
}

export interface Form07Form25 {
  nomineeName: string;
  relationshipWithEmployee: string;
  nomineeAddress: string;
  witness1Details: string;
  witness2Details: string;
  date: string;
  signatureDataUrl: string;
  declarationConfirmed: boolean;
  updatedAt: string | null;
}

export interface Form08Form11 {
  memberName: string;
  relationType: 'Father' | 'Spouse';
  fatherOrSpouseName: string;
  dateOfBirth: string;
  gender: '' | 'Male' | 'Female' | 'Transgender';
  maritalStatus: '' | 'Married' | 'Unmarried' | 'Widow' | 'Widower' | 'Divorcee';
  emailId: string;
  mobileNo: string;
  earlierMemberEpf1952: '' | 'Yes' | 'No';
  earlierMemberEps1995: '' | 'Yes' | 'No';
  previousUan: string;
  previousPfAccountNo: string;
  previousExitDate: string;
  schemeCertificateNo: string;
  ppoNo: string;
  internationalWorker: '' | 'Yes' | 'No';
  countryOfOrigin: string;
  passportNo: string;
  passportValidFrom: string;
  passportValidTo: string;
  bankAccountNo: string;
  ifscCode: string;
  aadharNumber: string;
  panNumber: string;
  undertakingAccepted: boolean;
  date: string;
  place: string;
  memberSignatureDataUrl: string;
  updatedAt: string | null;
}

export interface FormFNomineeRow {
  nomineeNameAndAddress: string;
  relationship: string;
  age: string;
  shareProportion: string;
}

export interface Form09GratuityFormF {
  establishmentNameAndAddress: string;
  salutation: 'Shri' | 'Shrimati' | 'Kumari';
  employeeFullNameHeader: string;
  certifyNomineesAreFamily: boolean;
  declareNoFamily: boolean;
  fatherMotherNotDependent: boolean;
  husbandParentsNotDependent: boolean;
  excludedHusbandNoticeDate: string;
  nominees: FormFNomineeRow[];
  statementEmployeeName: string;
  statementSex: string;
  statementReligion: string;
  statementMaritalStatus: '' | 'unmarried' | 'married' | 'widow' | 'widower';
  statementDepartmentBranch: string;
  statementPostHeldAndTicketNo: string;
  statementDateOfAppointment: string;
  permanentVillage: string;
  permanentThana: string;
  permanentSubDivision: string;
  permanentPostOffice: string;
  permanentDistrict: string;
  permanentState: string;
  employeePlace: string;
  employeeDate: string;
  employeeSignatureDataUrl: string;
  witness1NameAndAddress: string;
  witness1SignatureDataUrl: string;
  witness2NameAndAddress: string;
  witness2SignatureDataUrl: string;
  witnessPlace: string;
  witnessDate: string;
  declarationConfirmed: boolean;
  updatedAt: string | null;
}

export interface OnboardingFormResponses {
  'form-01': Form01BioData;
  'form-02': Form02JoiningFormat;
  'form-03': Form03Mediclaim;
  'form-04': Form04Checklist;
  'form-05': Form05EpfForm2;
  'form-06': Form06EsicForm1;
  'form-07': Form07Form25;
  'form-08': Form08Form11;
  'form-09': Form09GratuityFormF;
}

export type AnyFormId = keyof OnboardingFormResponses;

export interface UploadedDocumentItem {
  id: string;
  slotId: string;
  slotLabel: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageBucketPath: string;
  uploadedAt: string;
  storageMode: 'stage1_memory_preview' | 'supabase_private_storage';
}

export interface OnboardingSessionState {
  invitationToken: string;
  formResponses: OnboardingFormResponses;
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
  authEnforced?: boolean;
  authNotice: string;
  publicAuthConfig?: {
    url: string;
    anonKey: string;
  } | null;
}

export interface HrUserProfile {
  userId: string;
  email: string;
  fullName: string;
  role: 'hr_admin' | 'hr_reviewer';
}

export interface HrOfficeUseEntry {
  invitationId: string;
  form01SelectionStatus: string;
  form01SelectedAs: string;
  form01ReportingTo: string;
  form01ReviewDate: string;
  form03EmpNo: string;
  form04EffectiveDate: string;
  form04RevisionDate: string;
  form04EmpNo: string;
  form04PostEmploymentStatuses: Record<string, string>;
  form04HrRemarks: string;
  form04DataEnteredBy: string;
  form04DataEnteredDate: string;
  form04DataCheckedBy: string;
  form04DataCheckedDate: string;
  form05EmployerCertDate: string;
  form05AuthorizedOfficer: string;
  form06EmployerCodeNo: string;
  form06DateOfAppointment: string;
  form08EmployerUanVerified: string;
  form08MemberId: string;
  form08AuthorizedSignatory: string;
  form09EmployerCertDate: string;
  form09EmployerDesignation: string;
  form09DuplicateIssuedToEmployee: boolean;
  updatedByAdminId?: string | null;
  updatedAt?: string | null;
}

export interface AuditLogEntry {
  id: string;
  invitationId: string | null;
  actorType: 'employee' | 'hr_admin' | 'system';
  actorId: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SignedUploadUrlResponse {
  uploadUrl: string;
  token?: string;
  storageBucket: string;
  storagePath: string;
}

export interface SignedDownloadUrlResponse {
  downloadUrl: string;
  expiresInSeconds: number;
  fileName: string;
}

export interface HrSubmissionSummary {
  invitation: OnboardingInvitation;
  completedFormsCount: number;
  documentsCount: number;
  applicantName: string;
}

export interface HrSubmissionDetail {
  invitation: OnboardingInvitation;
  formResponses: OnboardingFormResponses;
  uploadedDocuments: UploadedDocumentItem[];
  officeUse: HrOfficeUseEntry;
  auditLogs: AuditLogEntry[];
}

export interface OnboardingSessionHydration {
  invitation: OnboardingInvitation;
  session: OnboardingSessionState;
}

