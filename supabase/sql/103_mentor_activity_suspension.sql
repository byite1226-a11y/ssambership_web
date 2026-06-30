-- 103_mentor_activity_suspension.sql
-- P0 #5 — 멘토 활동 중단 대안(완전 종료 / 일시 중단 / 무단 이탈)
--
-- 정책 요약
--  - 완전 종료: 즉시 신규 구독 차단 + 2주 사전 공지 → 유예 종료 시 잔여 100% 환불.
--  - 일시 중단: 최대 1주. 쉰 일수만큼 구독 기간 연장. 일반휴식 6개월 1회 빈도제한, 질병 예외(관리자 확인).
--  - 무단 이탈: 정산 자동 0 처리 금지 → "정산 보류 + 무단이탈 의심"으로 관리자 큐에 올려 최종 확인(구제 가능).
--  - 떠나는 멘토의 질문방·연결노트 기록은 보존(별도 DDL 없음 — on delete 미사용).
--
-- 운영 적용 대상: 예(컬럼 추가 + 신규 테이블, 파괴적 변경 없음).

-- 1) mentor_profiles 활동 상태 컬럼
alter table public.mentor_profiles
  add column if not exists activity_status text not null default 'active',
  add column if not exists termination_requested_at timestamptz,
  add column if not exists termination_effective_at timestamptz,
  add column if not exists pause_started_at timestamptz,
  add column if not exists pause_until timestamptz,
  add column if not exists pause_reason text,
  add column if not exists last_pause_at timestamptz,
  add column if not exists abandonment_flagged_at timestamptz;

comment on column public.mentor_profiles.activity_status is 'active | terminating(2주 공지중) | terminated | paused';
comment on column public.mentor_profiles.termination_effective_at is '완전종료 유예 만료(요청+14일). 이후 잔여 환불 생성 대상';
comment on column public.mentor_profiles.pause_until is '일시중단 복귀 예정 시각(최대 +7일)';
comment on column public.mentor_profiles.last_pause_at is '마지막 일반휴식 시각(6개월 빈도 제한 판정)';
comment on column public.mentor_profiles.abandonment_flagged_at is '무단이탈 의심 플래그 시각';

-- 2) mentor_plans 비활성 플래그(중단 시 신규 노출 차단용 소프트 플래그)
alter table public.mentor_plans
  add column if not exists is_active boolean not null default true;

comment on column public.mentor_plans.is_active is '멘토 활동 중단 시 false. 신규 구독 노출/허용 게이트(가격 계산값은 보존)';

-- 3) 멘토 활동 이벤트(관리자 검토 큐 + 감사)
create table if not exists public.mentor_activity_events (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.users (id) on delete cascade,
  event_type text not null,    -- termination_requested | termination_finalized | pause_started | pause_resumed | abandonment_suspected
  reason text,
  detail jsonb,
  status text not null default 'logged',  -- logged | pending_review | approved(=정산보류 확정) | released(=구제)
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz
);

create index if not exists mentor_activity_events_mentor_idx
  on public.mentor_activity_events (mentor_id, created_at desc);
create index if not exists mentor_activity_events_review_idx
  on public.mentor_activity_events (status)
  where status = 'pending_review';

-- RLS: 관리자 콘솔은 service_role 로 접근. 일반 사용자 직접 접근 차단(정책 없음 = 잠금).
alter table public.mentor_activity_events enable row level security;
