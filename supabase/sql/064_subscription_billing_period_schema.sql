-- =============================================================================
-- 064_subscription_billing_period_schema.sql
-- Purpose: P1 foundation for monthly subscription renewal.
-- Scope:
--   1) Add billing-period columns to public.subscriptions.
--   2) Add public.subscription_billing_events.
--   3) Backfill existing subscriptions and record the initial payment as a
--      succeeded billing event.
--
-- Not included in P1:
--   - No automatic renewal batch/cron.
--   - No additional cash debit RPC.
--   - No changes to record_subscription_cash_debit (019).
--   - No changes to custom request escrow RPCs (054~057).
--   - No change to uq_subscriptions_pair lifetime one-row model.
--
-- Execution order in Supabase SQL Editor:
--   A. Review the dry-run SELECT results in section 0.
--   B. If counts look correct, run the whole file.
--
-- Rollback notes:
--   - Drop table public.subscription_billing_events after clearing
--     subscriptions.last_billing_event_id.
--   - Drop the added subscriptions columns if P1 must be fully reverted.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) Dry-run probes: review before applying the schema/backfill below.
-- -----------------------------------------------------------------------------
select
  count(*) as subscriptions_total,
  count(*) filter (where lower(coalesce(status, '')) = 'active') as subscriptions_active,
  count(*) filter (where payment_id is not null) as subscriptions_with_payment_id
from public.subscriptions;

select
  s.id,
  s.student_id,
  s.mentor_id,
  s.payment_id,
  s.plan_tier,
  s.plan_id,
  s.status,
  s.created_at,
  p.status as payment_status,
  p.amount as payment_amount,
  cl.id as first_subscription_ledger_id,
  cl.delta_cents as first_subscription_ledger_delta_cents
from public.subscriptions s
left join public.payments p on p.id = s.payment_id
left join lateral (
  select l.id, l.delta_cents, l.created_at
  from public.cash_ledger l
  where l.ref_type = 'subscriptions'
    and l.ref_id = s.id
    and l.user_id = s.student_id
    and l.delta_cents < 0
  order by l.created_at asc
  limit 1
) cl on true
order by s.created_at asc;

-- -----------------------------------------------------------------------------
-- 1) subscriptions: billing period columns.
-- -----------------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists started_at timestamptz,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists next_billing_at timestamptz,
  add column if not exists billing_cycle text default 'monthly',
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists cancel_requested_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists expired_at timestamptz,
  add column if not exists last_renewed_at timestamptz,
  add column if not exists last_billing_event_id uuid,
  add column if not exists last_payment_id uuid,
  add column if not exists grace_until timestamptz;

alter table public.subscriptions
  alter column billing_cycle set default 'monthly';

do $$
declare
  v_constraint_name text;
begin
  for v_constraint_name in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.subscriptions'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.subscriptions drop constraint if exists %I', v_constraint_name);
  end loop;
end
$$;

alter table public.subscriptions
  add constraint subscriptions_status_check
  check (
    status in (
      'pending',
      'active',
      'past_due',
      'cancel_scheduled',
      'canceled',
      'expired',
      'refunded'
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.subscriptions'::regclass
      and conname = 'subscriptions_last_payment_id_fkey'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_last_payment_id_fkey
      foreign key (last_payment_id) references public.payments(id) on delete set null;
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 2) subscription_billing_events: append-only billing history.
-- -----------------------------------------------------------------------------
create table if not exists public.subscription_billing_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  mentor_id uuid not null references public.users(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'initial',
      'renewal',
      'renewal_failed',
      'expired',
      'cancel_scheduled',
      'canceled',
      'refund'
    )
  ),
  status text not null check (
    status in (
      'pending',
      'processing',
      'succeeded',
      'failed',
      'skipped',
      'refunded'
    )
  ),
  period_start timestamptz,
  period_end timestamptz,
  billing_at timestamptz,
  amount_cents int,
  plan_tier text,
  plan_id uuid,
  idempotency_key text unique,
  ledger_id uuid references public.cash_ledger(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  failure_code text,
  failure_message text,
  attempt_count int not null default 0,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.subscription_billing_events enable row level security;

drop policy if exists "subscription_billing_events_select_parties" on public.subscription_billing_events;
create policy "subscription_billing_events_select_parties" on public.subscription_billing_events
  for select to authenticated
  using (
    (select auth.uid()) in (student_id, mentor_id)
    or (select public.is_admin()) = true
  );

-- No INSERT/UPDATE/DELETE policies for authenticated users.
-- Server writes use service_role, which bypasses RLS.
grant select on table public.subscription_billing_events to authenticated;
grant all on table public.subscription_billing_events to service_role;

create index if not exists idx_subscription_billing_events_subscription_period
  on public.subscription_billing_events (subscription_id, period_start);

create index if not exists idx_subscription_billing_events_pair_status
  on public.subscription_billing_events (student_id, mentor_id, status);

create index if not exists idx_subscription_billing_events_pending_billing_at
  on public.subscription_billing_events (billing_at)
  where status = 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.subscriptions'::regclass
      and conname = 'subscriptions_last_billing_event_id_fkey'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_last_billing_event_id_fkey
      foreign key (last_billing_event_id)
      references public.subscription_billing_events(id)
      on delete set null;
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 3) Backfill existing subscriptions.
--    Month-end policy: PostgreSQL interval arithmetic clamps missing month days
--    to the target month's last day (for example Jan 31 + 1 month = Feb 28/29).
-- -----------------------------------------------------------------------------
update public.subscriptions
set
  started_at = coalesce(started_at, created_at),
  current_period_start = coalesce(current_period_start, coalesce(started_at, created_at)),
  current_period_end = coalesce(current_period_end, coalesce(started_at, created_at) + interval '1 month'),
  next_billing_at = coalesce(next_billing_at, coalesce(current_period_end, coalesce(started_at, created_at) + interval '1 month')),
  billing_cycle = coalesce(nullif(billing_cycle, ''), 'monthly'),
  last_payment_id = coalesce(last_payment_id, payment_id)
where started_at is null
   or current_period_start is null
   or current_period_end is null
   or next_billing_at is null
   or billing_cycle is null
   or billing_cycle = ''
   or (last_payment_id is null and payment_id is not null);

with initial_source as (
  select
    s.id as subscription_id,
    s.student_id,
    s.mentor_id,
    s.plan_tier,
    s.plan_id,
    s.payment_id,
    s.current_period_start,
    s.current_period_end,
    coalesce(cl.created_at, p.created_at, s.created_at) as billing_at,
    coalesce(
      abs(cl.delta_cents)::int,
      mp.amount_cents::int,
      case
        when p.amount is not null and p.amount > 0 then round(p.amount * 100)::int
        else null
      end
    ) as amount_cents,
    cl.id as ledger_id
  from public.subscriptions s
  left join public.payments p on p.id = s.payment_id
  left join public.mentor_plans mp on mp.id = s.plan_id
  left join lateral (
    select l.id, l.delta_cents, l.created_at
    from public.cash_ledger l
    where l.ref_type = 'subscriptions'
      and l.ref_id = s.id
      and l.user_id = s.student_id
      and l.delta_cents < 0
    order by l.created_at asc
    limit 1
  ) cl on true
)
insert into public.subscription_billing_events (
  subscription_id,
  student_id,
  mentor_id,
  event_type,
  status,
  period_start,
  period_end,
  billing_at,
  amount_cents,
  plan_tier,
  plan_id,
  idempotency_key,
  ledger_id,
  payment_id,
  created_at,
  processed_at
)
select
  src.subscription_id,
  src.student_id,
  src.mentor_id,
  'initial',
  'succeeded',
  src.current_period_start,
  src.current_period_end,
  src.billing_at,
  src.amount_cents,
  src.plan_tier,
  src.plan_id,
  'sub_initial:' || src.subscription_id::text,
  src.ledger_id,
  src.payment_id,
  now(),
  src.billing_at
from initial_source src
on conflict (idempotency_key) do nothing;

update public.subscriptions s
set
  last_billing_event_id = coalesce(s.last_billing_event_id, e.id),
  last_payment_id = coalesce(s.last_payment_id, e.payment_id, s.payment_id)
from public.subscription_billing_events e
where e.subscription_id = s.id
  and e.event_type = 'initial'
  and e.idempotency_key = 'sub_initial:' || s.id::text
  and (s.last_billing_event_id is null or s.last_payment_id is null);

-- -----------------------------------------------------------------------------
-- 4) Verification queries.
-- -----------------------------------------------------------------------------
select
  count(*) as initial_billing_events_total,
  count(*) filter (where event_type = 'initial' and status = 'succeeded') as initial_succeeded_total
from public.subscription_billing_events;

select
  s.id,
  s.status,
  s.started_at,
  s.current_period_start,
  s.current_period_end,
  s.next_billing_at,
  s.last_billing_event_id,
  e.idempotency_key as initial_event_key,
  e.amount_cents as initial_event_amount_cents
from public.subscriptions s
left join public.subscription_billing_events e on e.id = s.last_billing_event_id
order by s.created_at asc;
