-- [번호 충돌] 접두 034 — 동일 번호: 034_p1_admin_disputes_processing.sql (이 파일: favorites)
-- 멘토 찜하기 (학생·로그인 사용자)
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  mentor_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_mentor_unique unique (user_id, mentor_id)
);

create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_mentor_id_idx on public.favorites (mentor_id);

alter table public.favorites enable row level security;

drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own
  on public.favorites for select
  using (auth.uid() = user_id);

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own
  on public.favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own
  on public.favorites for delete
  using (auth.uid() = user_id);
