-- P0: 맞춤의뢰 에스크로 3단계 — 예치 전액 학생 반환(취소·환불) + 관리자 환불 연동
-- 선행: 054(record_custom_order_escrow_hold), 055(record_custom_order_escrow_payout), 030(approve_refund_request_admin)
-- idempotent: CREATE OR REPLACE
--
-- 호출: service_role 전용. authenticated/anon GRANT 금지.
-- 멱등키: cr_refund_{order_id}
-- reason: custom_order_escrow_refund

-- ---------------------------------------------------------------------------
-- record_custom_order_escrow_refund
-- ---------------------------------------------------------------------------
create or replace function public.record_custom_order_escrow_refund(
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  o public.custom_request_orders%rowtype;
  s public.custom_order_settlement_items%rowtype;
  v_hold_idem text := 'cr_hold_' || p_order_id::text;
  v_payout_idem text := 'cr_payout_' || p_order_id::text;
  v_refund_idem text := 'cr_refund_' || p_order_id::text;
  v_hold_cents bigint;
  v_pay text;
  v_norm text;
  v_new_ledger_id uuid;
  v_wu int;
  v_now timestamptz := now();
begin
  if p_order_id is null then
    raise exception 'p_order_id is required';
  end if;

  select * into o
  from public.custom_request_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if o.student_id is null then
    raise exception 'STUDENT_NOT_FOUND';
  end if;

  v_pay := lower(trim(coalesce(nullif(trim(o.payment_status), ''), '')));
  v_norm := public._order_primary_status_norm(o);

  -- 멘토 지급 완료 차단: payout ledger 또는 settlement paid
  if exists (
    select 1 from public.cash_ledger l
    where l.idempotency_key = v_payout_idem
      and l.reason = 'custom_order_escrow_payout'
  ) then
    raise exception 'ALREADY_PAID_OUT';
  end if;

  select * into s
  from public.custom_order_settlement_items
  where custom_request_order_id = p_order_id
  for update;

  if found and s.status = 'paid' then
    raise exception 'ALREADY_PAID_OUT';
  end if;

  -- 멱등: 이미 환불 ledger 있으면 상태만 수리 후 종료
  if exists (
    select 1 from public.cash_ledger l
    where l.idempotency_key = v_refund_idem
      and l.reason = 'custom_order_escrow_refund'
  ) then
    if v_pay = 'escrowed' then
      update public.custom_request_orders
      set payment_status = 'refunded', updated_at = v_now
      where id = p_order_id;
    end if;

    update public.custom_order_settlement_items
    set status = 'cancelled', updated_at = v_now
    where custom_request_order_id = p_order_id
      and status in ('pending', 'on_hold', 'payable');

    if v_norm not in ('cancelled', 'canceled', 'refunded') then
      update public.custom_request_orders
      set
        status = 'cancelled',
        state = 'cancelled',
        order_status = 'cancelled',
        updated_at = v_now
      where id = p_order_id;
    end if;

    return;
  end if;

  -- hold 필수
  select abs(l.delta_cents) into v_hold_cents
  from public.cash_ledger l
  where l.idempotency_key = v_hold_idem
    and l.reason = 'custom_order_escrow_hold'
  limit 1;

  if v_hold_cents is null then
    raise exception 'ESCROW_HOLD_MISSING';
  end if;

  if v_hold_cents <= 0 or v_hold_cents > 1000000000 then
    raise exception 'ESCROW_HOLD_AMOUNT_INVALID';
  end if;

  -- 환불 대상: escrowed(정상) 또는 refunded(부분 실패 수리)
  if v_pay not in ('escrowed', 'refunded') then
    raise exception 'PAYMENT_NOT_ESCROWED';
  end if;

  insert into public.cash_ledger (user_id, delta_cents, reason, ref_type, ref_id, idempotency_key)
  values (
    o.student_id,
    v_hold_cents,
    'custom_order_escrow_refund',
    'custom_request_orders',
    p_order_id,
    v_refund_idem
  )
  on conflict (idempotency_key) do nothing
  returning id into v_new_ledger_id;

  if v_new_ledger_id is null then
    return;
  end if;

  insert into public.cash_wallets (user_id, balance_cents)
  values (o.student_id, 0)
  on conflict (user_id) do nothing;

  update public.cash_wallets w
  set balance_cents = w.balance_cents + v_hold_cents
  where w.user_id = o.student_id;
  get diagnostics v_wu = row_count;
  if coalesce(v_wu, 0) = 0 then
    raise exception 'CASH_WALLET_UPDATE_FAILED' using errcode = 'P0001';
  end if;

  update public.custom_order_settlement_items
  set status = 'cancelled', updated_at = v_now
  where custom_request_order_id = p_order_id
    and status in ('pending', 'on_hold', 'payable');

  update public.custom_request_orders
  set
    payment_status = 'refunded',
    status = 'cancelled',
    state = 'cancelled',
    order_status = 'cancelled',
    updated_at = v_now
  where id = p_order_id;
end;
$function$;

comment on function public.record_custom_order_escrow_refund(uuid) is
  'P0: Custom order escrow refund — return hold to student wallet (append-only). Blocks paid-out orders. service_role only.';

revoke all on function public.record_custom_order_escrow_refund(uuid) from public;
revoke all on function public.record_custom_order_escrow_refund(uuid) from anon;
revoke all on function public.record_custom_order_escrow_refund(uuid) from authenticated;

grant execute on function public.record_custom_order_escrow_refund(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- approve_refund_request_admin — 맞춤의뢰 예치 주문은 escrow refund 경로(이중 credit 방지)
-- ---------------------------------------------------------------------------
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
  v_hold_cents bigint;
  v_escrow_refund boolean := false;
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

    if exists (
      select 1 from public.cash_ledger l
      where l.idempotency_key = 'cr_payout_' || r.custom_request_order_id::text
        and l.reason = 'custom_order_escrow_payout'
    ) then
      return jsonb_build_object(
        'ok', false,
        'message', '이미 정산 지급이 완료된 건은 자동 환불할 수 없습니다. 수동 조정이 필요합니다.'
      );
    end if;

    select abs(l.delta_cents) into v_hold_cents
    from public.cash_ledger l
    where l.idempotency_key = 'cr_hold_' || r.custom_request_order_id::text
      and l.reason = 'custom_order_escrow_hold'
    limit 1;

    if v_hold_cents is not null then
      v_escrow_refund := true;
      begin
        perform public.record_custom_order_escrow_refund(r.custom_request_order_id);
      exception
        when others then
          if sqlerrm like '%ALREADY_PAID_OUT%' or sqlerrm like '%ESCROW_HOLD_MISSING%' then
            return jsonb_build_object('ok', false, 'message', '이미 정산 지급이 완료된 건은 자동 환불할 수 없습니다. 수동 조정이 필요합니다.');
          end if;
          if sqlerrm like '%PAYMENT_NOT_ESCROWED%' then
            return jsonb_build_object('ok', false, 'message', '예치(에스크로) 상태가 아니어서 예치 반환을 할 수 없습니다.');
          end if;
          raise;
      end;
      v_amount := v_hold_cents;
    end if;
  end if;

  if not v_escrow_refund then
    if r.amount_cents is null or r.amount_cents <= 0 then
      raise exception '환불 금액이 설정되지 않아 자동 승인할 수 없습니다.';
    end if;

    v_amount := r.amount_cents;

    if v_amount > 1000000000 then
      return jsonb_build_object('ok', false, 'message', '환불 금액이 허용 한도를 초과합니다.');
    end if;

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

    if r.custom_request_order_id is not null then
      update public.custom_request_orders o
      set payment_status = 'refunded', updated_at = now()
      where o.id = r.custom_request_order_id;
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

  return jsonb_build_object(
    'ok', true,
    'noop', false,
    'refund_id', r.id,
    'ledger_inserted', case when v_escrow_refund then true else (v_ledger_id is not null) end,
    'escrow_refund', v_escrow_refund,
    'amount_cents', v_amount,
    'message', '환불이 승인되었습니다.'
  );
end;
$function$;

comment on function public.approve_refund_request_admin(uuid, uuid, text) is
  'P0: Admin refund approve — custom order escrow uses record_custom_order_escrow_refund (no refund_credit double pay). service_role only.';

revoke all on function public.approve_refund_request_admin(uuid, uuid, text) from public;
revoke all on function public.approve_refund_request_admin(uuid, uuid, text) from anon;
revoke all on function public.approve_refund_request_admin(uuid, uuid, text) from authenticated;
grant execute on function public.approve_refund_request_admin(uuid, uuid, text) to service_role;
