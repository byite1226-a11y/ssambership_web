-- [의존 순서] 이 파일은 042_reviews_system.sql 이후 적용할 것
-- [번호 충돌] 접두 033 — 동일 번호: 033_question_threads_topic.sql (이 파일: reviews 관리자 모더레이션)
-- =============================================================================
-- 033_p1_admin_reviews_moderation.sql
-- 목적: public.reviews 운영 조치 컬럼 + 공개 SELECT 제한(숨김·블라인드 비노출) + 관리자 전체 조회
-- 적용: 저장소 전용. Supabase SQL Editor에 수동 적용. (자동 배포 없음)
-- 선행: public.reviews, public.is_admin() (003 등), auth.users
-- 주의: 기존 rev_ins / rev_update_own 등 쓰기 정책은 변경하지 않습니다.
-- =============================================================================

-- —— 컬럼( idempotent ) ——
alter table if exists public.reviews
  add column if not exists is_hidden boolean not null default false;

alter table if exists public.reviews
  add column if not exists is_blinded boolean not null default false;

alter table if exists public.reviews
  add column if not exists moderation_state text not null default 'visible';

alter table if exists public.reviews
  add column if not exists moderated_at timestamptz;

alter table if exists public.reviews
  add column if not exists moderated_by uuid null references auth.users (id) on delete set null;

comment on column public.reviews.is_hidden is '관리자·운영: 공개 목록에서 제외.';
comment on column public.reviews.is_blinded is '관리자·운영: 블라인드(비노출).';
comment on column public.reviews.moderation_state is '운영 상태(예: visible, reviewed).';
comment on column public.reviews.moderated_at is '마지막 운영 조치 시각.';
comment on column public.reviews.moderated_by is '마지막 운영 조치자 auth.users.id.';

alter table if exists public.reviews enable row level security;

-- —— SELECT: 004 등에서 rev_select 가 using(true) 이면 숨김이 무력화되므로 제거 후 재정의 ——
drop policy if exists rev_select on public.reviews;
drop policy if exists reviews_select_public_visible on public.reviews;
drop policy if exists reviews_select_admin on public.reviews;

-- 익명·일반 로그인: 공개로 볼 수 있는 리뷰만 (컬럼은 위에서 항상 존재)
create policy reviews_select_public_visible
  on public.reviews
  for select
  to anon, authenticated
  using (
    coalesce(is_hidden, false) = false
    and coalesce(is_blinded, false) = false
  );

-- 관리자: 전체 행 조회(관리 콘솔·검수). is_admin() = public.users.role = 'admin'
create policy reviews_select_admin
  on public.reviews
  for select
  to authenticated
  using ((select public.is_admin()) = true);

-- rev_ins / rev_update_own 등 기존 정책은 그대로 둡니다.
