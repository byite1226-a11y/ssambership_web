-- =============================================================================
-- 072_harden_linter_warnings.sql
--
-- 목적: Supabase 린터 경고 보강 (기존 SQL 미수정, 새 번호로만).
--   A. 돈/민감 RPC를 service_role 전용으로 명시적 재확인(anon/authenticated 차단).
--      - 대부분 019~070 에서 이미 닫혀 있음. 단, 아래 둘은 `revoke from public`만 되어
--        있어 anon/authenticated 명시 revoke가 빠져 있었다 → 본 파일에서 보강:
--          * process_subscription_renewal (068)
--          * accept_custom_order_deliverable_atomic (043/055)
--      - 나머지는 멱등 재확인(이미 닫혀 있어도 무해).
--   B. search_path 미설정 함수에 `set search_path = public` 고정(동작 불변, 보안 모범).
--
-- ⚠️ 안전:
--   - service_role grant 는 반드시 유지(서버가 호출). 절대 제거 금지.
--   - RLS·함수 본문·로직 변경 없음. 권한/속성만 조정.
--   - 선행 마이그레이션(~071) 적용 후 실행. 존재하지 않는 함수가 있으면 그 줄에서
--     에러가 나니, 해당 함수 미적용 환경이면 그 줄만 주석 처리하고 재실행.
--
-- 실행: Supabase SQL Editor (소유자/service_role 권한). DB 실행은 사용자가 직접.
--   권장 순서: (0) 아래 "점검 쿼리" 먼저 실행 → 본 파일 실행 → 재점검.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- (0) 점검 쿼리 — 먼저 실행해 실제 노출 여부 확인 (읽기 전용)
--     anon/authenticated 에 can_exec=true 인 돈 RPC가 있으면 진짜 노출 → (A)가 닫음.
--     전부 false 면 린터 오탐(이미 닫힘) — (A)는 멱등 재확인.
-- ---------------------------------------------------------------------------
-- select p.proname, r.rolname,
--        has_function_privilege(r.rolname, p.oid, 'execute') as can_exec
-- from pg_proc p
-- cross join (select 'anon' as rolname union all select 'authenticated') r
-- where p.pronamespace = 'public'::regnamespace
--   and p.proname in (
--     'record_subscription_cash_debit','record_subscription_cash_rollback',
--     'record_cash_topup','process_subscription_renewal',
--     'accept_custom_order_deliverable_atomic',
--     'record_custom_order_escrow_hold','record_custom_order_escrow_payout',
--     'record_custom_order_escrow_refund','record_custom_order_dispute_split',
--     'approve_refund_request_admin','reject_refund_request_admin',
--     'create_individual_question_with_hold','claim_individual_question',
--     'release_individual_question_payout','refund_individual_question_hold'
--   )
-- order by 1, 2;


-- ---------------------------------------------------------------------------
-- (A) 돈/민감 RPC — service_role 전용 명시적 재확인 (idempotent)
--     revoke from public, anon, authenticated  +  grant execute to service_role
-- ---------------------------------------------------------------------------

-- 구독 캐시 차감/롤백 (019/022/023)
revoke all on function public.record_subscription_cash_debit(uuid, uuid, uuid, bigint) from public, anon, authenticated;
grant execute on function public.record_subscription_cash_debit(uuid, uuid, uuid, bigint) to service_role;

revoke all on function public.record_subscription_cash_rollback(uuid, uuid, uuid, bigint) from public, anon, authenticated;
grant execute on function public.record_subscription_cash_rollback(uuid, uuid, uuid, bigint) to service_role;

-- 캐시 충전 (020/024)
revoke all on function public.record_cash_topup(uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.record_cash_topup(uuid, bigint, text) to service_role;

-- 구독 갱신 배치 RPC (068) — 기존에 anon/authenticated 명시 revoke 누락분 보강
revoke all on function public.process_subscription_renewal(uuid, timestamptz, bigint, text, timestamptz) from public, anon, authenticated;
grant execute on function public.process_subscription_renewal(uuid, timestamptz, bigint, text, timestamptz) to service_role;

-- 맞춤의뢰 정산 수락(원자) (043/055) — 기존에 anon/authenticated 명시 revoke 누락분 보강
revoke all on function public.accept_custom_order_deliverable_atomic(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.accept_custom_order_deliverable_atomic(uuid, uuid, boolean) to service_role;

-- 맞춤의뢰 에스크로 hold/payout/refund (054/055/056)
revoke all on function public.record_custom_order_escrow_hold(uuid, uuid, bigint) from public, anon, authenticated;
grant execute on function public.record_custom_order_escrow_hold(uuid, uuid, bigint) to service_role;

revoke all on function public.record_custom_order_escrow_payout(uuid) from public, anon, authenticated;
grant execute on function public.record_custom_order_escrow_payout(uuid) to service_role;

revoke all on function public.record_custom_order_escrow_refund(uuid) from public, anon, authenticated;
grant execute on function public.record_custom_order_escrow_refund(uuid) to service_role;

-- 맞춤의뢰 분쟁 분할 (057)
revoke all on function public.record_custom_order_dispute_split(uuid, integer, integer, uuid) from public, anon, authenticated;
grant execute on function public.record_custom_order_dispute_split(uuid, integer, integer, uuid) to service_role;

-- 환불 승인/거절 관리자 RPC (030)
revoke all on function public.approve_refund_request_admin(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.approve_refund_request_admin(uuid, uuid, text) to service_role;

revoke all on function public.reject_refund_request_admin(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.reject_refund_request_admin(uuid, uuid, text) to service_role;

-- 개별질문 에스크로 (070)
revoke all on function public.create_individual_question_with_hold(uuid, text, uuid, text, text, text, text, int, text) from public, anon, authenticated;
grant execute on function public.create_individual_question_with_hold(uuid, text, uuid, text, text, text, text, int, text) to service_role;

revoke all on function public.claim_individual_question(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_individual_question(uuid, uuid) to service_role;

revoke all on function public.release_individual_question_payout(uuid) from public, anon, authenticated;
grant execute on function public.release_individual_question_payout(uuid) to service_role;

revoke all on function public.refund_individual_question_hold(uuid) from public, anon, authenticated;
grant execute on function public.refund_individual_question_hold(uuid) to service_role;


-- ---------------------------------------------------------------------------
-- (B) search_path 고정 — `set search_path = public` (동작 불변, 함수 본문 미수정)
--     린터가 지목한, search_path 미설정 함수만. 이미 설정된 함수
--     (accept_custom_order_deliverable_atomic, record_subscription_cash_debit 등)는 제외.
-- ---------------------------------------------------------------------------

-- 트리거/유틸 함수 (인자 없음)
alter function public.set_updated_at() set search_path = public;
alter function public.cra_backfill_post_fk() set search_path = public;
alter function public.cro_backfill_fks() set search_path = public;
alter function public.set_admin_content_updated_at() set search_path = public;

-- 맞춤의뢰 정산 보조 함수 (043)
alter function public._positive_int_from_numeric(numeric) set search_path = public;
alter function public._order_primary_status_norm(public.custom_request_orders) set search_path = public;
alter function public._pick_custom_order_gross_won(public.custom_request_orders, public.custom_request_applications) set search_path = public;

-- 구독 cap 가중치 (050)
alter function public.subscription_cap_weight(text) set search_path = public;


-- ---------------------------------------------------------------------------
-- (C) 의도적으로 두는 것 (변경하지 않음)
--   - mentor_directory_list 등 공개 조회 RPC: anon/authenticated 공개가 의도된 설계.
--     (birth_date 등 민감 컬럼 노출 점검은 별도 백로그.)
--   - view-count/increment, is_admin/is_mentor 헬퍼: 공개여도 데이터 변경은 RLS로 보호 → 무해.
--
-- (D) SQL 아님 — 대시보드에서:
--   Authentication > Policies(또는 Auth 설정) > "Leaked Password Protection" 토글 ON.
-- ---------------------------------------------------------------------------
