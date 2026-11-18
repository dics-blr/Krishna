import type { HRFormDefinition } from './types';

export const DICS_COMPANY_HEADER = {
  companyName: 'DIGITAL INSTRUMENTS & CONTROL SYSTEMS',
  shortBrand: 'DICS Global',
  address: '#B-261, 6th Main, 2nd Stage, Peenya Industrial Estate, Bengaluru -560058',
  phone: '080-23235465/23232773',
  email: 'bangalore@dicsglobal.com',
} as const;

export interface PersonalFileChecklistCategory {
  slNo: number;
  title: string;
  items: Array<{
    key: string;
    label: string;
  }>;
}

export const PERSONAL_FILE_CHECKLIST_ITEMS: PersonalFileChecklistCategory[] = [
  { slNo: 1, title: 'Updated Resume', items: [{ key: 'item-01', label: 'Updated Resume' }] },
  {
    slNo: 2,
    title: 'Interview Evaluation Form',
    items: [{ key: 'item-02', label: 'Interview Evaluation Form' }],
  },
  {
    slNo: 3,
    title: 'Copy of the offer Letter duly signed by the employee',
    items: [{ key: 'item-03', label: 'Copy of the offer Letter duly signed by the employee' }],
  },
  {
    slNo: 4,
    title: 'Employment Application Form',
    items: [{ key: 'item-04', label: 'Employment Application Form' }],
  },
  { slNo: 5, title: 'NDA Form', items: [{ key: 'item-05', label: 'NDA Form' }] },
  {
    slNo: 6,
    title: 'Copy of the Appointment Letter duly acknowledged by the employee',
    items: [
      {
        key: 'item-06',
        label: 'Copy of the Appointment Letter duly acknowledged by the employee',
      },
    ],
  },
  { slNo: 7, title: 'Joining Report', items: [{ key: 'item-07', label: 'Joining Report' }] },
  { slNo: 8, title: 'ID Card', items: [{ key: 'item-08', label: 'ID Card' }] },
  {
    slNo: 9,
    title: 'Induction Manual & Induction Schedule',
    items: [{ key: 'item-09', label: 'Induction Manual & Induction Schedule' }],
  },
  {
    slNo: 10,
    title: 'Bank Account Opening Form',
    items: [{ key: 'item-10', label: 'Bank Account Opening Form' }],
  },
  {
    slNo: 11,
    title: '2 Nos. Passport Size Colour Photographs',
    items: [{ key: 'item-11', label: '2 Nos. Passport Size Colour Photographs' }],
  },
  {
    slNo: 12,
    title: '2 Nos. Family Photographs(Applicable For ESI Employee)',
    items: [
      {
        key: 'item-12',
        label: '2 Nos. Family Photographs(Applicable For ESI Employee)',
      },
    ],
  },
  {
    slNo: 13,
    title: 'Photocopies of Educational Qualification Certificates:',
    items: [
      { key: 'item-13-1', label: 'SSLC Marks Card' },
      { key: 'item-13-2', label: 'PUC Marks Card' },
      { key: 'item-13-3', label: 'ITI/Diploma Marks Card & Certificate' },
      { key: 'item-13-4', label: 'Graduation Marks Card & Certificate' },
      { key: 'item-13-5', label: "PG/Master's Degree Marks Cards & Certificate" },
    ],
  },
  {
    slNo: 14,
    title: 'Identity Proof & Residential Address Proof:',
    items: [
      { key: 'item-14-1', label: 'Valid Passport Photocopy' },
      { key: 'item-14-2', label: 'PAN Card Copy' },
      { key: 'item-14-3', label: 'Aadhaar Card Copy' },
      { key: 'item-14-4', label: 'Driving Licence Copy' },
    ],
  },
  {
    slNo: 15,
    title: 'Previous Company Details',
    items: [
      { key: 'item-15-1', label: 'Relieving Letter' },
      { key: 'item-15-2', label: 'Service Certificate' },
      { key: 'item-15-3', label: 'Pay Slips(2-3 months) & CTC details' },
    ],
  },
  {
    slNo: 16,
    title: 'Declaration & Nomination Forms:',
    items: [
      { key: 'item-16-1', label: 'PF Declaration Form(Form-2)' },
      { key: 'item-16-2', label: 'ESIC Declaration Form-(Form-2)(If Applicable)' },
      { key: 'item-16-3', label: 'Gratuity Nomination Form(Form-F)' },
      { key: 'item-16-4', label: 'Mediclaim Form(If Applicable)' },
    ],
  },
];

export const HR_FORMS_CATALOG: HRFormDefinition[] = [
  {
    id: 'form-01',
    formNumber: 1,
    code: 'DICS-HR-01',
    shortTitle: 'Bio-Data Form',
    title: 'BIO-DATA FORM',
    sourceFilename: 'Bio Data Form.pdf',
    sourceAssetPath: '/assets/aistudio/Bio_Data_Form_f28f2297.pdf',
    documentReference: 'DICS Bio-Data Form (3 Pages)',
    pageCount: 3,
    summary:
      'Candidate personal particulars, physical/statutory IDs, family occupation, languages known, educational qualifications (SSLC onwards), work experience, medical/conduct disclosures, emergency contact, two non-related references, applicant certification, and HR Office Use selection block.',
    mappingStatus: 'mapped',
    sectionSlots: [
      {
        id: 'form-01-sec-a',
        heading: 'Page 1 — Personal, Family, Statutory IDs & Languages Known',
        description:
          'Name (in Capitals), Position applied for, Photograph, Present/Permanent Address, Contact, DOB, Height/Weight, Blood Group, Mother Tongue, Marital Status, Dependents, Parents/Spouse/Children, PF UAN, ESIC, PAN, AADHAR, and Languages Known table.',
      },
      {
        id: 'form-01-sec-b',
        heading: 'Page 2 — Education, Work Experience & Health/Conduct Disclosures',
        description:
          'Educational Qualifications (Start from SSLC onwards), Break in Educational Career, Extracurricular activities, Work Experience (Start from present job), Employment discontinuity, dismissal/conviction disclosures, psychological/daily medication, and medical conditions.',
      },
      {
        id: 'form-01-sec-c',
        heading: 'Page 3 — Emergency Contact, References, Certification & Office Use',
        description:
          'Person to be informed in case of emergency, two non-related references (name, address, telephone nos.), truth & completeness certification, Place/Date/Signature of the Applicant, and (FOR OFFICE USE) GM / HR Department block.',
      },
    ],
    attachmentSlotId: 'attachment-slot-01',
    attachmentSlotLabel: 'Applicant Passport Size Photograph & Bio-Data Supporting Files',
  },
  {
    id: 'form-02',
    formNumber: 2,
    code: 'DICS-HR-02',
    shortTitle: 'Joining Format',
    title: 'JOINING FORMAT',
    sourceFilename: 'Joining Format.pdf',
    sourceAssetPath: '/assets/aistudio/Joining_Format_5e5d1580.pdf',
    documentReference: 'DICS Joining Format (1 Page)',
    pageCount: 1,
    summary:
      'Employee joining record capturing Name, Father’s name, Designation, Date of Birth, Date of joining, Contact Number, Residential Present & Permanent Address, two emergency contacts, Date, and employee signature.',
    mappingStatus: 'mapped',
    sectionSlots: [
      {
        id: 'form-02-sec-a',
        heading: 'Employee Joining Particulars',
        description:
          'Name, Father’s name, Designation, Date of Birth, Date of joining, and Contact Number.',
      },
      {
        id: 'form-02-sec-b',
        heading: 'Residential Address',
        description: 'Present Address and Permanent Address blocks.',
      },
      {
        id: 'form-02-sec-c',
        heading: 'Emergency Contacts & Sign-Off',
        description:
          'Two emergency contact persons (Name, Mobile No., Relationship), Date, and Employee Signature.',
      },
    ],
    attachmentSlotId: 'attachment-slot-02',
    attachmentSlotLabel: 'Joining Format Supporting Attachment',
  },
  {
    id: 'form-03',
    formNumber: 3,
    code: 'DICS-HR-03',
    shortTitle: 'Mediclaim Declaration',
    title: 'MEDICLAIM DECLARATION FORM',
    sourceFilename: 'Mediclaim Declaration Form.pdf',
    sourceAssetPath: '/assets/aistudio/Mediclaim_Declaration_Form_0a909bd7.pdf',
    documentReference: 'DICS Mediclaim Declaration Form (1 Page)',
    pageCount: 1,
    summary:
      'Employee Mediclaim enrollment particulars and Family Particulars for Mediclaim Insurance covering Self, Spouse, Child-1, and Child-2 with Date of Birth and Gender as per medical insurance policy.',
    mappingStatus: 'mapped',
    sectionSlots: [
      {
        id: 'form-03-sec-a',
        heading: 'Employee Particulars',
        description: 'Name of the Employee, Emp. No. (HR Use), Date of Joining, Designation, Department.',
      },
      {
        id: 'form-03-sec-b',
        heading: 'Family Particulars for Mediclaim Insurance',
        description:
          'Sl. No. 1–4 table covering Self, Spouse, Child-1, and Child-2 (Name, Relationship, Date of Birth, Gender).',
      },
      {
        id: 'form-03-sec-c',
        heading: 'Policy Note & Employee Confirmation',
        description: 'NOTE: AS PER MEDICAL INSURANCE POLICY and employee declaration confirmation.',
      },
    ],
    attachmentSlotId: 'attachment-slot-03',
    attachmentSlotLabel: 'Mediclaim Family Supporting Attachment',
  },
  {
    id: 'form-04',
    formNumber: 4,
    code: 'DICS-HR-04',
    shortTitle: 'Personal File Checklist',
    title: 'CHECK LIST FOR PERSONAL FILE',
    sourceFilename: 'Checklist for Personal File.pdf',
    sourceAssetPath: '/assets/aistudio/Checklist_for_Personal_File_93c66120.pdf',
    documentReference: 'Document No.: DICS/HR/EPFC (1 Page)',
    pageCount: 1,
    summary:
      'DICS/HR/EPFC personal file verification checklist covering 16 categories (Resume, Offer/Appointment Letters, NDA, Photographs, Education Certificates, ID Proofs, Previous Company Details, Statutory Declarations) with Pre/Post Employment status and HR Data Entered/Checked sign-off.',
    mappingStatus: 'mapped',
    sectionSlots: [
      {
        id: 'form-04-sec-a',
        heading: 'Document Control & Employee Header',
        description:
          'Document No.: DICS/HR/EPFC, Effective/Revision Date (HR), Employee Name, D.O.J., Designation, Department, Emp.No. (HR).',
      },
      {
        id: 'form-04-sec-b',
        heading: '16-Category Checklist Items (SL.NO. 1–16)',
        description:
          'Pre-Employment document readiness & Post-Employment HR verification across items 1–12 and grouped items 13 (Education), 14 (ID/Address), 15 (Previous Company), and 16 (Declarations/Nominations).',
      },
      {
        id: 'form-04-sec-c',
        heading: 'HR Remarks & Verification Sign-Off (Office Use)',
        description:
          'Remarks by HR personnel entering the data, Data Entered by (Name/Signature/Date), and Data Checked By (Name/Signature/Date).',
      },
    ],
    attachmentSlotId: 'attachment-slot-04',
    attachmentSlotLabel: 'Personal File Verification Supporting Scans',
  },
  {
    id: 'form-05',
    formNumber: 5,
    code: 'DICS-HR-05',
    shortTitle: 'EPF Form 2 (Revised)',
    title: 'FORM 2 (Revised) — EPF & EPS Nomination and Declaration Form',
    sourceFilename: 'EPF Nomination Form No 2.pdf',
    sourceAssetPath: '/assets/aistudio/EPF_Nomination_Form_No_2_67fc70e1.pdf',
    documentReference: 'EPF Scheme 1952 (Paras 33 & 61(1)) & EPS 1995 (Para 18) (4 Pages)',
    pageCount: 4,
    summary:
      'Statutory EPF/EPS Form 2 (Revised) covering member particulars (1–8), Part A (EPF) nominee table and declarations, Part B (EPS) family particulars and widow pension nominee, Certificate by Employer, and verbatim statutory Guidance.',
    mappingStatus: 'mapped',
    sectionSlots: [
      {
        id: 'form-05-sec-a',
        heading: 'Page 1 — Member Particulars (1–8) & Part A (EPF)',
        description:
          'Name (Block letters), Father’s/Husband’s Name, DOB, Sex, Marital Status, Account No., Permanent/Temporary Address, DOJ (EPF/EPS), EPF Nominees table, and declarations 1 & 2.',
      },
      {
        id: 'form-05-sec-b',
        heading: 'Page 2 — Part B (EPS) & Certificate by Employer',
        description:
          'Family members eligible for widow/children pension, monthly widow pension nominee, Date/Place/Subscriber Signature, and Certificate by Employer (Office Use).',
      },
      {
        id: 'form-05-sec-c',
        heading: 'Pages 3–4 — Statutory Guidance Notes',
        description:
          'Guidance for filling Form No - 2 (Para 33, Para 61, Para 2(g)) and Employees Pension Scheme, 1995 (Para 18, Para 2(vii)).',
      },
    ],
    attachmentSlotId: 'attachment-slot-05',
    attachmentSlotLabel: 'EPF Form 2 Supporting Documents',
  },
  {
    id: 'form-06',
    formNumber: 6,
    code: 'DICS-HR-06',
    shortTitle: 'ESIC Declaration Form 1',
    title: 'FORM – I — ESIC Declaration Form',
    sourceFilename: 'ESIC Declaration form 1.pdf',
    sourceAssetPath: '/assets/aistudio/ESIC_Declaration_form_1_8ffddf93.pdf',
    documentReference: 'ESI Act 1948 / ESI (General) Regulations 1950 (2 Pages)',
    pageCount: 2,
    summary:
      'ESIC Form – I capturing Insured Person particulars (A), Employer & Previous Employment particulars (B), Nominee u/s 71 (C), Family Particulars (D), Temporary Identity Card preview, and Instructions / Branch Office Use Only.',
    mappingStatus: 'mapped',
    sectionSlots: [
      {
        id: 'form-06-sec-a',
        heading: 'Sections (A) & (B) — Insured Person & Employer Particulars',
        description:
          'Insurance No., Name (block letters), Father’s/Husband’s Name, DOB, Marital Status (M/U/W), Sex (M/F), Present & Permanent Addresses, Branch Office/Dispensary, and Previous Employment details.',
      },
      {
        id: 'form-06-sec-b',
        heading: 'Sections (C) & (D) — Nominee u/s 71 & Family Particulars',
        description:
          'Death cash benefit nominee (Name, Relationship, Address), 15-day change undertaking, Signature/T.I. of IP, and Family Particulars table with residing status & residence place.',
      },
      {
        id: 'form-06-sec-c',
        heading: 'Temporary Identity Card, Instructions & Branch Office Use',
        description:
          'TIC preview (valid 3 months), Photograph slot, verbatim Overleaf Instructions (1–8), and External ESIC Branch Office Use Only block.',
      },
    ],
    attachmentSlotId: 'attachment-slot-06',
    attachmentSlotLabel: 'ESIC Postcard Photographs & Supporting Files',
  },
  {
    id: 'form-07',
    formNumber: 7,
    code: 'DICS-HR-07',
    shortTitle: 'Form No. 25 Nomination',
    title: 'FORM NO -25 [(See Rule 126)] — Form of Nomination',
    sourceFilename: 'Form No 25.pdf',
    sourceAssetPath: '/assets/aistudio/Form_No_25_dfb1d53b.pdf',
    documentReference: 'Rule 126 — Leave with Wages Nomination (1 Page)',
    pageCount: 1,
    summary:
      'Statutory Form No -25 [(See Rule 126)] declaring the nominee to receive balance pay due for unavailed leave with wages in the event of death before resuming work, attested by two witnesses and signed by the employee.',
    mappingStatus: 'mapped',
    sectionSlots: [
      {
        id: 'form-07-sec-a',
        heading: 'Leave with Wages Nomination Declaration',
        description:
          'Verbatim Rule 126 declaration specifying Nominee Name, Relationship, and Residential Address.',
      },
      {
        id: 'form-07-sec-b',
        heading: 'Witness Particulars',
        description: '1. Witness and 2. Witness details.',
      },
      {
        id: 'form-07-sec-c',
        heading: 'Date & Signature / Thumb Impression',
        description: 'Declaration date and employee signature or thumb impression.',
      },
    ],
    attachmentSlotId: 'attachment-slot-07',
    attachmentSlotLabel: 'Form No. 25 Supporting Attachment',
  },
  {
    id: 'form-08',
    formNumber: 8,
    code: 'DICS-HR-08',
    shortTitle: 'EPF Form 11 (Revised)',
    title: 'New Form No.-11 – Declaration Form (EPFO)',
    sourceFilename: 'Form11 Revised.pdf',
    sourceAssetPath: '/assets/aistudio/Form11_Revised_2cde3713.pdf',
    documentReference: 'EPFS 1952 (Paras 34 & 57) & EPS 1995 (Para 24) (1 Page)',
    pageCount: 1,
    summary:
      'EPFO New Form No.-11 Declaration Form capturing member identity (1–6), earlier EPF/EPS membership (7–8), previous employment/UAN/exit details (9), International Worker/Passport (10), KYC details (11), 4-clause Undertaking, and Declaration by Present Employer.',
    mappingStatus: 'mapped',
    sectionSlots: [
      {
        id: 'form-08-sec-a',
        heading: 'Member Details & Previous Employment (Items 1–10)',
        description:
          'Member Name, Father’s/Spouse’s Name, DOB, Gender, Marital Status, Email/Mobile, Previous EPF/EPS status, UAN/PF No./Exit Date/Scheme Cert/PPO, and International Worker/Passport details.',
      },
      {
        id: 'form-08-sec-b',
        heading: 'KYC Details & Self-Attested Copies (Item 11)',
        description:
          'Bank Account No. & IFS Code, AADHAR Number, Permanent Account Number (PAN), and attached self-attested KYC copies.',
      },
      {
        id: 'form-08-sec-c',
        heading: 'Undertaking & Declaration by Present Employer',
        description:
          'Verbatim 4-clause Undertaking, Date/Place/Signature of Member, and Employer-only UAN/DSC Declaration (A, B, C).',
      },
    ],
    attachmentSlotId: 'attachment-slot-08',
    attachmentSlotLabel: 'Self-Attested KYC Copies (Bank/IFSC, Aadhaar, PAN)',
  },
  {
    id: 'form-09',
    formNumber: 9,
    code: 'DICS-HR-09',
    shortTitle: "Gratuity Form 'F'",
    title: "FORM 'F' — Payment of Gratuity (Central) Rules Nomination",
    sourceFilename: 'Gratuity_Act_Form-F-Nomination-Gratuity.pdf',
    sourceAssetPath: '/assets/aistudio/Gratuity_Act_Form-F-Nomination-Gratuity_8be40843.pdf',
    documentReference: 'Payment of Gratuity (Central) Rules — Sub-rule (1) of Rule 6 (3 Pages)',
    pageCount: 3,
    summary:
      'Statutory Form ‘F’ gratuity nomination capturing establishment details, declarations (clauses 2–6), Nominee(s) table, Statement (items 1–8 including Village/Thana/Sub-division/Post Office/District/State), Employee signature, Declaration by two Witnesses, Certificate by Employer, and Page 3 Employee Acknowledgement.',
    mappingStatus: 'mapped',
    sectionSlots: [
      {
        id: 'form-09-sec-a',
        heading: 'Page 1 — Nomination, Clauses (2–6) & Nominee(s) Table',
        description:
          'Establishment address, Shri/Shrimati/Kumari full name, family/dependency/exclusion declarations (2–6), and Nominee(s) proportion table.',
      },
      {
        id: 'form-09-sec-b',
        heading: 'Page 2 — Statement (1–8), Witness Declaration & Employer Certificate',
        description:
          'Employee statement (Name, Sex, Religion, Marital Status, Dept, Post/Ticket No., DOJ, Permanent Address breakdown), Employee signature, 2 Witness signatures, and Employer Certificate (Office Use).',
      },
      {
        id: 'form-09-sec-c',
        heading: 'Page 3 — Acknowledgement by the Employee (Post-Certification)',
        description:
          'Duplicate copy acknowledgement section completed after employer certification and issuance of duplicate Form ‘F’.',
      },
    ],
    attachmentSlotId: 'attachment-slot-09',
    attachmentSlotLabel: 'Gratuity Form F Supporting Attachment',
  },
];

export interface DocumentUploadCategory {
  slotId: string;
  label: string;
  description: string;
  linkedFormCode: string;
}

export const DOCUMENT_UPLOAD_CATEGORIES: DocumentUploadCategory[] = [
  {
    slotId: 'upload-slot-photograph',
    label: 'Passport Size & Family Photographs',
    description:
      'Passport size colour photographs (Bio-Data & Checklist Item 11) and family photographs if applicable for ESI (ESIC Form 1 & Checklist Item 12).',
    linkedFormCode: 'DICS-HR-01 / 04 / 06',
  },
  {
    slotId: 'upload-slot-kyc-id',
    label: 'Identity, Address & KYC Proof (Self-Attested)',
    description:
      'Aadhaar Card Copy, PAN Card Copy, Bank Account/Cancelled Cheque (IFSC), Passport Photocopy, and Driving Licence Copy.',
    linkedFormCode: 'DICS-HR-04 / 08',
  },
  {
    slotId: 'upload-slot-education',
    label: 'Educational Qualification Certificates',
    description:
      'SSLC Marks Card, PUC Marks Card, ITI/Diploma, Graduation, and PG/Master’s Degree Marks Cards & Certificates.',
    linkedFormCode: 'DICS-HR-01 / 04',
  },
  {
    slotId: 'upload-slot-previous-employment',
    label: 'Previous Employment & Resume Documents',
    description:
      'Updated Resume, Relieving Letter, Service Certificate, and Pay Slips (2–3 months) & CTC details.',
    linkedFormCode: 'DICS-HR-01 / 04',
  },
  {
    slotId: 'upload-slot-general',
    label: 'General / Signed Statutory Form Scans',
    description:
      'Any additional supporting PDF, JPG, or PNG file required by HR for the onboarding packet.',
    linkedFormCode: 'DICS-HR-01 to 09',
  },
];
