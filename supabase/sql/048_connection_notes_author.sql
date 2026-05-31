-- STEP 2: 연결노트 작성자 식별 컬럼 추가
-- 문제: connection_notes 에 작성자 컬럼이 없어 UI가 작성자(학생/멘토)를 구분하지 못하고
--       항상 "학생"으로 표시되던 버그. author_id / author_role 를 추가해 본인/상대를 구분한다.
-- 선행: 002_p0_subscriptions_questions_draft.sql (connection_notes 정의)
-- idempotent

alter table public.connection_notes
  add column if not exists author_id uuid references public.users (id) on delete set null;

alter table public.connection_notes
  add column if not exists author_role text;

create index if not exists idx_cn_author
  on public.connection_notes (mentor_student_room_id, author_id);

-- =============================================================================
-- 검증 (SQL Editor)
-- select column_name, data_type from information_schema.columns
--   where table_schema = 'public' and table_name = 'connection_notes' order by ordinal_position;
-- =============================================================================
