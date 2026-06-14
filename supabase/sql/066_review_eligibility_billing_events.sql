-- =============================================================================
-- 066_review_eligibility_billing_events.sql
-- Purpose: Review eligibility is based on 2+ successful paid billing events for
--          the same student/mentor pair.
--
-- Prerequisite:
--   - 064_subscription_billing_period_schema.sql has been applied.
--
-- Scope:
--   - Replace public.check_review_eligibility(uuid, uuid).
--   - Keep reviews storage/display/reply/moderation logic unchanged.
--   - No subscription renewal debit, cron, escrow, or custom request changes.
--
-- Dry-run checks:
--   select student_id, mentor_id, count(*) as succeeded_paid_events
--   from public.subscription_billing_events
--   where status = 'succeeded'
--     and event_type in ('initial', 'renewal')
--     and coalesce(amount_cents, 0) > 0
--     and coalesce(lower(trim(plan_tier)), '') not in ('free', 'trial')
--     and coalesce(lower(trim(plan_tier)), '') not like '%trial%'
--   group by student_id, mentor_id
--   order by succeeded_paid_events desc;
-- =============================================================================

create or replace function public.check_review_eligibility(
  p_mentor_id uuid,
  p_student_id uuid
) returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  event_paid integer := 0;
  ledger_paid integer := 0;
  payment_paid integer := 0;
begin
  if p_mentor_id is null or p_student_id is null then
    return false;
  end if;

  select count(*)::integer
  into event_paid
  from public.subscription_billing_events e
  where e.student_id = p_student_id
    and e.mentor_id = p_mentor_id
    and e.status = 'succeeded'
    and e.event_type in ('initial', 'renewal')
    and coalesce(e.amount_cents, 0) > 0
    and coalesce(lower(trim(e.plan_tier)), '') not in ('free', 'trial')
    and coalesce(lower(trim(e.plan_tier)), '') not like '%trial%';

  if event_paid >= 2 then
    return true;
  end if;

  -- Fallback for old data if billing events are missing/incomplete.
  -- Count ledger rows first because a cash checkout has both payments and ledger;
  -- do not add the two counts together.
  select count(*)::integer
  into ledger_paid
  from public.subscriptions s
  join public.cash_ledger cl
    on cl.ref_type = 'subscriptions'
   and cl.ref_id = s.id
   and cl.user_id = p_student_id
   and cl.delta_cents < 0
  where s.student_id = p_student_id
    and s.mentor_id = p_mentor_id
    and coalesce(lower(trim(s.plan_tier)), '') not in ('free', 'trial')
    and coalesce(lower(trim(s.plan_tier)), '') not like '%trial%';

  if ledger_paid >= 2 then
    return true;
  end if;

  select count(*)::integer
  into payment_paid
  from public.payments p
  where (p.user_id = p_student_id or p.student_id = p_student_id or p.payer_id = p_student_id)
    and p.mentor_id = p_mentor_id
    and lower(trim(p.status)) in (
      'paid', 'succeeded', 'completed', 'complete', 'success',
      'captured', 'escrowed', 'paid_out'
    )
    and p.amount > 0
    and (
      coalesce(lower(trim(p.kind)), '') = 'subscription'
      or coalesce(p.metadata->>'source', '') = 'subscribe_checkout'
      or coalesce(p.data->>'source', '') = 'subscribe_checkout'
    );

  return greatest(event_paid, ledger_paid, payment_paid) >= 2;
end;
$$;

revoke all on function public.check_review_eligibility(uuid, uuid) from public, anon;
grant execute on function public.check_review_eligibility(uuid, uuid) to authenticated;

comment on function public.check_review_eligibility(uuid, uuid) is
  'Review eligibility: same student/mentor pair needs at least two successful paid subscription billing events (initial/renewal). Falls back to legacy subscription ledger/payment counts without summing duplicate sources.';
