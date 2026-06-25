-- 095_subscription_fee_15pct.sql
-- 구독 플랫폼 수수료 30% → 15% (멘토 70% → 85%). 수수료 정책 변경 254.
--
-- 변경점(돈): refresh_subscription_settlement_items 의 0.30 → 0.15 (계산 2곳 + insert fee_rate 1곳).
--   · 086의 함수 본문을 그대로 두고 율만 0.15로 교체(create or replace).
--   · 불변식 보존: platform_fee = floor(gross*0.15), mentor_amount = gross - platform_fee (합 = gross).
--   · 멱등성(idempotency_key 'sub_settlement:{billing_event_id}', on conflict do nothing)·송금 미수행 로직 미변경.
-- 소급 안 함: 이미 생성된 subscription_settlement_items 행의 fee_rate/금액은 그대로(구 30% 유지).
--   신규 정산 row만 15% 적용.
-- 컬럼 default(086: 0.30)도 0.15로 맞춤(RPC는 명시 insert라 default 영향 적으나 정합 위해).
--
-- 실행: 검토 후 Supabase SQL Editor에서 전체 실행. (service_role 전용 RPC)

begin;

-- 1) subscription_settlement_items 기본 수수료율 default 0.30 → 0.15
alter table public.subscription_settlement_items
  alter column fee_rate set default 0.15;

-- 2) 집계 RPC — 0.30 → 0.15 (086 본문 동일, 율만 변경)
create or replace function public.refresh_subscription_settlement_items(
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  item_status text,
  item_count bigint,
  gross_cents bigint,
  platform_fee_cents bigint,
  mentor_amount_cents bigint
)
language plpgsql
security definer
set search_path = public
as $function$
begin
  with source_events as (
    select
      e.id as billing_event_id,
      e.subscription_id,
      e.student_id,
      e.mentor_id,
      e.payment_id,
      e.ledger_id,
      e.event_type,
      coalesce(e.billing_at, e.processed_at, e.created_at) as billing_at,
      e.period_start,
      e.period_end,
      e.amount_cents::bigint as gross_cents,
      lower(coalesce(s.status, '')) as subscription_status,
      coalesce(s.cancel_at_period_end, false) as cancel_at_period_end,
      coalesce(rf.has_pending_refund, false) as has_pending_refund,
      coalesce(rf.has_succeeded_refund, false) as has_succeeded_refund
    from public.subscription_billing_events e
    join public.subscriptions s on s.id = e.subscription_id
    left join lateral (
      select
        bool_or(lower(coalesce(r.status, '')) = 'pending') as has_pending_refund,
        bool_or(lower(coalesce(r.status, '')) in ('succeeded', 'success', 'approved', 'paid')) as has_succeeded_refund
      from public.refunds r
      where coalesce(r.request_type, '') = 'subscription_prorated'
        and (
          r.subscription_id = e.subscription_id
          or (
            r.subscription_id is null
            and r.payment_id is not null
            and r.payment_id = e.payment_id
          )
        )
    ) rf on true
    where e.status = 'succeeded'
      and e.event_type in ('initial', 'renewal')
      and coalesce(e.amount_cents, 0) > 0
      and (p_from is null or coalesce(e.billing_at, e.processed_at, e.created_at) >= p_from)
      and (p_to is null or coalesce(e.billing_at, e.processed_at, e.created_at) < p_to)
  ), calculated as (
    select
      se.*,
      floor(se.gross_cents::numeric * 0.15)::bigint as platform_fee_cents,
      (se.gross_cents - floor(se.gross_cents::numeric * 0.15)::bigint) as mentor_amount_cents,
      case
        when se.has_succeeded_refund or se.subscription_status = 'refunded' then 'canceled'
        when se.has_pending_refund then 'hold'
        when se.subscription_status in ('cancel_scheduled', 'canceled', 'cancelled', 'expired') then 'hold'
        when se.cancel_at_period_end then 'hold'
        else 'pending'
      end as sync_status,
      case
        when se.has_succeeded_refund or se.subscription_status = 'refunded' then 'refund_succeeded'
        when se.has_pending_refund then 'refund_pending'
        when se.subscription_status in ('cancel_scheduled', 'canceled', 'cancelled', 'expired') then 'subscription_canceled_or_expired'
        when se.cancel_at_period_end then 'cancel_at_period_end'
        else null
      end as sync_hold_reason
    from source_events se
  )
  insert into public.subscription_settlement_items (
    billing_event_id,
    subscription_id,
    mentor_id,
    student_id,
    payment_id,
    ledger_id,
    event_type,
    billing_at,
    period_start,
    period_end,
    gross_cents,
    platform_fee_cents,
    mentor_amount_cents,
    fee_rate,
    status,
    hold_reason,
    idempotency_key
  )
  select
    c.billing_event_id,
    c.subscription_id,
    c.mentor_id,
    c.student_id,
    c.payment_id,
    c.ledger_id,
    c.event_type,
    c.billing_at,
    c.period_start,
    c.period_end,
    c.gross_cents,
    c.platform_fee_cents,
    c.mentor_amount_cents,
    0.15,
    c.sync_status,
    c.sync_hold_reason,
    'sub_settlement:' || c.billing_event_id::text
  from calculated c
  on conflict (billing_event_id) do nothing;

  with source_events as (
    select
      e.id as billing_event_id,
      lower(coalesce(s.status, '')) as subscription_status,
      coalesce(s.cancel_at_period_end, false) as cancel_at_period_end,
      coalesce(rf.has_pending_refund, false) as has_pending_refund,
      coalesce(rf.has_succeeded_refund, false) as has_succeeded_refund
    from public.subscription_billing_events e
    join public.subscriptions s on s.id = e.subscription_id
    left join lateral (
      select
        bool_or(lower(coalesce(r.status, '')) = 'pending') as has_pending_refund,
        bool_or(lower(coalesce(r.status, '')) in ('succeeded', 'success', 'approved', 'paid')) as has_succeeded_refund
      from public.refunds r
      where coalesce(r.request_type, '') = 'subscription_prorated'
        and (
          r.subscription_id = e.subscription_id
          or (
            r.subscription_id is null
            and r.payment_id is not null
            and r.payment_id = e.payment_id
          )
        )
    ) rf on true
    where e.status = 'succeeded'
      and e.event_type in ('initial', 'renewal')
      and coalesce(e.amount_cents, 0) > 0
      and (p_from is null or coalesce(e.billing_at, e.processed_at, e.created_at) >= p_from)
      and (p_to is null or coalesce(e.billing_at, e.processed_at, e.created_at) < p_to)
  ), calculated as (
    select
      se.billing_event_id,
      case
        when se.has_succeeded_refund or se.subscription_status = 'refunded' then 'canceled'
        when se.has_pending_refund then 'hold'
        when se.subscription_status in ('cancel_scheduled', 'canceled', 'cancelled', 'expired') then 'hold'
        when se.cancel_at_period_end then 'hold'
        else 'pending'
      end as sync_status,
      case
        when se.has_succeeded_refund or se.subscription_status = 'refunded' then 'refund_succeeded'
        when se.has_pending_refund then 'refund_pending'
        when se.subscription_status in ('cancel_scheduled', 'canceled', 'cancelled', 'expired') then 'subscription_canceled_or_expired'
        when se.cancel_at_period_end then 'cancel_at_period_end'
        else null
      end as sync_hold_reason
    from source_events se
  )
  update public.subscription_settlement_items i
  set
    status = c.sync_status,
    hold_reason = c.sync_hold_reason,
    updated_at = now()
  from calculated c
  where i.billing_event_id = c.billing_event_id
    and i.status <> 'paid'
    and (
      (c.sync_status = 'canceled' and i.status <> 'canceled')
      or (c.sync_status = 'hold' and i.status = 'pending')
    );

  return query
  select
    i.status::text as item_status,
    count(*)::bigint as item_count,
    coalesce(sum(i.gross_cents), 0)::bigint as gross_cents,
    coalesce(sum(i.platform_fee_cents), 0)::bigint as platform_fee_cents,
    coalesce(sum(i.mentor_amount_cents), 0)::bigint as mentor_amount_cents
  from public.subscription_settlement_items i
  where (p_from is null or i.billing_at >= p_from)
    and (p_to is null or i.billing_at < p_to)
  group by i.status
  order by i.status;
end;
$function$;

comment on function public.refresh_subscription_settlement_items(timestamptz, timestamptz) is
  '254: 15% fee. Service-role-only idempotent sync from succeeded subscription_billing_events to subscription_settlement_items. Does not transfer money or mutate cash_ledger.';

revoke all on function public.refresh_subscription_settlement_items(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.refresh_subscription_settlement_items(timestamptz, timestamptz) to service_role;

commit;

-- 검증(실행 후 확인):
-- 1) 신규 정산 시 fee_rate=0.15, platform_fee=floor(gross*0.15), mentor_amount=gross-platform_fee.
-- 2) 기존 행은 fee_rate=0.30 그대로(소급 안 됨).
