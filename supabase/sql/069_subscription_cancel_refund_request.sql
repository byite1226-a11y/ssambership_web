-- 069_subscription_cancel_refund_request.sql
-- P4: subscription cancel-at-period-end + prorated refund request metadata.
--
-- Execution order:
--   1) Run this whole file in Supabase SQL Editor.
--   2) Run the verification SELECTs below.
--   3) If unexpected duplicate pending subscription refunds appear, resolve them manually.
--
-- VERIFY 1: pending subscription refund rows after metadata exists
-- select subscription_id, count(*)
-- from public.refunds
-- where subscription_id is not null and status = 'pending'
-- group by subscription_id
-- having count(*) > 1;
--
-- VERIFY 2: subscription refunds that would sync status when approved
-- select r.id, r.subscription_id, r.payment_id, r.status, r.amount_cents
-- from public.refunds r
-- where coalesce(r.request_type, '') = 'subscription_prorated'
-- order by r.created_at desc
-- limit 20;

begin;

alter table public.refunds
  add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null,
  add column if not exists request_type text,
  add column if not exists reason text;

create index if not exists idx_refunds_subscription_status
  on public.refunds (subscription_id, status, created_at desc)
  where subscription_id is not null;

create index if not exists idx_refunds_subscription_prorated_pending
  on public.refunds (subscription_id, created_at desc)
  where subscription_id is not null
    and status = 'pending'
    and request_type = 'subscription_prorated';

create or replace function public.sync_subscription_refunded_from_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.status = 'succeeded'
     and coalesce(new.request_type, '') = 'subscription_prorated'
     and new.subscription_id is not null then
    update public.subscriptions s
    set
      status = 'refunded',
      cancel_at_period_end = false,
      canceled_at = coalesce(s.canceled_at, now()),
      expired_at = coalesce(s.expired_at, now()),
      next_billing_at = null,
      updated_at = now()
    where s.id = new.subscription_id;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_refunds_sync_subscription_refunded on public.refunds;
create trigger trg_refunds_sync_subscription_refunded
  after update of status on public.refunds
  for each row
  when (new.status = 'succeeded')
  execute function public.sync_subscription_refunded_from_refund();

create or replace function public.keep_subscription_refunded_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.status = 'canceled'
     and exists (
       select 1
       from public.refunds r
       where r.status = 'succeeded'
         and coalesce(r.request_type, '') = 'subscription_prorated'
         and (
           r.subscription_id = new.id
           or (
             r.subscription_id is null
             and r.payment_id is not null
             and r.payment_id = new.payment_id
           )
         )
     ) then
    new.status := 'refunded';
    new.cancel_at_period_end := false;
    new.canceled_at := coalesce(new.canceled_at, now());
    new.expired_at := coalesce(new.expired_at, now());
    new.next_billing_at := null;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_subscriptions_keep_refunded_status on public.subscriptions;
create trigger trg_subscriptions_keep_refunded_status
  before update of status on public.subscriptions
  for each row
  execute function public.keep_subscription_refunded_status();

comment on column public.refunds.subscription_id is
  'P4 subscription refund request target. Student requests are inserted by server action; admin approval remains existing refund RPC.';
comment on column public.refunds.request_type is
  'Use subscription_prorated for student-requested remaining-period subscription refunds.';
comment on function public.sync_subscription_refunded_from_refund() is
  'P4: When a subscription_prorated refund is approved, mark the target subscription refunded.';
comment on function public.keep_subscription_refunded_status() is
  'P4: Preserve refunded subscription status when legacy refund RPC updates by payment_id to canceled.';

commit;
