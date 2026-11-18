-- Stage 2 Migration 0001: Initial DICS Global Onboarding Portal Schema
-- Target Supabase Project: dics-employee-onboarding
-- IMPORTANT: Run migrations manually in Supabase SQL Editor or via `supabase db push`.

create extension if not exists "pgcrypto";

-- Helper trigger function for automatic updated_at maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. Registry of the nine original DICS Global HR onboarding forms
create table if not exists public.hr_form_templates (
  id text primary key,
  form_number integer not null unique check (form_number between 1 and 9),
  code text not null unique,
  short_title text not null default '',
  title text not null,
  source_filename text not null default '',
  document_reference text not null default '',
  page_count integer not null default 1 check (page_count >= 1),
  mapping_status text not null default 'mapped' check (mapping_status in ('awaiting_source_document', 'mapped')),
  schema_definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_hr_form_templates_updated_at on public.hr_form_templates;
create trigger trg_hr_form_templates_updated_at
  before update on public.hr_form_templates
  for each row execute function public.set_updated_at();

-- 2. HR Admin role registry linked to Supabase Auth (auth.users)
create table if not exists public.hr_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'hr_admin' check (role in ('hr_admin', 'hr_reviewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_hr_admin_users_updated_at on public.hr_admin_users;
create trigger trg_hr_admin_users_updated_at
  before update on public.hr_admin_users
  for each row execute function public.set_updated_at();

-- 3. HR-issued onboarding invitations (token-based access without employee registration)
create table if not exists public.onboarding_invitations (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  reference_label text not null,
  department text not null,
  target_role text not null,
  status text not null default 'active' check (status in ('preview', 'active', 'expired')),
  submission_state text not null default 'not_submitted'
    check (submission_state in ('not_submitted', 'in_progress', 'submitted', 'hr_verified')),
  final_declaration_accepted boolean not null default false,
  receipt_code text,
  created_by_admin_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  hr_completed_at timestamptz
);

create index if not exists idx_onboarding_invitations_token
  on public.onboarding_invitations (token);
create index if not exists idx_onboarding_invitations_status_expires
  on public.onboarding_invitations (status, expires_at desc);

-- 4. Individual form responses linked to an invitation and one of the 9 HR forms
create table if not exists public.onboarding_form_responses (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.onboarding_invitations(id) on delete cascade,
  form_id text not null references public.hr_form_templates(id),
  payload jsonb not null default '{}'::jsonb,
  is_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (invitation_id, form_id)
);

create index if not exists idx_onboarding_form_responses_invitation
  on public.onboarding_form_responses (invitation_id);

drop trigger if exists trg_onboarding_form_responses_updated_at on public.onboarding_form_responses;
create trigger trg_onboarding_form_responses_updated_at
  before update on public.onboarding_form_responses
  for each row execute function public.set_updated_at();

-- 5. Metadata for files & signature captures stored in private Supabase Storage bucket
create table if not exists public.onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.onboarding_invitations(id) on delete cascade,
  slot_id text not null,
  slot_label text not null default '',
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  storage_bucket text not null default 'dics-onboarding-documents',
  storage_path text not null unique,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_onboarding_documents_invitation
  on public.onboarding_documents (invitation_id);

-- 6. HR / Employer-Only Office Use records (isolated from employee edits)
create table if not exists public.hr_office_use_entries (
  invitation_id uuid primary key references public.onboarding_invitations(id) on delete cascade,
  form01_selection_status text not null default '',
  form01_selected_as text not null default '',
  form01_reporting_to text not null default '',
  form01_review_date text not null default '',
  form03_emp_no text not null default '',
  form04_effective_date text not null default '',
  form04_revision_date text not null default '',
  form04_emp_no text not null default '',
  form04_post_employment_statuses jsonb not null default '{}'::jsonb,
  form04_hr_remarks text not null default '',
  form04_data_entered_by text not null default '',
  form04_data_entered_date text not null default '',
  form04_data_checked_by text not null default '',
  form04_data_checked_date text not null default '',
  form05_employer_cert_date text not null default '',
  form05_authorized_officer text not null default '',
  form06_employer_code_no text not null default '',
  form06_date_of_appointment text not null default '',
  form08_employer_uan_verified text not null default '',
  form08_member_id text not null default '',
  form08_authorized_signatory text not null default '',
  form09_employer_cert_date text not null default '',
  form09_employer_designation text not null default '',
  form09_duplicate_issued_to_employee boolean not null default false,
  updated_by_admin_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_hr_office_use_entries_updated_at on public.hr_office_use_entries;
create trigger trg_hr_office_use_entries_updated_at
  before update on public.hr_office_use_entries
  for each row execute function public.set_updated_at();

-- 7. Immutable Audit Log for invitation lifecycle, employee submissions & HR actions
create table if not exists public.onboarding_audit_logs (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references public.onboarding_invitations(id) on delete set null,
  actor_type text not null check (actor_type in ('employee', 'hr_admin', 'system')),
  actor_id text not null default '',
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_onboarding_audit_logs_invitation_created
  on public.onboarding_audit_logs (invitation_id, created_at desc);

-- 8. Private Storage Bucket Provisioning (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dics-onboarding-documents',
  'dics-onboarding-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png'];
