-- 090_custom_order_fee_5pct.sql
-- 맞춤의뢰 플랫폼 수수료 20% → 5% (멘토 80% → 95%). 수수료 정책 변경 252.
--
-- 변경점(돈): accept_custom_order_deliverable_atomic 의 v_fee_rate 0.20 → 0.05.
--   · 055의 함수 본문을 그대로 두고 v_fee_rate만 0.05로 교체(create or replace).
--   · 불변식 보존: platform_fee = floor(gross*0.05), mentor_amount = gross - platform_fee (합 = gross).
--   · 멱등성·에스크로·지급(record_custom_order_escrow_payout) 로직 미변경.
-- 소급 안 함: 이미 생성된 custom_order_settlement_items 행의 fee_rate/금액은 그대로(구 20% 유지).
--   신규 정산 row만 5% 적용.
-- 컬럼 default(013: 0.20)도 5%로 맞춤(RPC는 명시 insert라 default 영향 적으나 정합 위해).
--
-- 실행: 검토 후 Supabase SQL Editor에서 전체 실행. (service_role 권한 RPC)

begin;

-- 1) settlement_items 기본 수수료율 default 0.20 → 0.05 (신규 insert 기본값 정합)
alter table public.custom_order_settlement_items
  alter column fee_rate set default 0.05;

-- 2) 수락+정산+지급 원자 RPC — v_fee_rate만 0.05로 교체(055 본문 동일)
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
  v_fee_rate numeric := 0.05;  -- 252: 맞춤의뢰 수수료 5%
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
  '252: Custom order accept + settlement(5% fee) + mentor escrow payout, one transaction. service_role only.';

revoke all on function public.accept_custom_order_deliverable_atomic(uuid, uuid, boolean) from public;
grant execute on function public.accept_custom_order_deliverable_atomic(uuid, uuid, boolean) to service_role;

commit;

-- 검증(실행 후 확인):
-- 1) 신규 주문 정산 시 fee_rate=0.05, mentor_amount=floor(gross*0.95), platform_fee=gross-mentor_amount.
-- 2) 기존 행은 fee_rate=0.20 그대로(소급 안 됨).
