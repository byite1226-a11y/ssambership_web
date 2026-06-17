-- 067_mentor_subscription_pricing.sql
-- Purpose: allow mentors to set subscription plan prices through public.mentor_plans.amount_cents.
--
-- Execution order:
-- 1) Review the DRY-RUN SELECT results below.
-- 2) If duplicate_rows returns any row, stop and resolve duplicates manually before running the migration.
-- 3) Run the whole file in Supabase SQL Editor.
--
-- Rollback notes:
-- - drop index if exists public.uq_mentor_plans_mentor_tier;
-- - alter table public.mentor_plans drop column if exists price_updated_at;
-- - seeded rows can be removed manually only if they were not edited/used.

-- DRY RUN 1: duplicate mentor/tier rows that would block the unique index.
select
  mentor_id,
  plan_tier,
  count(*) as duplicate_rows,
  array_agg(id order by updated_at desc nulls last, created_at desc nulls last) as row_ids
from public.mentor_plans
where mentor_id is not null
  and plan_tier in ('limited', 'standard', 'premium')
group by mentor_id, plan_tier
having count(*) > 1;

-- DRY RUN 2: mentors missing one or more required tiers.
with mentor_users as (
  select id
  from public.users
  where role = 'mentor'
),
tiers(plan_tier, recommended_amount_cents) as (
  values
    ('limited', 5500000),
    ('standard', 11490000),
    ('premium', 24990000)
)
select
  m.id as mentor_id,
  array_agg(t.plan_tier order by t.plan_tier) filter (where mp.id is null) as missing_tiers
from mentor_users m
cross join tiers t
left join public.mentor_plans mp
  on mp.mentor_id = m.id
 and mp.plan_tier = t.plan_tier
group by m.id
having count(*) filter (where mp.id is null) > 0
order by m.id;

-- DRY RUN 3: legacy rows where amount_cents appears to have been stored as KRW, not cents.
select id, mentor_id, plan_tier, amount_cents
from public.mentor_plans
where (plan_tier = 'limited' and amount_cents between 39900 and 69900)
   or (plan_tier = 'standard' and amount_cents between 84900 and 149900)
   or (plan_tier = 'premium' and amount_cents between 189900 and 329900)
order by mentor_id, plan_tier;

begin;

alter table public.mentor_plans
  add column if not exists price_updated_at timestamptz;

do $$
declare
  duplicate_count integer;
begin
  select count(*)
    into duplicate_count
  from (
    select mentor_id, plan_tier
    from public.mentor_plans
    where mentor_id is not null
      and plan_tier in ('limited', 'standard', 'premium')
    group by mentor_id, plan_tier
    having count(*) > 1
  ) d;

  if duplicate_count > 0 then
    raise exception 'mentor_plans has duplicate mentor_id/plan_tier rows. Review DRY RUN 1 and resolve duplicates before creating the unique index.';
  end if;
end $$;

create unique index if not exists uq_mentor_plans_mentor_tier
  on public.mentor_plans (mentor_id, plan_tier);

-- Normalize legacy values accidentally stored as KRW in amount_cents.
update public.mentor_plans
set
  amount_cents = amount_cents * 100,
  updated_at = now(),
  price_updated_at = coalesce(price_updated_at, now())
where (
    (plan_tier = 'limited' and amount_cents between 39900 and 69900)
 or (plan_tier = 'standard' and amount_cents between 84900 and 149900)
 or (plan_tier = 'premium' and amount_cents between 189900 and 329900)
);

-- Prevent null/zero prices from becoming zero-cash checkout rows. Ranges are not enforced by DB.
update public.mentor_plans
set
  amount_cents = case plan_tier
    when 'limited' then 5500000
    when 'standard' then 11490000
    when 'premium' then 24990000
    else amount_cents
  end,
  updated_at = now(),
  price_updated_at = coalesce(price_updated_at, now())
where plan_tier in ('limited', 'standard', 'premium')
  and (amount_cents is null or amount_cents <= 0);

-- Seed every mentor with the three required tiers. Mentors may later edit prices freely.
with mentor_users as (
  select id
  from public.users
  where role = 'mentor'
),
tiers(plan_tier, label, amount_cents) as (
  values
    ('limited', 'Limited', 5500000),
    ('standard', 'Standard', 11490000),
    ('premium', 'Premium', 24990000)
)
insert into public.mentor_plans (
  mentor_id,
  plan_tier,
  label,
  amount_cents,
  created_at,
  updated_at,
  price_updated_at
)
select
  m.id,
  t.plan_tier,
  t.label,
  t.amount_cents,
  now(),
  now(),
  now()
from mentor_users m
cross join tiers t
on conflict (mentor_id, plan_tier) do nothing;

comment on column public.mentor_plans.price_updated_at is
  'Last time the mentor subscription price was changed. Ranges are soft-guided in UI, not DB-enforced.';

commit;
