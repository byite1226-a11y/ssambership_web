-- 관리자 활동 로그 (백오피스 감사)
-- 선행: 001 users, is_admin()

create extension if not exists pgcrypto;

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id) on delete set null,
  action_type text not null,
  target_type text,
  target_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_action_logs_created on public.admin_action_logs (created_at desc);
create index if not exists idx_admin_action_logs_admin on public.admin_action_logs (admin_id, created_at desc);

alter table public.admin_action_logs enable row level security;

drop policy if exists admin_action_logs_select_admin on public.admin_action_logs;
create policy admin_action_logs_select_admin on public.admin_action_logs
  for select to authenticated
  using ((select public.is_admin()) = true);

drop policy if exists admin_action_logs_insert_admin on public.admin_action_logs;
create policy admin_action_logs_insert_admin on public.admin_action_logs
  for insert to authenticated
  with check ((select public.is_admin()) = true and admin_id = (select auth.uid()));
