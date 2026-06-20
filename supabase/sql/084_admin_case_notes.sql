-- =============================================================================
-- 084_admin_case_notes.sql
-- 목적: 관리자 전용 분쟁·신고 운영 메모 타임라인
-- 적용: 생성만. Claude 검토 후 Supabase SQL Editor에서 수동 실행.
-- 선행: 001 auth/users/is_admin(), 004 public.disputes, 032 public.content_reports
-- 주의: 분쟁/환불/주문/정산 상태 변경 없음. 기존 RLS 정책 완화 없음.
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists public.admin_case_notes (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid null references public.disputes (id) on delete cascade,
  report_id uuid null references public.content_reports (id) on delete cascade,
  note text not null,
  admin_id uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint admin_case_notes_note_nonempty check (char_length(btrim(note)) > 0),
  constraint admin_case_notes_exactly_one_target check (num_nonnulls(dispute_id, report_id) = 1)
);

create index if not exists idx_admin_case_notes_dispute_created
  on public.admin_case_notes (dispute_id, created_at desc)
  where dispute_id is not null;

create index if not exists idx_admin_case_notes_report_created
  on public.admin_case_notes (report_id, created_at desc)
  where report_id is not null;

create index if not exists idx_admin_case_notes_admin_created
  on public.admin_case_notes (admin_id, created_at desc);

alter table public.admin_case_notes enable row level security;

drop policy if exists admin_case_notes_select_admin on public.admin_case_notes;
create policy admin_case_notes_select_admin
  on public.admin_case_notes
  for select
  to authenticated
  using ((select public.is_admin()) = true);

drop policy if exists admin_case_notes_insert_admin on public.admin_case_notes;
create policy admin_case_notes_insert_admin
  on public.admin_case_notes
  for insert
  to authenticated
  with check (
    (select public.is_admin()) = true
    and admin_id = (select auth.uid())
  );

drop policy if exists admin_case_notes_update_admin on public.admin_case_notes;
create policy admin_case_notes_update_admin
  on public.admin_case_notes
  for update
  to authenticated
  using ((select public.is_admin()) = true)
  with check ((select public.is_admin()) = true);

drop policy if exists admin_case_notes_delete_admin on public.admin_case_notes;
create policy admin_case_notes_delete_admin
  on public.admin_case_notes
  for delete
  to authenticated
  using ((select public.is_admin()) = true);

grant select, insert, update, delete on public.admin_case_notes to authenticated;

comment on table public.admin_case_notes is '관리자 전용 분쟁·신고 운영 메모 타임라인.';
comment on column public.admin_case_notes.dispute_id is '분쟁 메모 대상(public.disputes.id). report_id와 둘 중 하나만 사용.';
comment on column public.admin_case_notes.report_id is '신고 메모 대상(public.content_reports.id). dispute_id와 둘 중 하나만 사용.';
comment on column public.admin_case_notes.note is '관리자 내부 운영 메모. 공개 노출 금지.';
comment on column public.admin_case_notes.admin_id is '메모 작성 관리자 auth.users.id.';
