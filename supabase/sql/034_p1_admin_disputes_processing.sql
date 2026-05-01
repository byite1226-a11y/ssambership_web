-- =============================================================================
-- 034_p1_admin_disputes_processing.sql
-- 목적: 관리자 분쟁 처리(운영 메모, 해결 시각·처리자) 보조 컬럼을 idempotent 하게 추가
-- 적용: 저장소 전용. Supabase 에는 수동 적용하지 않음.
-- 선행: 004 public.disputes, 003 public.is_admin(), auth.users
-- 주의: 환불·정산·주문 상태 자동 변경은 포함하지 않습니다. 기존 RLS 정책 무리한 DROP 금지.
-- =============================================================================

alter table if exists public.disputes
  add column if not exists admin_note text;

alter table if exists public.disputes
  add column if not exists resolved_at timestamptz;

alter table if exists public.disputes
  add column if not exists resolved_by uuid null references auth.users (id) on delete set null;

comment on column public.disputes.admin_note is '관리자 운영 메모(내부).';
comment on column public.disputes.resolved_at is '해결·종결 처리 시각(선택).';
comment on column public.disputes.resolved_by is '해결·종결 처리자 auth.users.id(선택).';

-- 004 dispute_update_admin 정책이 있으면 admin 이 이미 update 가능. 별도 정책 추가 없이 컬럼만 확장합니다.
