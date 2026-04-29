-- P0: 캐시 충전 — 원장(양수) + 지갑 증가를 한 트랜잭션에서 처리
-- 004_p0_cash_disputes_admin_draft (cash_wallets, cash_ledger) 이후 적용 권장
--
-- 호출: service_role(서버) 전용. authenticated/anon에 GRANT 하지 않는다.

create or replace function public.record_cash_topup(
  p_user_id uuid,
  p_amount_cents bigint,
  p_idempotency_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_new_ledger_id uuid;
  v_wu int;
  v_idem text;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;
  v_idem := nullif(trim(coalesce(p_idempotency_key, '')), '');
  if v_idem is null or length(v_idem) = 0 then
    raise exception 'p_idempotency_key is required';
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'p_amount_cents must be positive';
  end if;
  if p_amount_cents > 1000000000 then
    raise exception 'p_amount_too_large';
  end if;

  insert into public.cash_ledger (user_id, delta_cents, reason, ref_type, ref_id, idempotency_key)
  values (
    p_user_id,
    p_amount_cents,
    'cash_topup',
    'topup',
    null,
    v_idem
  )
  on conflict (idempotency_key) do nothing
  returning id into v_new_ledger_id;

  if v_new_ledger_id is null then
    return;
  end if;

  insert into public.cash_wallets (user_id, balance_cents)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  update public.cash_wallets w
  set balance_cents = w.balance_cents + p_amount_cents
  where w.user_id = p_user_id;
  get diagnostics v_wu = row_count;
  if coalesce(v_wu, 0) = 0 then
    raise exception 'CASH_WALLET_UPSERT_FAILED' using errcode = 'P0001';
  end if;
end;
$function$;

revoke all on function public.record_cash_topup(uuid, bigint, text) from public;

-- Supabase/앱: createServiceRoleClient() 로만 RPC 호출.
