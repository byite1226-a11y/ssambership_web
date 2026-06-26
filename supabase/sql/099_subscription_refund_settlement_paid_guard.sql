-- =============================================================================
-- 099_subscription_refund_settlement_paid_guard.sql
-- Purpose: Block auto-approval of a SUBSCRIPTION refund when the mentor
--          settlement for that payment is already 'paid' (prevents double loss:
--          mentor keeps payout AND student gets refunded). Mirrors the existing
--          custom-order guard in 030, which only covered custom_request_order_id.
--
-- Prerequisite:
--   - 030_p0_refund_approve_reject_admin_rpc.sql has been applied.
--   - 086_subscription_settlement_items.sql has been applied.
--   - 069_subscription_cancel_refund_request.sql has been applied
--     (refunds.subscription_id / request_type).
--
-- Scope:
--   - Replace approve_refund_request_admin(uuid, uuid, text) only.
--   - reject_refund_request_admin is NOT touched.
--   - Full 030 approve body reproduced verbatim; ONLY the new subscription guard
--     block is inserted (right after the custom-order guard, before the amount
--     check). v_settlement_status is already declared in 030 (reused).
--
-- Guard semantics (design 285):
--   - Match by payment_id (NOT subscription_id) so a multi-period subscription's
--     old paid renewal does NOT false-block a refund of a newer unpaid period.
--   - Any 'paid' settlement item on that payment -> soft refuse (ok:false),
--     no cash/ledger mutation, route admin to manual handling.
--
-- Verify after applying:
--   select proname from pg_proc where proname = 'approve_refund_request_admin';
-- Test A (must pass): settlement pending/hold -> approve -> ok:true (refund runs).
-- Test B (must block): settlement paid -> approve -> ok:false (manual), no cash change.
-- =============================================================================

create or replace function public.approve_refund_request_admin(
  p_refund_id uuid,
  p_admin_id uuid,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  r public.refunds%rowtype;
  v_amount bigint;
  v_settlement_status text;
  v_idem text := 'refund_credit:' || p_refund_id::text;
  v_ledger_id uuid;
  v_existing_delta bigint;
  v_wu int;
  v_admin_ok boolean;
begin
  if p_refund_id is null then
    return jsonb_build_object('ok', false, 'message', '환불 ID가 필요합니다.');
  end if;
  if p_admin_id is null then
    return jsonb_build_object('ok', false, 'message', '관리자 ID가 필요합니다.');
  end if;

  select exists(
    select 1 from public.users u where u.id = p_admin_id and u.role = 'admin'
  ) into v_admin_ok;
  if not coalesce(v_admin_ok, false) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  select * into r from public.refunds where id = p_refund_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', '환불 요청을 찾을 수 없습니다.');
  end if;

  if r.status is distinct from 'pending' then
    return jsonb_build_object(
      'ok', true,
      'noop', true,
      'refund_id', p_refund_id,
      'message', '이미 처리되었거나 대기 상태가 아닙니다.',
      'status', r.status
    );
  end if;

  -- 정산 지급 완료 시 자동 환불 차단 (맞춤의뢰)
  if r.custom_request_order_id is not null then
    select s.status into v_settlement_status
    from public.custom_order_settlement_items s
    where s.custom_request_order_id = r.custom_request_order_id
    limit 1;
    if found and v_settlement_status = 'paid' then
      return jsonb_build_object(
        'ok', false,
        'message', '이미 정산 지급이 완료된 건은 자동 환불할 수 없습니다. 수동 조정이 필요합니다.'
      );
    end if;
  end if;

  -- 정산 지급 완료 시 자동 환불 차단 (구독) — 099 추가
  -- payment_id 매칭: 다기간 구독의 과거 paid 갱신분이 신규 미지급 기간 환불을 오탐 차단하지 않도록.
  if r.payment_id is not null
     and (r.subscription_id is not null
          or coalesce(r.request_type, '') = 'subscription_prorated') then
    select s.status into v_settlement_status
    from public.subscription_settlement_items s
    where s.payment_id = r.payment_id
      and s.status = 'paid'
    limit 1;
    if found then
      return jsonb_build_object(
        'ok', false,
        'message', '이미 멘토 정산 지급이 완료된 구독 건은 자동 환불할 수 없습니다. 수동 조정이 필요합니다.'
      );
    end if;
  end if;

  if r.amount_cents is null or r.amount_cents <= 0 then
    raise exception '환불 금액이 설정되지 않아 자동 승인할 수 없습니다.';
  end if;

  v_amount := r.amount_cents;

  if v_amount > 1000000000 then
    return jsonb_build_object('ok', false, 'message', '환불 금액이 허용 한도를 초과합니다.');
  end if;

  -- 정산 예정만 취소 (paid 는 위에서 차단)
  if r.custom_request_order_id is not null then
    update public.custom_order_settlement_items s
    set status = 'cancelled', updated_at = now()
    where s.custom_request_order_id = r.custom_request_order_id
      and s.status in ('pending', 'on_hold', 'payable');
  end if;

  insert into public.cash_ledger (
    user_id, delta_cents, reason, ref_type, ref_id, idempotency_key
  )
  values (
    r.user_id, v_amount, 'refund_approved', 'refunds', r.id, v_idem
  )
  on conflict (idempotency_key) do nothing
  returning id into v_ledger_id;

  if v_ledger_id is null then
    select cl.delta_cents into v_existing_delta
    from public.cash_ledger cl
    where cl.idempotency_key = v_idem
    limit 1;
    if not found then
      raise exception 'REFUND_LEDGER_IDEMPOTENT_MISS' using errcode = 'P0001';
    end if;
    if v_existing_delta is distinct from v_amount then
      raise exception 'REFUND_LEDGER_AMOUNT_MISMATCH' using errcode = 'P0001';
    end if;
  end if;

  if v_ledger_id is not null then
    insert into public.cash_wallets (user_id, balance_cents)
    values (r.user_id, 0)
    on conflict (user_id) do nothing;

    update public.cash_wallets w
    set balance_cents = w.balance_cents + v_amount
    where w.user_id = r.user_id;
    get diagnostics v_wu = row_count;
    if coalesce(v_wu, 0) = 0 then
      raise exception 'CASH_WALLET_UPDATE_FAILED' using errcode = 'P0001';
    end if;
  end if;

  update public.refunds
  set
    status = 'succeeded',
    processed_at = now(),
    processed_by = p_admin_id,
    admin_note = p_admin_note,
    updated_at = now()
  where id = r.id;

  if r.payment_id is not null then
    update public.payments p
    set status = 'refunded', updated_at = now()
    where p.id = r.payment_id;
  end if;

  if r.payment_id is not null then
    update public.subscriptions s
    set status = 'canceled', updated_at = now()
    where s.payment_id = r.payment_id
      and s.status is distinct from 'canceled';
  end if;

  if r.custom_request_order_id is not null then
    update public.custom_request_orders o
    set payment_status = 'refunded', updated_at = now()
    where o.id = r.custom_request_order_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'noop', false,
    'refund_id', r.id,
    'ledger_inserted', (v_ledger_id is not null),
    'amount_cents', v_amount,
    'message', '환불이 승인되었습니다.'
  );
end;
$function$;

-- EXECUTE: service_role 만 (승인 RPC) — 030 과 동일 권한 재적용
revoke all on function public.approve_refund_request_admin(uuid, uuid, text) from public;
revoke all on function public.approve_refund_request_admin(uuid, uuid, text) from anon;
revoke all on function public.approve_refund_request_admin(uuid, uuid, text) from authenticated;
grant execute on function public.approve_refund_request_admin(uuid, uuid, text) to service_role;

comment on function public.approve_refund_request_admin(uuid, uuid, text)
  is 'P0: Admin refund approve — idempotent ledger credit, service_role only. Blocks auto-refund when custom-order OR subscription settlement (by payment_id) is already paid (099).';
