-- =============================================================================
-- 077_mentor_school_verification.sql
-- Purpose: A-1 mentor school/major verification storage.
-- Scope: creates only a new table, indexes, table-local trigger, and RLS policies.
-- Apply: run manually in Supabase SQL Editor after 001(users, set_updated_at)
--        and an is_admin() migration such as 003/004.
-- Notes:
--   - Does not modify mentor_profiles, public mentor RPCs, payments, escrow, or 070 RPCs.
--   - Keeps verified school/major values separate from mentor_profiles free-text fields.
-- =============================================================================

create table if not exists public.mentor_school_verifications (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'resubmit_required')
  ),
  verified_university_name text,
  verified_university_id text,
  verified_major_category text check (
    verified_major_category is null
    or verified_major_category in (
      '메디컬',
      '교육',
      '인문',
      '사회상경',
      '자연',
      '공학',
      '예체능',
      '기타'
    )
  ),
  verified_department_name text,
  school_tier text check (
    school_tier is null
    or school_tier in (
      '서연고',
      '서성한',
      '중경외시',
      '그외',
      '미분류'
    )
  ),
  document_storage_ref text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mentor_school_verifications is
  'Mentor school/major verification records. Verified values are separated from mentor_profiles free-text university_name/department_name.';
comment on column public.mentor_school_verifications.mentor_id is
  'Mentor user id. Follows existing mentor_id -> public.users(id) pattern.';
comment on column public.mentor_school_verifications.status is
  'pending / approved / rejected / resubmit_required.';
comment on column public.mentor_school_verifications.verified_university_id is
  'Normalized university key for the later B-stage classification table.';
comment on column public.mentor_school_verifications.verified_major_category is
  'Major category code for B-stage filtering/classification.';
comment on column public.mentor_school_verifications.school_tier is
  'School tier code assigned by admin/classification table.';
comment on column public.mentor_school_verifications.document_storage_ref is
  'Private Storage object reference for submitted school/major proof document.';

create index if not exists idx_mentor_school_verifications_mentor_id
  on public.mentor_school_verifications (mentor_id);

create index if not exists idx_mentor_school_verifications_status
  on public.mentor_school_verifications (status);

-- Keep updated_at current using the existing shared trigger function from 001.
drop trigger if exists trg_mentor_school_verifications_set_updated_at
  on public.mentor_school_verifications;
create trigger trg_mentor_school_verifications_set_updated_at
  before update on public.mentor_school_verifications
  for each row execute function public.set_updated_at();

-- Mentors may submit/re-submit documents, but may not self-approve or self-fill
-- admin-owned verified/review fields.
create or replace function public.mentor_school_verifications_guard_self_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce((select public.is_admin()), false) then
    return new;
  end if;

  if new.mentor_id = (select auth.uid()) then
    new.status := 'pending';
    new.verified_university_name := null;
    new.verified_university_id := null;
    new.verified_major_category := null;
    new.verified_department_name := null;
    new.school_tier := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.reject_reason := null;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_mentor_school_verifications_guard_self_review
  on public.mentor_school_verifications;
create trigger trg_mentor_school_verifications_guard_self_review
  before insert or update on public.mentor_school_verifications
  for each row execute function public.mentor_school_verifications_guard_self_review();

alter table public.mentor_school_verifications enable row level security;

-- No public/anon direct access policy.

drop policy if exists msv_select_own on public.mentor_school_verifications;
create policy msv_select_own
  on public.mentor_school_verifications
  for select
  to authenticated
  using (mentor_id = (select auth.uid()));

drop policy if exists msv_insert_own_pending on public.mentor_school_verifications;
create policy msv_insert_own_pending
  on public.mentor_school_verifications
  for insert
  to authenticated
  with check (
    mentor_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.role = 'mentor'
    )
    and verified_university_name is null
    and verified_university_id is null
    and verified_major_category is null
    and verified_department_name is null
    and school_tier is null
    and reviewed_by is null
    and reviewed_at is null
    and reject_reason is null
  );

drop policy if exists msv_update_own_pending on public.mentor_school_verifications;
create policy msv_update_own_pending
  on public.mentor_school_verifications
  for update
  to authenticated
  using (
    mentor_id = (select auth.uid())
    and status in ('pending', 'resubmit_required')
  )
  with check (
    mentor_id = (select auth.uid())
    and status = 'pending'
    and verified_university_name is null
    and verified_university_id is null
    and verified_major_category is null
    and verified_department_name is null
    and school_tier is null
    and reviewed_by is null
    and reviewed_at is null
    and reject_reason is null
  );

drop policy if exists msv_admin_select_all on public.mentor_school_verifications;
create policy msv_admin_select_all
  on public.mentor_school_verifications
  for select
  to authenticated
  using ((select public.is_admin()) = true);

drop policy if exists msv_admin_update_all on public.mentor_school_verifications;
create policy msv_admin_update_all
  on public.mentor_school_verifications
  for update
  to authenticated
  using ((select public.is_admin()) = true)
  with check ((select public.is_admin()) = true);

comment on policy msv_select_own on public.mentor_school_verifications is
  'Mentors can read only their own school verification rows.';
comment on policy msv_insert_own_pending on public.mentor_school_verifications is
  'Mentors can submit only their own pending document rows; admin-owned verified fields remain null.';
comment on policy msv_update_own_pending on public.mentor_school_verifications is
  'Mentors can update only own pending/resubmit_required rows back to pending, without self-approving.';
comment on policy msv_admin_select_all on public.mentor_school_verifications is
  'Admins can review all mentor school verification rows.';
comment on policy msv_admin_update_all on public.mentor_school_verifications is
  'Admins can approve/reject/request resubmission and fill verified values.';
