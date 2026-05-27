-- [번호 충돌] 접두 032 — 동일 번호: 032_p0_weekly_question_usage.sql (이 파일: content_reports P1)
-- P1: 콘텐츠 신고(content_reports) — 관리자 콘솔 /admin/reports
-- 선행: 001 public.users, public.set_updated_at(), public.is_admin() 권장(003/004 등)
-- Idempotent

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- public.content_reports
-- ---------------------------------------------------------------------------
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users (id) on delete set null,
  target_type text not null,
  target_id uuid null,
  reason text null,
  description text null,
  status text not null default 'pending',
  admin_note text null,
  resolved_by uuid references public.users (id) on delete set null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_reports_status_allowed check (
    status in ('pending', 'reviewing', 'resolved', 'rejected', 'dismissed')
  ),
  constraint content_reports_target_type_nonempty check (char_length(trim(target_type)) > 0)
);

create index if not exists content_reports_status_created_idx on public.content_reports (status, created_at desc);
create index if not exists content_reports_reporter_id_idx on public.content_reports (reporter_id);
create index if not exists content_reports_target_idx on public.content_reports (target_type, target_id);

drop trigger if exists trg_content_reports_set_updated on public.content_reports;
create trigger trg_content_reports_set_updated
  before update on public.content_reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.content_reports enable row level security;

drop policy if exists "content_reports_select_admin" on public.content_reports;
create policy "content_reports_select_admin"
  on public.content_reports for select
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

drop policy if exists "content_reports_select_reporter" on public.content_reports;
create policy "content_reports_select_reporter"
  on public.content_reports for select
  to authenticated
  using (reporter_id = (select auth.uid()));

drop policy if exists "content_reports_insert_reporter" on public.content_reports;
create policy "content_reports_insert_reporter"
  on public.content_reports for insert
  to authenticated
  with check (reporter_id = (select auth.uid()));

drop policy if exists "content_reports_update_admin" on public.content_reports;
create policy "content_reports_update_admin"
  on public.content_reports for update
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

drop policy if exists "content_reports_delete_admin" on public.content_reports;
create policy "content_reports_delete_admin"
  on public.content_reports for delete
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Grants (RLS와 함께 사용; anon 직접 접근 없음)
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.content_reports to authenticated;

comment on table public.content_reports is 'P1 콘텐츠 신고. 관리자 전체 조회·처리, 일반 사용자는 본인 신고만 조회·삽입.';
