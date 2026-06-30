-- 102_account_status_management.sql
-- P0 #4 — 계정 상태 관리(active / suspended / banned)
--
-- 정책
--  - users.status 는 이미 존재(default 'active'). 여기서는 정지/차단 부가정보 컬럼만 추가.
--  - suspended : 일시 정지. suspended_until 이 있으면 그 시각 이후 자동 해제(앱 가드가 lazy 판정).
--  - banned    : 영구 차단(suspended_until = null).
--  - 핵심 액션 차단은 RLS 가 아니라 앱 서버 액션 가드에서 수행(테스트·복구 용이, 검증된 RLS 보존).
--  - DB check 제약은 추가하지 않음(운영 기존 데이터 보호). 허용값은 앱에서 강제.
--
-- 운영 적용 대상: 예(컬럼 추가 + 인덱스, 파괴적 변경 없음).

alter table public.users
  add column if not exists suspended_until timestamptz,
  add column if not exists status_reason text,
  add column if not exists status_changed_at timestamptz,
  add column if not exists status_changed_by uuid references public.users (id) on delete set null;

comment on column public.users.suspended_until is '정지 만료 시각(suspended 전용). null=영구/미설정. 이 시각 이후 앱 가드가 active로 간주';
comment on column public.users.status_reason is '정지/차단 사유(관리자 기록)';
comment on column public.users.status_changed_at is '상태 마지막 변경 시각';
comment on column public.users.status_changed_by is '상태를 변경한 관리자 user id';

-- 정지/차단 계정 빠른 조회용(active 가 대부분이라 부분 인덱스)
create index if not exists users_status_blocked_idx
  on public.users (status, suspended_until)
  where status <> 'active';
