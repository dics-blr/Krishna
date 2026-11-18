-- Stage 2 Migration 0004: Security Hardening
-- Target Supabase Project: dics-employee-onboarding
-- IMPORTANT:
--   1. Do NOT edit already-applied migrations (0001-0003). Apply this migration after 0003.
--   2. Do NOT execute automatically against live database without review.
--   3. Manual Supabase Auth Dashboard requirement:
--      Disable "Allow new users to sign up" (Authentication -> Providers / Settings)
--      so public /auth/v1/signup cannot create unauthorized auth.users accounts.

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. Safe search_path on public.set_updated_at()
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 2. Invitation Token Security: Migrate from plaintext token to SHA-256 hash
--    Preserves existing active invitation links by backfilling token_hash from
--    existing token values before scrubbing plaintext tokens.
-- ============================================================================
alter table public.onboarding_invitations
  add column if not exists token_hash text,
  add column if not exists token_hint text not null default '';

-- Backfill SHA-256 hex digest and masked hint for any pre-existing rows
update public.onboarding_invitations
set
  token_hash = encode(digest(token, 'sha256'), 'hex'),
  token_hint = case
    when length(token) >= 10 then left(token, 5) || '••••' || right(token, 4)
    else '••••'
  end
where token is not null
  and (token_hash is null or token_hash = '');

-- Enforce uniqueness & non-nullability on token_hash after backfill
create unique index if not exists idx_onboarding_invitations_token_hash
  on public.onboarding_invitations (token_hash);

alter table public.onboarding_invitations
  alter column token_hash set not null;

-- Allow new invitations to omit plaintext token completely (token is returned once at creation)
alter table public.onboarding_invitations
  alter column token drop not null;

-- Scrub backfilled plaintext tokens so no raw bearer tokens remain stored at rest
update public.onboarding_invitations
set token = null
where token is not null
  and token_hash is not null;

-- ============================================================================
-- 3. Audit Log Immutability (Append-Only Enforcement at Database Layer)
-- ============================================================================
create or replace function public.prevent_onboarding_audit_log_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'public.onboarding_audit_logs is append-only; % is prohibited', tg_op;
end;
$$;

drop trigger if exists trg_onboarding_audit_logs_immutable_row on public.onboarding_audit_logs;
create trigger trg_onboarding_audit_logs_immutable_row
  before update or delete on public.onboarding_audit_logs
  for each row execute function public.prevent_onboarding_audit_log_mutation();

drop trigger if exists trg_onboarding_audit_logs_immutable_truncate on public.onboarding_audit_logs;
create trigger trg_onboarding_audit_logs_immutable_truncate
  before truncate on public.onboarding_audit_logs
  for each statement execute function public.prevent_onboarding_audit_log_mutation();

-- Prevent deleting an invitation from nulling/mutating historical audit rows
alter table public.onboarding_audit_logs
  drop constraint if exists onboarding_audit_logs_invitation_id_fkey;

alter table public.onboarding_audit_logs
  add constraint onboarding_audit_logs_invitation_id_fkey
  foreign key (invitation_id)
  references public.onboarding_invitations(id)
  on delete restrict;

-- Revoke mutation privileges on audit logs across all roles (including service_role)
-- while preserving INSERT and SELECT for legitimate backend audit logging.
revoke update, delete, truncate on public.onboarding_audit_logs
  from public, anon, authenticated, service_role;

grant select, insert on public.onboarding_audit_logs to service_role;

-- ============================================================================
-- 4. HR Office Use Policies: Replace FOR ALL with separate INSERT and UPDATE
-- ============================================================================
drop policy if exists "hr_admin_upsert_office_use" on public.hr_office_use_entries;

drop policy if exists "hr_admin_insert_office_use" on public.hr_office_use_entries;
create policy "hr_admin_insert_office_use"
  on public.hr_office_use_entries
  for insert
  to authenticated
  with check (public.is_hr_admin_manager());

drop policy if exists "hr_admin_update_office_use" on public.hr_office_use_entries;
create policy "hr_admin_update_office_use"
  on public.hr_office_use_entries
  for update
  to authenticated
  using (public.is_hr_admin_manager())
  with check (public.is_hr_admin_manager());

-- ============================================================================
-- 5. HR Admin Provisioning Lock & Explicit Table Privilege Revocations
-- ============================================================================
revoke all on public.hr_form_templates from public, anon;
revoke all on public.hr_admin_users from public, anon;
revoke all on public.onboarding_invitations from public, anon;
revoke all on public.onboarding_form_responses from public, anon;
revoke all on public.onboarding_documents from public, anon;
revoke all on public.hr_office_use_entries from public, anon;
revoke all on public.onboarding_audit_logs from public, anon;

-- Ensure authenticated users cannot insert, update, delete, or escalate hr_admin_users
revoke insert, update, delete, truncate on public.hr_admin_users
  from public, anon, authenticated;

revoke insert, update, delete, truncate on public.hr_form_templates from authenticated;
revoke delete, truncate on public.onboarding_invitations from authenticated;
revoke insert, update, delete, truncate on public.onboarding_form_responses from authenticated;
revoke insert, update, delete, truncate on public.onboarding_documents from authenticated;
revoke delete, truncate on public.hr_office_use_entries from authenticated;
revoke insert, update, delete, truncate on public.onboarding_audit_logs from authenticated;

-- ============================================================================
-- 6. Storage Permissions: Force all downloads through audited backend endpoint
-- ============================================================================
drop policy if exists "hr_admin_read_onboarding_storage" on storage.objects;
