-- =============================================================================
-- 073_fix_exposed_cash_debit.sql
--
-- 배경 (072 적용 후 실측):
--   record_subscription_cash_debit 가 DB에 2개 오버로드로 존재하고, 그중 한 버전이
--   anon/authenticated 에 EXECUTE 노출(can_exec=true)로 확인됨. 019/023/072 의 revoke 는
--   (uuid,uuid,uuid,bigint) 시그니처만 대상으로 해서, 다른 시그니처(예: integer 버전 —
--   소스 마이그레이션엔 없는 DB 잔존 중복)가 닫히지 않았다. 구독 캐시 차감 함수라 차단 필수.
--
-- 방침:
--   - 시그니처를 추측하지 않고, public.record_subscription_cash_debit 의 "모든 오버로드"를
--     동적으로 순회하며 revoke(public/anon/authenticated) + grant(service_role) → 멱등·견고.
--   - drop 은 하지 않음: 앱이 named-arg RPC 로 호출하므로 PostgREST 가 어느 오버로드에
--     바인딩하는지 100% 확정 전엔 위험(구독 결제 깨짐). 불확실 → revoke 만(안전).
--
-- 앱 호출 확인:
--   lib/subscribe/subscribeCheckoutService.ts → admin.rpc("record_subscription_cash_debit",
--   { p_user_id, p_subscription_id, p_payment_id, p_amount_cents }) 를 service_role 로 호출.
--   → 모든 오버로드에 service_role grant 유지하므로 결제 동작 보존.
--
-- 실행: Supabase SQL Editor (소유자/service_role). DB 실행은 사용자가 직접.
--   순서: (0) 조사 → 본 파일 → (재점검).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- (0) 조사 — 모든 오버로드의 정확한 시그니처/노출/보안속성 (읽기 전용, 먼저 실행)
-- ---------------------------------------------------------------------------
-- select p.oid::regprocedure as full_signature,
--        pg_get_function_identity_arguments(p.oid) as args,
--        has_function_privilege('anon', p.oid, 'execute') as anon_exec,
--        has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
--        p.prosecdef as security_definer
-- from pg_proc p
-- where p.pronamespace = 'public'::regnamespace
--   and p.proname = 'record_subscription_cash_debit'
-- order by 1;


-- ---------------------------------------------------------------------------
-- (A) 모든 오버로드 일괄 차단 (시그니처 무관, 멱등)
--     revoke from public, anon, authenticated  +  grant execute to service_role
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname = 'record_subscription_cash_debit'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
    raise notice 'hardened record_subscription_cash_debit -> %', r.sig;
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- (B) 알려진 정규 시그니처(앱이 의도하는 버전) 명시 재확인 — 레포 규약과 일치, 멱등
-- ---------------------------------------------------------------------------
revoke all on function public.record_subscription_cash_debit(uuid, uuid, uuid, bigint) from public, anon, authenticated;
grant execute on function public.record_subscription_cash_debit(uuid, uuid, uuid, bigint) to service_role;


-- ---------------------------------------------------------------------------
-- (C) (선택, 기본 비활성) 중복 오버로드 제거 — 매우 신중히.
--     (0) 조사로 노출된 시그니처가 정규 bigint 버전이 "아니고",
--     앱(PostgREST)이 그 버전을 호출하지 않음을 확인한 경우에만 주석 해제 실행.
--     예) integer 버전이 잔존 중복이라 확정되면:
--   -- drop function if exists public.record_subscription_cash_debit(uuid, uuid, uuid, integer);
--     ⚠️ 앱이 바인딩하는 버전을 drop 하면 구독 결제가 깨진다. 불확실하면 (A)의 revoke 로 충분.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- (재점검) 모든 오버로드가 anon/auth false 여야 함 — 본 파일 실행 후 확인
-- ---------------------------------------------------------------------------
-- select p.oid::regprocedure as full_signature,
--        has_function_privilege('anon', p.oid, 'execute') as anon_exec,
--        has_function_privilege('authenticated', p.oid, 'execute') as auth_exec
-- from pg_proc p
-- where p.pronamespace = 'public'::regnamespace
--   and p.proname = 'record_subscription_cash_debit'
-- order by 1;
