-- P2: 무료 질문권 사용 기록 (학생당 15회·멘토당 3회 — 앱에서 count)
-- 선행: 001(users)
-- idempotent

create table if not exists public.free_question_usage (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  mentor_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.free_question_usage is
  '구독 전 무료 질문권 차감. 학생 전체 15회·멘토당 3회는 서버에서 count로 강제.';

create index if not exists idx_fqu_student_created
  on public.free_question_usage (student_id, created_at desc);

create index if not exists idx_fqu_student_mentor
  on public.free_question_usage (student_id, mentor_id, created_at desc);

alter table public.free_question_usage enable row level security;

drop policy if exists "fqu_select_own" on public.free_question_usage;
create policy "fqu_select_own"
  on public.free_question_usage
  for select
  to authenticated
  using ( student_id = (select auth.uid()) );

drop policy if exists "fqu_insert_own" on public.free_question_usage;
create policy "fqu_insert_own"
  on public.free_question_usage
  for insert
  to authenticated
  with check ( student_id = (select auth.uid()) );
