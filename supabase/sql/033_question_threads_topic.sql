-- 질문 스레드 과목 태그 (제목과 분리)
alter table public.question_threads add column if not exists topic text;

comment on column public.question_threads.topic is '질문 과목 태그 (미적분, 확률과통계 등)';
