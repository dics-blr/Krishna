-- Stage 2 Migration 0002: Seed the Nine Original DICS Global HR Form Templates
-- Maps DICS-HR-01 through DICS-HR-09 to the exact original uploaded PDF documents.

insert into public.hr_form_templates (
  id,
  form_number,
  code,
  short_title,
  title,
  source_filename,
  document_reference,
  page_count,
  mapping_status,
  schema_definition
)
values
  (
    'form-01',
    1,
    'DICS-HR-01',
    'Bio-Data Form',
    'BIO-DATA FORM',
    'Bio Data Form.pdf',
    'DICS Bio-Data Form (3 Pages)',
    3,
    'mapped',
    '{"attachmentSlotId":"attachment-slot-01","sections":["Page 1 — Personal, Family, Statutory IDs & Languages Known","Page 2 — Education, Work Experience & Health/Conduct Disclosures","Page 3 — Emergency Contact, References, Certification & Office Use"]}'::jsonb
  ),
  (
    'form-02',
    2,
    'DICS-HR-02',
    'Joining Format',
    'JOINING FORMAT',
    'Joining Format.pdf',
    'DICS Joining Format (1 Page)',
    1,
    'mapped',
    '{"attachmentSlotId":"attachment-slot-02","sections":["Employee Joining Particulars","Residential Address","Emergency Contacts & Sign-Off"]}'::jsonb
  ),
  (
    'form-03',
    3,
    'DICS-HR-03',
    'Mediclaim Declaration',
    'MEDICLAIM DECLARATION FORM',
    'Mediclaim Declaration Form.pdf',
    'DICS Mediclaim Declaration Form (1 Page)',
    1,
    'mapped',
    '{"attachmentSlotId":"attachment-slot-03","sections":["Employee Particulars","Family Particulars for Mediclaim Insurance","Policy Note & Employee Confirmation"]}'::jsonb
  ),
  (
    'form-04',
    4,
    'DICS-HR-04',
    'Personal File Checklist',
    'CHECK LIST FOR PERSONAL FILE',
    'Checklist for Personal File.pdf',
    'Document No.: DICS/HR/EPFC (1 Page)',
    1,
    'mapped',
    '{"attachmentSlotId":"attachment-slot-04","sections":["Document Control & Employee Header","16-Category Checklist Items (SL.NO. 1–16)","HR Remarks & Verification Sign-Off (Office Use)"]}'::jsonb
  ),
  (
    'form-05',
    5,
    'DICS-HR-05',
    'EPF Form 2 (Revised)',
    'FORM 2 (Revised) — EPF & EPS Nomination and Declaration Form',
    'EPF Nomination Form No 2.pdf',
    'EPF Scheme 1952 (Paras 33 & 61(1)) & EPS 1995 (Para 18) (4 Pages)',
    4,
    'mapped',
    '{"attachmentSlotId":"attachment-slot-05","sections":["Page 1 — Member Particulars (1–8) & Part A (EPF)","Page 2 — Part B (EPS) & Certificate by Employer","Pages 3–4 — Statutory Guidance Notes"]}'::jsonb
  ),
  (
    'form-06',
    6,
    'DICS-HR-06',
    'ESIC Declaration Form 1',
    'FORM – I — ESIC Declaration Form',
    'ESIC Declaration form 1.pdf',
    'ESI Act 1948 / ESI (General) Regulations 1950 (2 Pages)',
    2,
    'mapped',
    '{"attachmentSlotId":"attachment-slot-06","sections":["Sections (A) & (B) — Insured Person & Employer Particulars","Sections (C) & (D) — Nominee u/s 71 & Family Particulars","Temporary Identity Card, Instructions & Branch Office Use"]}'::jsonb
  ),
  (
    'form-07',
    7,
    'DICS-HR-07',
    'Form No. 25 Nomination',
    'FORM NO -25 [(See Rule 126)] — Form of Nomination',
    'Form No 25.pdf',
    'Rule 126 — Leave with Wages Nomination (1 Page)',
    1,
    'mapped',
    '{"attachmentSlotId":"attachment-slot-07","sections":["Leave with Wages Nomination Declaration","Witness Particulars","Date & Signature / Thumb Impression"]}'::jsonb
  ),
  (
    'form-08',
    8,
    'DICS-HR-08',
    'EPF Form 11 (Revised)',
    'New Form No.-11 – Declaration Form (EPFO)',
    'Form11 Revised.pdf',
    'EPFS 1952 (Paras 34 & 57) & EPS 1995 (Para 24) (1 Page)',
    1,
    'mapped',
    '{"attachmentSlotId":"attachment-slot-08","sections":["Member Details & Previous Employment (Items 1–10)","KYC Details & Self-Attested Copies (Item 11)","Undertaking & Declaration by Present Employer"]}'::jsonb
  ),
  (
    'form-09',
    9,
    'DICS-HR-09',
    'Gratuity Form ''F''',
    'FORM ''F'' — Payment of Gratuity (Central) Rules Nomination',
    'Gratuity_Act_Form-F-Nomination-Gratuity.pdf',
    'Payment of Gratuity (Central) Rules — Sub-rule (1) of Rule 6 (3 Pages)',
    3,
    'mapped',
    '{"attachmentSlotId":"attachment-slot-09","sections":["Page 1 — Nomination, Clauses (2–6) & Nominee(s) Table","Page 2 — Statement (1–8), Witness Declaration & Employer Certificate","Page 3 — Acknowledgement by the Employee (Post-Certification)"]}'::jsonb
  )
on conflict (id) do update
set
  form_number = excluded.form_number,
  code = excluded.code,
  short_title = excluded.short_title,
  title = excluded.title,
  source_filename = excluded.source_filename,
  document_reference = excluded.document_reference,
  page_count = excluded.page_count,
  mapping_status = excluded.mapping_status,
  schema_definition = excluded.schema_definition,
  updated_at = now();
