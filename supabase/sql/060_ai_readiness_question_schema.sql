-- =============================================================================
-- 060_ai_readiness_question_schema.sql
-- 목적: 질문방 AI 분석 대비 스키마 + 답변 합의/첨부 메타 기반
-- 적용: Supabase SQL Editor 수동 적용
-- =============================================================================

-- 1) 과목 표준 축
create table if not exists public.subjects (
  code text primary key,
  label text not null,
  sort_order int not null default 0
);

insert into public.subjects (code, label, sort_order) values
  ('korean','국어',1),
  ('english','영어',2),
  ('math','수학',3),
  ('science','과학',4),
  ('social','사회·역사',5),
  ('essay','논술·글쓰기',6),
  ('career','진로·입시',7),
  ('etc','기타',99)
on conflict (code) do nothing;

alter table public.subjects enable row level security;

drop policy if exists subjects_select_all on public.subjects;
create policy subjects_select_all on public.subjects
  for select
  to anon, authenticated
  using (true);

grant select on public.subjects to anon, authenticated;

alter table public.question_threads
  add column if not exists subject text references public.subjects(code);

comment on column public.question_threads.subject is
  '표준 과목 코드(public.subjects.code). 자유 단원/개념 메모는 기존 topic 컬럼을 사용한다.';

-- 2) 오답/숙련도 표시
alter table public.question_threads
  add column if not exists is_wrong_answer boolean not null default false,
  add column if not exists mastery_status text default 'unknown';

alter table public.question_threads
  drop constraint if exists question_threads_mastery_status_check;

alter table public.question_threads
  add constraint question_threads_mastery_status_check
  check (mastery_status in ('unknown','wrong','review','mastered'));

comment on column public.question_threads.is_wrong_answer is
  '학생이 틀렸던 문제인지 여부. 학생 본인만 UI에서 토글한다.';

comment on column public.question_threads.mastery_status is
  'AI/복습 분석용 숙련도 상태: unknown/wrong/review/mastered.';

-- 3) 답변 합의 타임스탬프
alter table public.question_threads
  add column if not exists first_answered_at timestamptz,
  add column if not exists confirmed_at timestamptz;

comment on column public.question_threads.first_answered_at is
  '멘토가 최초로 답변 완료 처리한 시각. 평균 응답시간 계산 기준.';

comment on column public.question_threads.confirmed_at is
  '학생이 답변 확인 완료 처리한 시각.';

-- 4) AI 초안 자리
create table if not exists public.ai_drafts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.question_threads(id) on delete set null,
  mentor_id uuid references public.users(id),
  draft_body text not null,
  final_body text,
  model text,
  prompt_tokens int,
  completion_tokens int,
  created_at timestamptz not null default now()
);

alter table public.ai_drafts enable row level security;

drop policy if exists ai_drafts_select_own on public.ai_drafts;
create policy ai_drafts_select_own on public.ai_drafts
  for select
  to authenticated
  using (mentor_id = (select auth.uid()));

drop policy if exists ai_drafts_insert_own on public.ai_drafts;
create policy ai_drafts_insert_own on public.ai_drafts
  for insert
  to authenticated
  with check (mentor_id = (select auth.uid()));

grant select, insert on public.ai_drafts to authenticated;

-- 5) 멘토 답변 스타일
alter table public.mentor_profiles
  add column if not exists answer_style text;

comment on column public.mentor_profiles.answer_style is
  '멘토 답변 스타일 메모. 향후 AI 초안/프로필 개인화에 사용.';

-- 6) 질문 첨부 메타. 기존 메시지 본문 마커 방식은 유지하고 신규 업로드부터 병행 기록한다.
create table if not exists public.question_attachments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.question_threads(id) on delete cascade,
  message_id uuid references public.question_messages(id) on delete set null,
  storage_path text not null,
  file_name text,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_question_attachments_thread_created
  on public.question_attachments (thread_id, created_at desc);

create index if not exists idx_question_attachments_message
  on public.question_attachments (message_id);

alter table public.question_attachments enable row level security;

drop policy if exists question_attachments_select_via_room on public.question_attachments;
create policy question_attachments_select_via_room on public.question_attachments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.question_threads qt
      join public.mentor_student_rooms r on r.id = qt.mentor_student_room_id
      where qt.id = question_attachments.thread_id
        and (
          r.student_id = (select auth.uid())
          or r.mentor_id = (select auth.uid())
          or exists (
            select 1 from public.users u
            where u.id = (select auth.uid()) and u.role = 'admin'
          )
        )
    )
  );

drop policy if exists question_attachments_insert_via_room on public.question_attachments;
create policy question_attachments_insert_via_room on public.question_attachments
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.question_threads qt
      join public.mentor_student_rooms r on r.id = qt.mentor_student_room_id
      where qt.id = question_attachments.thread_id
        and (
          r.student_id = (select auth.uid())
          or r.mentor_id = (select auth.uid())
        )
    )
    and (
      message_id is null
      or exists (
        select 1
        from public.question_messages qm
        where qm.id = question_attachments.message_id
          and qm.thread_id = question_attachments.thread_id
      )
    )
  );

grant select, insert on public.question_attachments to authenticated;

comment on table public.question_attachments is
  '질문방 첨부 메타. private storage 경로와 메시지 연결을 보존해 AI/운영 분석에서 본문 마커 의존을 줄인다.';
