-- =============================================================================
-- 035_p1_admin_audit_logs.sql
-- 목적: 관리자 통합 활동 로그(/admin/audit-logs)에서 verification_logs를 세션으로 조회
-- 적용: 저장소 전용. Supabase SQL Editor에서 수동 적용.
-- 선행: 001 public.verification_logs, 003 public.is_admin()
-- 주의: 기존 ver_logs_insert_own 유지. 자동 환불·정산·주문 변경 없음. begin/commit 없음.
-- =============================================================================

drop policy if exists ver_logs_admin_select on public.verification_logs;
create policy ver_logs_admin_select
  on public.verification_logs
  for select
  to authenticated
  using ((select public.is_admin()) = true);

comment on policy ver_logs_admin_select on public.verification_logs is '관리자 콘솔 통합 활동 로그 조회용.';
