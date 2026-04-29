-- P0: 구독 체크아웃 — 캐시 원장 차감 + 지갑을 단일 DB 함수(원자적 트랜잭션)에서 처리
-- 004_p0_cash_disputes_admin_draft (cash_ledger, cash_wallets) 이후 적용 권장
--
-- 호출: service_role (서버) 전용. 클라이언트/ authenticated 에 직접 부여하지 않는다.
-- 016 스키마 파일(community)과 번호가 겹치지 않게 019로 둔다.

create or replace function public.record_subscription_cash_debit(
  p_user_id uuid,
  p_subscription_id uuid,
  p_payment_id uuid,
  p_amount_cents bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_idem text := 'sub_debit_' || p_payment_id::text;
  v_new_ledger_id uuid;
  v_wu int;
begin
  if p_user_id is null or p_subscription_id is null or p_payment_id is null then
    raise exception 'p_user_id, p_subscription_id, p_payment_id are required';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'p_amount_cents must be a positive amount';
  end if;

  -- 1) 멱등: idempotency_key 는 전역 unique. 먼저 insert 시도 → conflict 이면 이미 처리됨(지갑 재차감 없음)
  insert into public.cash_ledger (user_id, delta_cents, reason, ref_type, ref_id, idempotency_key)
  values (
    p_user_id,
    -p_amount_cents,
    'subscription_payment',
    'subscriptions',
    p_subscription_id,
    v_idem
  )
  on conflict (idempotency_key) do nothing
  returning id into v_new_ledger_id;

  if v_new_ledger_id is null then
    return;
  end if;

  -- 2) wallet 행 + 잔액 차감 (insert 성공한 트랜잭션만 아래로 진행; 실패 시 1) 롤백)
  insert into public.cash_wallets (user_id, balance_cents)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  update public.cash_wallets w
  set balance_cents = w.balance_cents - p_amount_cents
  where w.user_id = p_user_id
    and w.balance_cents >= p_amount_cents;
  get diagnostics v_wu = row_count;
  if coalesce(v_wu, 0) = 0 then
    raise exception 'CASH_INSUFFICIENT' using errcode = 'P0001';
  end if;
end;
$function$;

revoke all on function public.record_subscription_cash_debit(uuid, uuid, uuid, bigint) from public;

-- record_subscription_cash_debit 성공 뒤 결제 상태 표시(마크)가 실패할 때만: 원장+지갑을 한 번에 되돌림(append-only, 멱등)
create or replace function public.record_subscription_cash_rollback(
  p_user_id uuid,
  p_subscription_id uuid,
  p_payment_id uuid,
  p_amount_cents bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_idem text := 'sub_rollback_' || p_payment_id::text;
  v_new_ledger_id uuid;
  v_wu int;
begin
  if p_user_id is null or p_subscription_id is null or p_payment_id is null then
    raise exception 'p_user_id, p_subscription_id, p_payment_id are required';
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 then
    return;
  end if;

  insert into public.cash_ledger (user_id, delta_cents, reason, ref_type, ref_id, idempotency_key)
  values (
    p_user_id,
    p_amount_cents,
    'subscription_checkout_rollback',
    'subscriptions',
    p_subscription_id,
    v_idem
  )
  on conflict (idempotency_key) do nothing
  returning id into v_new_ledger_id;

  if v_new_ledger_id is null then
    return;
  end if;

  update public.cash_wallets w
  set balance_cents = w.balance_cents + p_amount_cents
  where w.user_id = p_user_id;
  get diagnostics v_wu = row_count;
  if coalesce(v_wu, 0) = 0 then
    insert into public.cash_wallets (user_id, balance_cents)
    values (p_user_id, p_amount_cents);
  end if;
end;
$function$;

revoke all on function public.record_subscription_cash_rollback(uuid, uuid, uuid, bigint) from public;

-- 주석: authenticated 에 grant 하지 않음. 애플리케이션에서 createServiceRoleClient (service_role JWT)로만 invoke.
