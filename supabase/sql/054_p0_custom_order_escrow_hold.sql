-- P0: 맞춤의뢰 예치(에스크로 hold) — 학생 캐시 차감 + cash_ledger append-only
-- 선행: 004_p0_cash_disputes_admin_draft.sql (cash_wallets, cash_ledger)
--        003_p0_custom_request_draft.sql (custom_request_orders)
-- idempotent: CREATE OR REPLACE
--
-- 호출: service_role (서버) 전용. authenticated/anon GRANT 금지.
-- idempotency_key: 'cr_hold_' || p_order_id
-- reason: custom_order_escrow_hold | ref_type: custom_request_orders

create or replace function public.record_custom_order_escrow_hold(
  p_student_id uuid,
  p_order_id uuid,
  p_amount_cents bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_idem text := 'cr_hold_' || p_order_id::text;
  v_new_ledger_id uuid;
  v_wu int;
begin
  if p_student_id is null or p_order_id is null then
    raise exception 'p_student_id and p_order_id are required';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'p_amount_cents must be a positive amount';
  end if;

  if p_amount_cents > 1000000000 then
    raise exception 'p_amount_too_large';
  end if;

  insert into public.cash_ledger (user_id, delta_cents, reason, ref_type, ref_id, idempotency_key)
  values (
    p_student_id,
    -p_amount_cents,
    'custom_order_escrow_hold',
    'custom_request_orders',
    p_order_id,
    v_idem
  )
  on conflict (idempotency_key) do nothing
  returning id into v_new_ledger_id;

  if v_new_ledger_id is null then
    return;
  end if;

  insert into public.cash_wallets (user_id, balance_cents)
  values (p_student_id, 0)
  on conflict (user_id) do nothing;

  update public.cash_wallets w
  set balance_cents = w.balance_cents - p_amount_cents
  where w.user_id = p_student_id
    and w.balance_cents >= p_amount_cents;
  get diagnostics v_wu = row_count;
  if coalesce(v_wu, 0) = 0 then
    raise exception 'CASH_INSUFFICIENT' using errcode = 'P0001';
  end if;
end;
$function$;

comment on function public.record_custom_order_escrow_hold(uuid, uuid, bigint) is
  'P0: Custom order escrow hold — student wallet debit + ledger (append-only). service_role only.';

revoke all on function public.record_custom_order_escrow_hold(uuid, uuid, bigint) from public;
revoke all on function public.record_custom_order_escrow_hold(uuid, uuid, bigint) from anon;
revoke all on function public.record_custom_order_escrow_hold(uuid, uuid, bigint) from authenticated;

grant execute on function public.record_custom_order_escrow_hold(uuid, uuid, bigint) to service_role;
