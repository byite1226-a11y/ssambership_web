-- =============================================================================
-- 068_subscription_renewal_rpc.sql
-- Purpose: P2 monthly subscription renewal debit RPC.
--
-- Safety:
--   - Does not modify 019 record_subscription_cash_debit.
--   - Does not touch custom request escrow RPCs 054~057.
--   - No negative wallet balance: wallet update requires balance >= amount.
--   - Idempotency layers:
--       1) subscription_billing_events.idempotency_key unique
--       2) cash_ledger.idempotency_key unique
--       3) subscriptions row SELECT ... FOR UPDATE
--
-- Execution:
--   Run after 064_subscription_billing_period_schema.sql.
--
-- Rollback:
--   revoke all on function public.process_subscription_renewal(uuid, timestamptz, bigint, text, timestamptz) from public;
--   drop function if exists public.process_subscription_renewal(uuid, timestamptz, bigint, text, timestamptz);
-- =============================================================================

create or replace function public.process_subscription_renewal(
  p_subscription_id uuid,
  p_period_end timestamptz,
  p_amount_cents bigint,
  p_idempotency_key text,
  p_processed_at timestamptz default now()
)
returns table (
  ok boolean,
  code text,
  message text,
  billing_event_id uuid,
  ledger_id uuid,
  next_period_start timestamptz,
  next_period_end timestamptz,
  wallet_balance_cents bigint,
  attempt_count int
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_sub public.subscriptions%rowtype;
  v_event public.subscription_billing_events%rowtype;
  v_event_id uuid;
  v_ledger_id uuid;
  v_wallet_balance bigint;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_attempt_count int;
begin
  if p_subscription_id is null then
    return query select false, 'invalid_subscription'::text, 'subscription_id is required'::text, null::uuid, null::uuid, null::timestamptz, null::timestamptz, null::bigint, 0::int;
    return;
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    return query select false, 'invalid_amount'::text, 'p_amount_cents must be positive'::text, null::uuid, null::uuid, null::timestamptz, null::timestamptz, null::bigint, 0::int;
    return;
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    return query select false, 'invalid_idempotency_key'::text, 'idempotency_key is required'::text, null::uuid, null::uuid, null::timestamptz, null::timestamptz, null::bigint, 0::int;
    return;
  end if;

  select *
    into v_sub
  from public.subscriptions
  where id = p_subscription_id
  for update;

  if not found then
    return query select false, 'not_found'::text, 'subscription not found'::text, null::uuid, null::uuid, null::timestamptz, null::timestamptz, null::bigint, 0::int;
    return;
  end if;

  if coalesce(v_sub.status, '') not in ('active', 'past_due') then
    return query select false, 'not_renewable_status'::text, 'subscription status is not renewable'::text, null::uuid, null::uuid, v_sub.current_period_start, v_sub.current_period_end, null::bigint, 0::int;
    return;
  end if;

  select *
    into v_event
  from public.subscription_billing_events
  where idempotency_key = p_idempotency_key
  for update;

  if found then
    if v_event.status = 'succeeded' then
      return query select true, 'already_succeeded'::text, 'renewal already processed'::text, v_event.id, v_event.ledger_id, v_event.period_start, v_event.period_end, null::bigint, coalesce(v_event.attempt_count, 0);
      return;
    end if;

    if v_event.status in ('pending', 'processing') then
      return query select false, 'already_processing'::text, 'renewal is already processing'::text, v_event.id, v_event.ledger_id, v_event.period_start, v_event.period_end, null::bigint, coalesce(v_event.attempt_count, 0);
      return;
    end if;

    update public.subscription_billing_events as e
    set
      event_type = 'renewal',
      status = 'processing',
      failure_code = null,
      failure_message = null,
      amount_cents = p_amount_cents::int,
      billing_at = p_processed_at,
      attempt_count = coalesce(attempt_count, 0) + 1,
      processed_at = null
    where e.id = v_event.id
    returning e.* into v_event;

    v_event_id := v_event.id;
    v_attempt_count := coalesce(v_event.attempt_count, 1);
  else
    v_period_start := coalesce(v_sub.current_period_end, p_period_end, p_processed_at);
    v_period_end := v_period_start + interval '1 month';

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
      attempt_count,
      created_at
    )
    values (
      v_sub.id,
      v_sub.student_id,
      v_sub.mentor_id,
      'renewal',
      'processing',
      v_period_start,
      v_period_end,
      p_processed_at,
      p_amount_cents::int,
      v_sub.plan_tier,
      v_sub.plan_id,
      p_idempotency_key,
      1,
      p_processed_at
    )
    returning * into v_event;

    v_event_id := v_event.id;
    v_attempt_count := 1;
  end if;

  insert into public.cash_wallets (user_id, balance_cents)
  values (v_sub.student_id, 0)
  on conflict (user_id) do nothing;

  update public.cash_wallets
  set balance_cents = balance_cents - p_amount_cents
  where user_id = v_sub.student_id
    and balance_cents >= p_amount_cents
  returning balance_cents into v_wallet_balance;

  if not found then
    update public.subscription_billing_events as e
    set
      event_type = 'renewal_failed',
      status = 'failed',
      failure_code = 'insufficient_cash',
      failure_message = 'CASH_INSUFFICIENT',
      processed_at = p_processed_at
    where e.id = v_event_id
    returning e.attempt_count into v_attempt_count;

    update public.subscriptions
    set
      status = 'past_due',
      grace_until = coalesce(grace_until, p_processed_at + interval '2 days'),
      updated_at = p_processed_at,
      last_billing_event_id = v_event_id
    where id = v_sub.id;

    return query select false, 'insufficient_cash'::text, 'CASH_INSUFFICIENT'::text, v_event_id, null::uuid, v_event.period_start, v_event.period_end, null::bigint, coalesce(v_attempt_count, 1);
    return;
  end if;

  insert into public.cash_ledger (
    user_id,
    delta_cents,
    reason,
    ref_type,
    ref_id,
    idempotency_key,
    created_at
  )
  values (
    v_sub.student_id,
    -p_amount_cents,
    'subscription_renewal',
    'subscriptions',
    v_sub.id,
    p_idempotency_key,
    p_processed_at
  )
  on conflict (idempotency_key) do nothing
  returning id into v_ledger_id;

  if v_ledger_id is null then
    select id
      into v_ledger_id
    from public.cash_ledger
    where idempotency_key = p_idempotency_key;
  end if;

  v_period_start := coalesce(v_event.period_start, v_sub.current_period_end, p_period_end, p_processed_at);
  v_period_end := coalesce(v_event.period_end, v_period_start + interval '1 month');

  update public.subscription_billing_events as e
  set
    event_type = 'renewal',
    status = 'succeeded',
    ledger_id = v_ledger_id,
    processed_at = p_processed_at,
    failure_code = null,
    failure_message = null,
    period_start = v_period_start,
    period_end = v_period_end,
    amount_cents = p_amount_cents::int
  where e.id = v_event_id
  returning e.attempt_count into v_attempt_count;

  update public.subscriptions
  set
    status = 'active',
    current_period_start = v_period_start,
    current_period_end = v_period_end,
    next_billing_at = v_period_end,
    last_renewed_at = p_processed_at,
    last_billing_event_id = v_event_id,
    grace_until = null,
    updated_at = p_processed_at
  where id = v_sub.id;

  return query select true, 'succeeded'::text, 'renewal processed'::text, v_event_id, v_ledger_id, v_period_start, v_period_end, v_wallet_balance, coalesce(v_attempt_count, 1);
end;
$function$;

revoke all on function public.process_subscription_renewal(uuid, timestamptz, bigint, text, timestamptz) from public;
grant execute on function public.process_subscription_renewal(uuid, timestamptz, bigint, text, timestamptz) to service_role;
