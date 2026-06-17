-- =============================================================================
-- 074_subjects_subdivision.sql
--
-- 목적: 과목 세분화 토대 — public.subjects 에 계층(parent_code) + 소분류 code 추가.
--   앱 정본 상수(lib/subjects/subjectCatalog.ts)와 code/label/parent/sort 가 정확히 일치.
--   question_threads.subject 는 subjects.code FK 이므로, 화면이 소분류 code 를 저장하기
--   "전에" 이 SQL 로 소분류 행이 먼저 존재해야 한다(FK 위반 방지).
--
-- 안전:
--   - 기존 대분류 code(korean/english/math/science/social/essay/career/etc) 유지 — 삭제/치환 없음.
--   - 기존 데이터 마이그레이션 불필요(대분류 보존, 소분류는 추가만). 멱등.
--   - social label 만 '사회·역사' → '사회' 로 update. korean_history(한국사) 신규 대분류 추가.
--   - 기존 SQL(060 등) 미수정. 074 새 파일.
--
-- 실행: Supabase SQL Editor. 순서 — (0)점검 → 본문 → (검증).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- (0) 점검 — 현재 subjects 현황 (읽기 전용)
-- ---------------------------------------------------------------------------
-- select code, label, sort_order from public.subjects order by sort_order, code;


-- ---------------------------------------------------------------------------
-- 1) 계층 컬럼 추가 (self-FK). 기존 행은 parent_code = null (대분류).
-- ---------------------------------------------------------------------------
alter table public.subjects
  add column if not exists parent_code text references public.subjects(code);

comment on column public.subjects.parent_code is
  '대분류 code(없으면 자기 자신이 대분류). subjectCatalog.ts 와 일치.';


-- ---------------------------------------------------------------------------
-- 2) 기존 대분류 label/sort 정합 (code 유지, social 라벨만 변경)
-- ---------------------------------------------------------------------------
update public.subjects set label = '사회', sort_order = 50 where code = 'social';
update public.subjects set sort_order = 10 where code = 'korean';
update public.subjects set sort_order = 20 where code = 'english';
update public.subjects set sort_order = 30 where code = 'math';
update public.subjects set sort_order = 60 where code = 'science';
update public.subjects set sort_order = 70 where code = 'essay';
update public.subjects set sort_order = 80 where code = 'career';
update public.subjects set sort_order = 99 where code = 'etc';


-- ---------------------------------------------------------------------------
-- 3) 신규 대분류: 한국사 (소분류 없음). 소분류 INSERT 전에 먼저 생성(FK).
-- ---------------------------------------------------------------------------
insert into public.subjects (code, label, sort_order, parent_code) values
  ('korean_history', '한국사', 40, null)
on conflict (code) do nothing;


-- ---------------------------------------------------------------------------
-- 4) 소분류 INSERT — parent_code 는 이미 존재하는 대분류 참조. 멱등.
-- ---------------------------------------------------------------------------
insert into public.subjects (code, label, sort_order, parent_code) values
  -- 국어
  ('korean_speech_writing', '화법과작문', 11, 'korean'),
  ('korean_language_media', '언어와매체', 12, 'korean'),
  ('korean_reading', '독서', 13, 'korean'),
  ('korean_literature', '문학', 14, 'korean'),
  -- 수학
  ('math_1', '수학Ⅰ', 31, 'math'),
  ('math_2', '수학Ⅱ', 32, 'math'),
  ('math_calculus', '미적분', 33, 'math'),
  ('math_statistics', '확률과통계', 34, 'math'),
  ('math_geometry', '기하', 35, 'math'),
  -- 사회
  ('social_life_ethics', '생활과윤리', 51, 'social'),
  ('social_ethics_thought', '윤리와사상', 52, 'social'),
  ('social_korea_geo', '한국지리', 53, 'social'),
  ('social_world_geo', '세계지리', 54, 'social'),
  ('social_east_asia_history', '동아시아사', 55, 'social'),
  ('social_world_history', '세계사', 56, 'social'),
  ('social_economics', '경제', 57, 'social'),
  ('social_politics_law', '정치와법', 58, 'social'),
  ('social_culture', '사회문화', 59, 'social'),
  -- 과학
  ('science_physics_1', '물리학Ⅰ', 61, 'science'),
  ('science_chemistry_1', '화학Ⅰ', 62, 'science'),
  ('science_biology_1', '생명과학Ⅰ', 63, 'science'),
  ('science_earth_1', '지구과학Ⅰ', 64, 'science'),
  ('science_physics_2', '물리학Ⅱ', 65, 'science'),
  ('science_chemistry_2', '화학Ⅱ', 66, 'science'),
  ('science_biology_2', '생명과학Ⅱ', 67, 'science'),
  ('science_earth_2', '지구과학Ⅱ', 68, 'science')
on conflict (code) do nothing;


-- ---------------------------------------------------------------------------
-- (검증) 대분류 → 소분류 트리 / 총 36행 기대 (대분류 9 + 소분류 27)
-- ---------------------------------------------------------------------------
-- select
--   coalesce(parent_code, code) as major,
--   code, label, sort_order, parent_code
-- from public.subjects
-- order by
--   (select s2.sort_order from public.subjects s2 where s2.code = coalesce(public.subjects.parent_code, public.subjects.code)),
--   sort_order;
-- select count(*) as total_rows from public.subjects;  -- 기대: 36
