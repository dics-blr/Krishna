-- DICS – Employee Onboarding Portal
-- Digital Instruments & Control Systems (DICS Global), Bengaluru, India
-- Stage 2 Supabase PostgreSQL + Private Storage Blueprint
-- NOTE: Stage 1 runs in template preview mode without live database persistence.

create extension if not exists "pgcrypto";

-- 1. Registry of the nine original DICS Global HR onboarding forms
create table if not exists public.hr_form_templates (
  id text primary key,
  form_number integer not null unique check (form_number between 1 and 9),
  code text not null unique,
  title text not null,
  mapping_status text not null default 'awaiting_source_document',
  schema_definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. HR-issued onboarding invitations (token-based access without employee registration)
create table if not exists public.onboarding_invitations (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  reference_label text not null,
  department text not null,
  target_role text not null,
  status text not null default 'active' check (status in ('preview', 'active', 'expired')),
  created_by_admin_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz
);

-- 3. Individual form responses linked to an invitation and one of the 9 HR forms
create table if not exists public.onboarding_form_responses (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.onboarding_invitations(id) on delete cascade,
  form_id text not null references public.hr_form_templates(id),
  payload jsonb not null default '{}'::jsonb,
  is_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (invitation_id, form_id)
);

-- 4. Metadata for files stored in private Supabase Storage bucket (dics-onboarding-documents)
create table if not exists public.onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.onboarding_invitations(id) on delete cascade,
  slot_id text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_bucket text not null default 'dics-onboarding-documents',
  storage_path text not null unique,
  uploaded_at timestamptz not null default now()
);

-- 5. Row Level Security (to be finalized with HR Admin role claims & token-scoped RPCs)
alter table public.hr_form_templates enable row level security;
alter table public.onboarding_invitations enable row level security;
alter table public.onboarding_form_responses enable row level security;
alter table public.onboarding_documents enable row level security;

-- Private Storage Bucket Blueprint:
-- Bucket ID: 'dics-onboarding-documents' (public = false)
-- Uploads/Downloads issued strictly via server-side signed URLs bound to validated invitation tokens
-- or authenticated HR Admin sessions.
