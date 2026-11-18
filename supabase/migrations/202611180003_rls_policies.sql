-- Stage 2 Migration 0003: Non-Recursive Row Level Security & Storage Policies
-- Design:
-- 1. All employee onboarding data is strictly inaccessible via direct `anon` queries.
--    Employees access and save data ONLY through server-side token-validated API endpoints
--    using SUPABASE_SERVICE_ROLE_KEY.
-- 2. Authenticated HR Admins use non-recursive SECURITY DEFINER helpers checking `hr_admin_users`.

-- Non-recursive role-check functions (SECURITY DEFINER avoids self-referential RLS recursion)
create or replace function public.is_active_hr_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hr_admin_users h
    where h.user_id = auth.uid()
      and h.is_active = true
      and h.role in ('hr_admin', 'hr_reviewer')
  );
$$;

create or replace function public.is_hr_admin_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hr_admin_users h
    where h.user_id = auth.uid()
      and h.is_active = true
      and h.role = 'hr_admin'
  );
$$;

revoke all on function public.is_active_hr_admin() from public;
grant execute on function public.is_active_hr_admin() to authenticated;

revoke all on function public.is_hr_admin_manager() from public;
grant execute on function public.is_hr_admin_manager() to authenticated;

-- Enable RLS across all application tables
alter table public.hr_form_templates enable row level security;
alter table public.hr_admin_users enable row level security;
alter table public.onboarding_invitations enable row level security;
alter table public.onboarding_form_responses enable row level security;
alter table public.onboarding_documents enable row level security;
alter table public.hr_office_use_entries enable row level security;
alter table public.onboarding_audit_logs enable row level security;

-- Explicitly revoke default public/anon table privileges so zero anonymous direct DB reads succeed
revoke all on public.hr_admin_users from anon;
revoke all on public.onboarding_invitations from anon;
revoke all on public.onboarding_form_responses from anon;
revoke all on public.onboarding_documents from anon;
revoke all on public.hr_office_use_entries from anon;
revoke all on public.onboarding_audit_logs from anon;

-- 1. hr_form_templates: readable by active HR Admins (service_role manages templates)
drop policy if exists "hr_admin_select_form_templates" on public.hr_form_templates;
create policy "hr_admin_select_form_templates"
  on public.hr_form_templates
  for select
  to authenticated
  using (public.is_active_hr_admin());

-- 2. hr_admin_users: each authenticated HR user may read only their own profile row
drop policy if exists "hr_user_read_own_profile" on public.hr_admin_users;
create policy "hr_user_read_own_profile"
  on public.hr_admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- 3. onboarding_invitations: HR Admins only
drop policy if exists "hr_admin_select_invitations" on public.onboarding_invitations;
create policy "hr_admin_select_invitations"
  on public.onboarding_invitations
  for select
  to authenticated
  using (public.is_active_hr_admin());

drop policy if exists "hr_admin_insert_invitations" on public.onboarding_invitations;
create policy "hr_admin_insert_invitations"
  on public.onboarding_invitations
  for insert
  to authenticated
  with check (public.is_hr_admin_manager());

drop policy if exists "hr_admin_update_invitations" on public.onboarding_invitations;
create policy "hr_admin_update_invitations"
  on public.onboarding_invitations
  for update
  to authenticated
  using (public.is_hr_admin_manager())
  with check (public.is_hr_admin_manager());

-- 4. onboarding_form_responses: HR Admins read-only in direct client queries
--    (employee writes & saves go strictly through token-validated backend API)
drop policy if exists "hr_admin_select_form_responses" on public.onboarding_form_responses;
create policy "hr_admin_select_form_responses"
  on public.onboarding_form_responses
  for select
  to authenticated
  using (public.is_active_hr_admin());

-- 5. onboarding_documents: HR Admins read-only metadata access
drop policy if exists "hr_admin_select_documents" on public.onboarding_documents;
create policy "hr_admin_select_documents"
  on public.onboarding_documents
  for select
  to authenticated
  using (public.is_active_hr_admin());

-- 6. hr_office_use_entries: HR Admins read & write
drop policy if exists "hr_admin_select_office_use" on public.hr_office_use_entries;
create policy "hr_admin_select_office_use"
  on public.hr_office_use_entries
  for select
  to authenticated
  using (public.is_active_hr_admin());

drop policy if exists "hr_admin_upsert_office_use" on public.hr_office_use_entries;
create policy "hr_admin_upsert_office_use"
  on public.hr_office_use_entries
  for all
  to authenticated
  using (public.is_hr_admin_manager())
  with check (public.is_hr_admin_manager());

-- 7. onboarding_audit_logs: append-only from server service_role; readable by HR Admins
drop policy if exists "hr_admin_select_audit_logs" on public.onboarding_audit_logs;
create policy "hr_admin_select_audit_logs"
  on public.onboarding_audit_logs
  for select
  to authenticated
  using (public.is_active_hr_admin());

-- 8. Private Supabase Storage bucket RLS policies (dics-onboarding-documents)
drop policy if exists "hr_admin_read_onboarding_storage" on storage.objects;
create policy "hr_admin_read_onboarding_storage"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'dics-onboarding-documents'
    and public.is_active_hr_admin()
  );
