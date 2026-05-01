-- P0: 관리자 환불 승인/거절 — 단일 트랜잭션 RPC (service_role 전용)
-- 선행: public.refunds, public.cash_wallets, public.cash_ledger, public.users(role)
--       payments, subscriptions, custom_request_orders, custom_order_settlement_items (해당 플로우 사용 시)
-- idempotent: cash_ledger.idempotency_key = 'refund_credit:' || refund_id
-- 금액: cash_ledger.delta_cents / cash_wallets.balance_cents 는 운영에서 “원” 단위와 동일한 정수를 씁니다.
--       refunds.amount_cents 가 비어 있거나 0 이하면 payments 로 자동 추정하지 않습니다(승인 차단).

-- -----------------------------------------------------------------------------
-- 1) refunds.updated_at 전용 트리거 함수 (set_updated_at 전제 없이 적용 가능)
-- -----------------------------------------------------------------------------
create or replace function public.set_refunds_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

-- -----------------------------------------------------------------------------
-- 2) refunds 컬럼 보강
-- -----------------------------------------------------------------------------
alter table public.refunds add column if not exists updated_at timestamptz not null default now();
alter table public.refunds add column if not exists processed_at timestamptz;
alter table public.refunds add column if not exists processed_by uuid references public.users (id) on delete set null;
alter table public.refunds add column if not exists admin_note text;

drop trigger if exists trg_refunds_set_updated on public.refunds;
create trigger trg_refunds_set_updated
  before update on public.refunds
  for each row execute function public.set_refunds_updated_at();

-- -----------------------------------------------------------------------------
-- 3) approve_refund_request_admin
-- -----------------------------------------------------------------------------
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

  -- 정산 지급 완료 시 자동 환불 차단
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

-- -----------------------------------------------------------------------------
-- 4) reject_refund_request_admin
-- -----------------------------------------------------------------------------
create or replace function public.reject_refund_request_admin(
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

  update public.refunds
  set
    status = 'rejected',
    processed_at = now(),
    processed_by = p_admin_id,
    admin_note = p_admin_note,
    updated_at = now()
  where id = r.id;

  return jsonb_build_object(
    'ok', true,
    'noop', false,
    'refund_id', r.id,
    'message', '환불이 거절되었습니다.'
  );
end;
$function$;

-- -----------------------------------------------------------------------------
-- 5) EXECUTE: service_role 만 (승인/거절 RPC)
-- -----------------------------------------------------------------------------
revoke all on function public.approve_refund_request_admin(uuid, uuid, text) from public;
revoke all on function public.approve_refund_request_admin(uuid, uuid, text) from anon;
revoke all on function public.approve_refund_request_admin(uuid, uuid, text) from authenticated;
grant execute on function public.approve_refund_request_admin(uuid, uuid, text) to service_role;

revoke all on function public.reject_refund_request_admin(uuid, uuid, text) from public;
revoke all on function public.reject_refund_request_admin(uuid, uuid, text) from anon;
revoke all on function public.reject_refund_request_admin(uuid, uuid, text) from authenticated;
grant execute on function public.reject_refund_request_admin(uuid, uuid, text) to service_role;

comment on function public.approve_refund_request_admin(uuid, uuid, text)
  is 'P0: Admin refund approve — idempotent ledger credit, service_role only. Caller must enforce app-level admin; RPC re-checks users.role=admin.';

comment on function public.reject_refund_request_admin(uuid, uuid, text)
  is 'P0: Admin refund reject — refunds row only, service_role only.';

comment on function public.set_refunds_updated_at()
  is 'P0: refunds.updated_at only — independent of public.set_updated_at.';
