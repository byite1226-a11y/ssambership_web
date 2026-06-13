-- P0: 맞춤의뢰 에스크로 2단계 — 납품 수락 시 멘토 지급 + settlement paid + payment_status paid
-- 선행: 043(accept_custom_order_deliverable_atomic), 054(record_custom_order_escrow_hold)
-- idempotent: CREATE OR REPLACE
--
-- 호출: service_role 전용. authenticated/anon GRANT 금지.
-- 멱등키: cr_payout_{order_id} (주문당 정산·지급 1회, uq_cosi_one_per_order 와 정합)
-- fee_rate: accept RPC·settlement insert 시 기존 0.20 유지(변경 금지)

-- ---------------------------------------------------------------------------
-- record_custom_order_escrow_payout
-- ---------------------------------------------------------------------------
create or replace function public.record_custom_order_escrow_payout(
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
  v_idem text := 'cr_payout_' || p_order_id::text;
  v_mentor_cents bigint;
  v_hold_cents bigint;
  v_gross_cents bigint;
  v_new_ledger_id uuid;
  v_wu int;
  v_pay text;
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

  v_pay := lower(trim(coalesce(nullif(trim(o.payment_status), ''), '')));

  select * into s
  from public.custom_order_settlement_items
  where custom_request_order_id = p_order_id
  for update;

  if not found then
    raise exception 'SETTLEMENT_NOT_FOUND';
  end if;

  -- 이미 지급 완료 — 멱등 수리(주문 payment_status 만 escrowed→paid 보정)
  if s.status = 'paid' then
    if v_pay = 'escrowed' then
      update public.custom_request_orders
      set payment_status = 'paid', updated_at = v_now
      where id = p_order_id;
    end if;
    return;
  end if;

  if s.status not in ('pending', 'payable', 'on_hold') then
    raise exception 'SETTLEMENT_NOT_PAYABLE';
  end if;

  -- escrowed(정상) 또는 paid(부분 실패 수리) 만 지급. unpaid·legacy 무예치 차단.
  if v_pay not in ('escrowed', 'paid') then
    raise exception 'PAYMENT_NOT_ESCROWED';
  end if;

  -- 예치 hold 존재·금액 정합: hold cents == settlement gross(원)×100
  select abs(l.delta_cents) into v_hold_cents
  from public.cash_ledger l
  where l.idempotency_key = 'cr_hold_' || p_order_id::text
    and l.reason = 'custom_order_escrow_hold'
  limit 1;

  v_gross_cents := s.gross_amount::bigint * 100;

  if v_hold_cents is null then
    raise exception 'ESCROW_HOLD_MISSING';
  end if;

  if v_hold_cents <> v_gross_cents then
    raise exception 'ESCROW_HOLD_AMOUNT_MISMATCH';
  end if;

  -- mentor_amount: 원(integer) → cents(원×100). gross/ledger 와 동일 단위 규칙.
  v_mentor_cents := s.mentor_amount::bigint * 100;

  if v_mentor_cents is null or v_mentor_cents <= 0 then
    raise exception 'INVALID_MENTOR_AMOUNT';
  end if;

  if v_mentor_cents > 1000000000 then
    raise exception 'p_amount_too_large';
  end if;

  -- 플랫폼 수수료(gross − mentor_amount)는 별도 platform wallet ledger 없음 — hold 차감분에 implicit.

  insert into public.cash_ledger (user_id, delta_cents, reason, ref_type, ref_id, idempotency_key)
  values (
    s.mentor_id,
    v_mentor_cents,
    'custom_order_escrow_payout',
    'custom_request_orders',
    p_order_id,
    v_idem
  )
  on conflict (idempotency_key) do nothing
  returning id into v_new_ledger_id;

  if v_new_ledger_id is null then
    update public.custom_order_settlement_items
    set status = 'paid', paid_at = coalesce(paid_at, v_now), updated_at = v_now
    where id = s.id and status <> 'paid';

    update public.custom_request_orders
    set payment_status = 'paid', updated_at = v_now
    where id = p_order_id and payment_status = 'escrowed';

    return;
  end if;

  insert into public.cash_wallets (user_id, balance_cents)
  values (s.mentor_id, 0)
  on conflict (user_id) do nothing;

  update public.cash_wallets w
  set balance_cents = w.balance_cents + v_mentor_cents
  where w.user_id = s.mentor_id;
  get diagnostics v_wu = row_count;
  if coalesce(v_wu, 0) = 0 then
    raise exception 'CASH_WALLET_UPSERT_FAILED' using errcode = 'P0001';
  end if;

  update public.custom_order_settlement_items
  set status = 'paid', paid_at = v_now, updated_at = v_now
  where id = s.id;

  update public.custom_request_orders
  set payment_status = 'paid', updated_at = v_now
  where id = p_order_id;
end;
$function$;

comment on function public.record_custom_order_escrow_payout(uuid) is
  'P0: Custom order escrow payout — mentor wallet credit (mentor_amount×100 cents) + settlement paid. service_role only.';

revoke all on function public.record_custom_order_escrow_payout(uuid) from public;
revoke all on function public.record_custom_order_escrow_payout(uuid) from anon;
revoke all on function public.record_custom_order_escrow_payout(uuid) from authenticated;

grant execute on function public.record_custom_order_escrow_payout(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- accept_custom_order_deliverable_atomic — escrowed 수락 허용 + payout 연동(동일 트랜잭션)
-- ---------------------------------------------------------------------------
create or replace function public.accept_custom_order_deliverable_atomic(
  p_order_id uuid,
  p_student_id uuid,
  p_require_payment boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  o public.custom_request_orders%rowtype;
  app public.custom_request_applications%rowtype;
  v_norm text;
  v_pay text;
  v_dispute_cnt integer;
  v_deliverable_cnt integer;
  v_existing_settlement uuid;
  v_gross integer;
  v_platform_fee integer;
  v_mentor_amount integer;
  v_settlement_id uuid;
  v_settlement_created boolean := false;
  v_payout_done boolean := false;
  v_now timestamptz := now();
  v_fee_rate numeric := 0.20;
begin
  if p_order_id is null then
    return jsonb_build_object('ok', false, 'message', 'orderId가 필요합니다.');
  end if;
  if p_student_id is null then
    return jsonb_build_object('ok', false, 'message', '학생 ID가 필요합니다.');
  end if;

  select * into o
  from public.custom_request_orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'message', '주문을 찾을 수 없어요.');
  end if;

  if o.student_id is distinct from p_student_id then
    return jsonb_build_object('ok', false, 'message', '의뢰자(학생) 본인만 납품을 수락할 수 있습니다.');
  end if;

  v_pay := lower(trim(coalesce(nullif(trim(o.payment_status), ''), '')));
  -- escrowed(예치 완료) 또는 paid(멱등·수리) 만 허용. unpaid 등 레거시 무예치 차단.
  if p_require_payment and v_pay not in ('paid', 'escrowed') then
    return jsonb_build_object('ok', false, 'message', '결제(예치)가 완료되지 않은 주문은 수락할 수 없습니다.');
  end if;

  if o.completed_at is not null
     or o.closed_at is not null
     or o.finished_at is not null
     or lower(trim(coalesce(o.status, ''))) in (
       'completed','accepted','closed','finished','cancelled','canceled',
       'refunded','rejected','done','resolved','dispute_resolved'
     )
     or lower(trim(coalesce(o.state, ''))) in (
       'completed','accepted','closed','finished','cancelled','canceled',
       'refunded','rejected','done','resolved','dispute_resolved'
     )
     or lower(trim(coalesce(o.order_status, ''))) in (
       'completed','accepted','closed','finished','cancelled','canceled',
       'refunded','rejected','done','resolved','dispute_resolved'
     )
  then
    return jsonb_build_object('ok', false, 'message', '이미 완료된 주문입니다.');
  end if;

  v_norm := public._order_primary_status_norm(o);
  if v_norm = '' then
    return jsonb_build_object('ok', false, 'message', '주문 상태를 확인할 수 없어 수락할 수 없습니다.');
  end if;

  if v_norm not in (
    'delivered','delivered_pending_review','waiting_review','pending_review',
    'redelivered','delivery_submitted','in_review'
  ) then
    return jsonb_build_object(
      'ok', false,
      'message', format('현재 상태(%s)에서는 납품 수락을 할 수 없습니다.', v_norm)
    );
  end if;

  select count(*)::integer into v_dispute_cnt
  from public.disputes d
  where d.custom_request_order_id = p_order_id
    and d.status in ('open', 'under_review', 'escalated');

  if v_dispute_cnt > 0 then
    return jsonb_build_object('ok', false, 'message', '진행 중인 분쟁이 있어 납품 수락을 할 수 없습니다.');
  end if;

  select count(*)::integer into v_deliverable_cnt
  from public.custom_order_deliverables d
  where d.custom_request_order_id = p_order_id;

  if v_deliverable_cnt < 1 then
    return jsonb_build_object('ok', false, 'message', '등록된 납품이 없어 수락할 수 없습니다.');
  end if;

  select id into v_existing_settlement
  from public.custom_order_settlement_items s
  where s.custom_request_order_id = p_order_id;

  select a.* into app
  from public.custom_request_applications a
  where a.id = coalesce(o.application_id, o.custom_request_application_id, o.selected_application_id)
  limit 1;

  if v_existing_settlement is null then
    v_gross := public._pick_custom_order_gross_won(o, app);
    if v_gross is not null and v_gross > 0 then
      v_platform_fee := floor(v_gross * v_fee_rate)::integer;
      v_mentor_amount := v_gross - v_platform_fee;

      insert into public.custom_order_settlement_items (
        custom_request_order_id,
        mentor_id,
        student_id,
        gross_amount,
        platform_fee_amount,
        mentor_amount,
        fee_rate,
        status
      ) values (
        p_order_id,
        o.mentor_id,
        o.student_id,
        v_gross,
        v_platform_fee,
        v_mentor_amount,
        v_fee_rate,
        'pending'
      )
      returning id into v_settlement_id;

      v_settlement_created := true;
    end if;
  else
    v_settlement_id := v_existing_settlement;
  end if;

  update public.custom_request_orders
  set
    status = 'completed',
    state = 'completed',
    order_status = 'completed',
    accepted_at = coalesce(accepted_at, v_now),
    completed_at = coalesce(completed_at, v_now),
    updated_at = v_now
  where id = p_order_id;

  if v_settlement_id is not null then
    perform public.record_custom_order_escrow_payout(p_order_id);
    v_payout_done := true;
  end if;

  return jsonb_build_object(
    'ok', true,
    'settlement_created', v_settlement_created,
    'settlement_id', v_settlement_id,
    'gross', v_gross,
    'fee_rate', v_fee_rate,
    'payout_done', v_payout_done
  );
exception
  when others then
    if sqlstate = '23505' then
      select id into v_existing_settlement
      from public.custom_order_settlement_items s
      where s.custom_request_order_id = p_order_id;

      update public.custom_request_orders
      set
        status = 'completed',
        state = 'completed',
        order_status = 'completed',
        accepted_at = coalesce(accepted_at, v_now),
        completed_at = coalesce(completed_at, v_now),
        updated_at = v_now
      where id = p_order_id;

      if v_existing_settlement is not null then
        perform public.record_custom_order_escrow_payout(p_order_id);
        v_payout_done := true;
      end if;

      return jsonb_build_object(
        'ok', true,
        'settlement_created', false,
        'settlement_id', v_existing_settlement,
        'payout_done', v_payout_done,
        'reason', 'already_exists'
      );
    end if;
    raise;
end;
$function$;

comment on function public.accept_custom_order_deliverable_atomic(uuid, uuid, boolean) is
  'P1+P0: Student deliverable accept — order completed + settlement + mentor escrow payout in one transaction. service_role only.';

revoke all on function public.accept_custom_order_deliverable_atomic(uuid, uuid, boolean) from public;
grant execute on function public.accept_custom_order_deliverable_atomic(uuid, uuid, boolean) to service_role;
