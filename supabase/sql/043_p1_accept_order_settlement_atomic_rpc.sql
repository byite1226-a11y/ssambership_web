-- P1: 학생 납품 수락 + 정산 예정 insert — 단일 트랜잭션 (service_role 전용 RPC)
-- 선행: 003(custom_request_orders), 013(custom_order_settlement_items), 015(dispute trigger)
-- idempotent: CREATE OR REPLACE

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public._positive_int_from_numeric(v numeric)
returns integer
language sql
immutable
as $$
  select case when v is not null and v > 0 then floor(v)::integer else null end;
$$;

create or replace function public._order_primary_status_norm(o public.custom_request_orders)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(
    nullif(trim(o.status), ''),
    nullif(trim(o.state), ''),
    nullif(trim(o.order_status), ''),
    nullif(trim(o.stage), ''),
    ''
  )));
$$;

create or replace function public._pick_custom_order_gross_won(
  o public.custom_request_orders,
  app public.custom_request_applications
)
returns integer
language sql
stable
as $$
  select coalesce(
    public._positive_int_from_numeric(o.agreed_price),
    public._positive_int_from_numeric(o.final_price),
    public._positive_int_from_numeric(o.quote_price),
    public._positive_int_from_numeric(o.price),
    public._positive_int_from_numeric(o.paid_amount),
    public._positive_int_from_numeric(o.amount),
    public._positive_int_from_numeric(o.total),
    public._positive_int_from_numeric(o.total_amount),
    public._positive_int_from_numeric(app.proposed_price),
    public._positive_int_from_numeric(app.bid_amount),
    public._positive_int_from_numeric(app.quote_price),
    public._positive_int_from_numeric(app.price)
  );
$$;

-- ---------------------------------------------------------------------------
-- accept_custom_order_deliverable_atomic
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
  if p_require_payment and v_pay is distinct from 'paid' then
    return jsonb_build_object('ok', false, 'message', '결제가 완료되지 않은 주문은 수락할 수 없습니다.');
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

  return jsonb_build_object(
    'ok', true,
    'settlement_created', v_settlement_created,
    'settlement_id', v_settlement_id,
    'gross', v_gross,
    'fee_rate', v_fee_rate
  );
exception
  when others then
    if sqlstate = '23505' then
      -- unique settlement per order — treat as idempotent success path
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

      return jsonb_build_object(
        'ok', true,
        'settlement_created', false,
        'settlement_id', v_existing_settlement,
        'reason', 'already_exists'
      );
    end if;
    raise;
end;
$function$;

comment on function public.accept_custom_order_deliverable_atomic(uuid, uuid, boolean) is
  'P1: Student deliverable accept — order completed + settlement row in one transaction. service_role only; app validates student session then passes p_student_id.';

revoke all on function public.accept_custom_order_deliverable_atomic(uuid, uuid, boolean) from public;
grant execute on function public.accept_custom_order_deliverable_atomic(uuid, uuid, boolean) to service_role;
