-- =============================================================================
-- 073b_drop_orphan_cash_debit.sql
--
-- 배경 (실측 확정):
--   public.record_subscription_cash_debit 가 DB에 2개 오버로드로 존재.
--     (1) (uuid,uuid,uuid,bigint)  args: p_user_id,p_subscription_id,p_payment_id,p_amount_cents
--         → 정규(019). 앱이 실제로 호출하는 버전. 유지.
--     (2) (uuid,uuid,uuid,integer) args: p_student_id,p_mentor_id,p_plan_id,p_amount_cents
--         → orphan(레포 소스에 없음). 073에서 권한은 닫았으나 잔존 유령 함수.
--
-- drop 안전 판정 근거 (코드 확인):
--   앱 전체 .rpc 호출부는 lib/subscribe/subscribeCheckoutService.ts 1곳뿐이며 named args
--   { p_user_id, p_subscription_id, p_payment_id, p_amount_cents } 로만 호출(=bigint 버전).
--   orphan 의 인자 이름(p_student_id/p_mentor_id/p_plan_id)을 쓰는 호출·positional 호출 없음.
--   → PostgREST 가 orphan 에 바인딩 불가 → 제거해도 구독 결제 영향 없음.
--
-- ⚠️ 가드:
--   - 정규 (uuid,uuid,uuid,bigint) 는 절대 drop 금지(구독 결제 핵심).
--   - 본 파일은 integer 시그니처(orphan)만 제거한다.
--
-- 실행: Supabase SQL Editor. DB 실행은 사용자가. 순서: (0)확인 → drop → (재점검).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- (0) drop 전 확인 — orphan 이 정말 integer + orphan 인자명인지 재확인 (읽기 전용)
--     기대: integer 행의 args 가 'p_student_id, p_mentor_id, p_plan_id, p_amount_cents'
-- ---------------------------------------------------------------------------
-- select p.oid::regprocedure as full_signature,
--        pg_get_function_identity_arguments(p.oid) as args
-- from pg_proc p
-- where p.pronamespace = 'public'::regnamespace
--   and p.proname = 'record_subscription_cash_debit'
-- order by 1;


-- ---------------------------------------------------------------------------
-- orphan 제거 — integer 시그니처만. bigint 정규 버전은 건드리지 않음.
-- ---------------------------------------------------------------------------
drop function if exists public.record_subscription_cash_debit(uuid, uuid, uuid, integer);


-- ---------------------------------------------------------------------------
-- (재점검) 정규 bigint 버전만 1개 남고, 그 버전은 anon/auth=false 여야 함
-- ---------------------------------------------------------------------------
-- select p.oid::regprocedure as full_signature,
--        pg_get_function_identity_arguments(p.oid) as args,
--        has_function_privilege('anon', p.oid, 'execute') as anon_exec,
--        has_function_privilege('authenticated', p.oid, 'execute') as auth_exec
-- from pg_proc p
-- where p.pronamespace = 'public'::regnamespace
--   and p.proname = 'record_subscription_cash_debit'
-- order by 1;
-- 기대: 행 1개 = record_subscription_cash_debit(uuid,uuid,uuid,bigint), anon/auth 모두 false.
-- ---------------------------------------------------------------------------
