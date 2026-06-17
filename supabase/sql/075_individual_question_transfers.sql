-- =============================================================================
-- 075_individual_question_transfers.sql
--
-- 목적: 구독 전환 시 released 개별질문을 구독 질문방으로 "이전"한 기록을 남겨
--       중복 이전을 막는 멱등 매핑 테이블. (실제 이전은 앱 service_role 로직에서)
--
-- 안전:
--   - 기존 SQL 미수정(075 새 파일). question_threads/messages/attachments·버킷 재사용.
--   - 돈/에스크로 무관(released = 종료 건만 대상).
--   - 멱등: individual_question_id PK → 이미 이전된 질문은 재이전 skip.
--
-- 실행: Supabase SQL Editor. (0) 점검 → 본문 → (검증).
-- =============================================================================

-- (0) 점검
-- select count(*) from public.individual_question_transfers;

create table if not exists public.individual_question_transfers (
  individual_question_id uuid primary key references public.individual_questions(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  mentor_id uuid not null references public.users(id) on delete cascade,
  room_id uuid references public.mentor_student_rooms(id) on delete set null,
  thread_id uuid references public.question_threads(id) on delete set null,
  transferred_at timestamptz not null default now()
);

create index if not exists idx_iqt_student_mentor
  on public.individual_question_transfers (student_id, mentor_id);

alter table public.individual_question_transfers enable row level security;

-- 본인(학생)만 조회. 쓰기는 정책 없음 → service_role 전용(2단계 UI에서 배너·링크 조회용).
drop policy if exists "iqt_select_student" on public.individual_question_transfers;
create policy "iqt_select_student"
  on public.individual_question_transfers
  for select
  to authenticated
  using (student_id = (select auth.uid()));

revoke all on table public.individual_question_transfers from public, anon;
grant select on table public.individual_question_transfers to authenticated;
grant all on table public.individual_question_transfers to service_role;

comment on table public.individual_question_transfers is
  '구독 전환 시 released 개별질문 → 구독 질문방 thread 이전 기록(멱등 키). 쓰기는 service_role.';

-- (검증)
-- select individual_question_id, room_id, thread_id, transferred_at
-- from public.individual_question_transfers order by transferred_at desc;
