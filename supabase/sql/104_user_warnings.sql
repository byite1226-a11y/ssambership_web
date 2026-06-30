-- 104_user_warnings.sql
-- P1 ② — 사용자 경고 누적 → N회(3회) 시 자동 일시정지
--
-- 정책
--  - 관리자(또는 분쟁/신고 처리)가 경고를 발급 → user_warnings 누적.
--  - 활성 경고가 임계치(기본 3) 도달 시 앱에서 자동으로 users.status='suspended'(7일).
--  - 자동 정지 메커니즘은 PART A(102)의 계정 상태 + applyAccountStatus 재사용.
--
-- 운영 적용 대상: 예(신규 테이블 + 인덱스).

create table if not exists public.user_warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  issued_by uuid references public.users (id) on delete set null,
  reason text not null,
  severity text not null default 'normal',  -- normal | severe
  source text not null default 'admin',     -- admin | dispute | report
  is_active boolean not null default true,   -- 만료/철회 시 false
  created_at timestamptz not null default now()
);

create index if not exists user_warnings_user_idx
  on public.user_warnings (user_id, created_at desc);
create index if not exists user_warnings_active_idx
  on public.user_warnings (user_id)
  where is_active = true;

comment on table public.user_warnings is '사용자 경고 누적 로그. 활성 경고 3회 도달 시 앱이 자동 일시정지';

-- 관리자 콘솔은 service_role 로 접근. 일반 사용자 직접 접근 차단(정책 없음 = 잠금).
alter table public.user_warnings enable row level security;
