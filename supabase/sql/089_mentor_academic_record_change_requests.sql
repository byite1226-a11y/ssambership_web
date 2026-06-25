-- =============================================================================
-- 089_mentor_academic_record_change_requests.sql
-- Purpose: Mentor academic-record change requests (편입/졸업/전과 등으로 학교 변경).
-- Scope: creates only a new table, indexes, table-local triggers, and RLS policies.
-- Apply: run manually in Supabase SQL Editor after 001(users, set_updated_at)
--        and an is_admin() migration such as 003/004.
-- Notes:
--   - Mirrors 077_mentor_school_verification.sql structure.
--   - Does not modify mentor_profiles, public mentor RPCs, payments, escrow, or 070 RPCs.
--   - mentor_profiles.university_name 은 멘토가 직접 못 바꾸고, 관리자가 이 요청을
--     승인할 때만 approved_university_name 값으로 갱신한다(앱 서버 액션에서 처리).
-- =============================================================================

create table if not exists public.mentor_academic_record_change_requests (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'resubmit_required')
  ),
  -- 멘토가 신청 시 입력하는 자유 텍스트 (관리자 검토 참고용)
  requested_university_name text,
  change_reason text,
  document_storage_ref text,
  -- 관리자가 승인 시 확정하는 학교명 → mentor_profiles.university_name 으로 반영
  approved_university_name text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mentor_academic_record_change_requests is
  'Mentor-submitted academic record change requests. Mentor cannot self-edit mentor_profiles.university_name; admin approval applies approved_university_name.';
comment on column public.mentor_academic_record_change_requests.mentor_id is
  'Mentor user id. Follows existing mentor_id -> public.users(id) pattern.';
comment on column public.mentor_academic_record_change_requests.status is
  'pending / approved / rejected / resubmit_required.';
comment on column public.mentor_academic_record_change_requests.requested_university_name is
  'Free-text new school name claimed by the mentor (admin reference only).';
comment on column public.mentor_academic_record_change_requests.change_reason is
  'Mentor note describing the change (편입/졸업/전과 등).';
comment on column public.mentor_academic_record_change_requests.document_storage_ref is
  'Private Storage object reference for submitted academic-change proof document.';
comment on column public.mentor_academic_record_change_requests.approved_university_name is
  'University name confirmed by admin at approval time, applied to mentor_profiles.university_name.';

create index if not exists idx_mentor_acad_change_mentor_id
  on public.mentor_academic_record_change_requests (mentor_id);

create index if not exists idx_mentor_acad_change_status
  on public.mentor_academic_record_change_requests (status);

-- Keep updated_at current using the existing shared trigger function from 001.
drop trigger if exists trg_mentor_acad_change_set_updated_at
  on public.mentor_academic_record_change_requests;
create trigger trg_mentor_acad_change_set_updated_at
  before update on public.mentor_academic_record_change_requests
  for each row execute function public.set_updated_at();

-- Mentors may submit/re-submit documents, but may not self-approve or self-fill
-- admin-owned review fields.
create or replace function public.mentor_acad_change_guard_self_review()
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
    new.approved_university_name := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.reject_reason := null;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_mentor_acad_change_guard_self_review
  on public.mentor_academic_record_change_requests;
create trigger trg_mentor_acad_change_guard_self_review
  before insert or update on public.mentor_academic_record_change_requests
  for each row execute function public.mentor_acad_change_guard_self_review();

alter table public.mentor_academic_record_change_requests enable row level security;

-- No public/anon direct access policy.

drop policy if exists macc_select_own on public.mentor_academic_record_change_requests;
create policy macc_select_own
  on public.mentor_academic_record_change_requests
  for select
  to authenticated
  using (mentor_id = (select auth.uid()));

drop policy if exists macc_insert_own_pending on public.mentor_academic_record_change_requests;
create policy macc_insert_own_pending
  on public.mentor_academic_record_change_requests
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
    and approved_university_name is null
    and reviewed_by is null
    and reviewed_at is null
    and reject_reason is null
  );

drop policy if exists macc_update_own_pending on public.mentor_academic_record_change_requests;
create policy macc_update_own_pending
  on public.mentor_academic_record_change_requests
  for update
  to authenticated
  using (
    mentor_id = (select auth.uid())
    and status in ('pending', 'resubmit_required')
  )
  with check (
    mentor_id = (select auth.uid())
    and status = 'pending'
    and approved_university_name is null
    and reviewed_by is null
    and reviewed_at is null
    and reject_reason is null
  );

drop policy if exists macc_admin_select_all on public.mentor_academic_record_change_requests;
create policy macc_admin_select_all
  on public.mentor_academic_record_change_requests
  for select
  to authenticated
  using ((select public.is_admin()) = true);

drop policy if exists macc_admin_update_all on public.mentor_academic_record_change_requests;
create policy macc_admin_update_all
  on public.mentor_academic_record_change_requests
  for update
  to authenticated
  using ((select public.is_admin()) = true)
  with check ((select public.is_admin()) = true);

comment on policy macc_select_own on public.mentor_academic_record_change_requests is
  'Mentors can read only their own academic-record change requests.';
comment on policy macc_insert_own_pending on public.mentor_academic_record_change_requests is
  'Mentors can submit only their own pending requests; admin-owned fields remain null.';
comment on policy macc_update_own_pending on public.mentor_academic_record_change_requests is
  'Mentors can update only own pending/resubmit_required rows back to pending, without self-approving.';
comment on policy macc_admin_select_all on public.mentor_academic_record_change_requests is
  'Admins can review all mentor academic-record change requests.';
comment on policy macc_admin_update_all on public.mentor_academic_record_change_requests is
  'Admins can approve/reject/request resubmission.';
