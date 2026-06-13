-- 050_mentor_subscription_cap.sql
-- 멘토 구독 cap(수용량) 구조.
--   • 플랜별 cap 가중치(잠금값): limited 1.0 / standard 2.5 / premium 4.5
--   • 멘토 1인 cap 상한 기본값 28 (관리자만 조정) → mentor_profiles.cap_limit
--   • 멘토 사용 cap = 활성(active) 구독들의 플랜 cap 가중치 합
--   • 결제 확정 트랜잭션(=subscriptions insert) 내에서 DB 트리거로 초과 차단(동시성 안전)
-- idempotent. Supabase SQL Editor에서 수동 적용.

-- -----------------------------------------------------------------------------
-- 1) 멘토 cap 상한 컬럼 (기본 28, 관리자만 수정)
-- -----------------------------------------------------------------------------
alter table public.mentor_profiles
  add column if not exists cap_limit numeric not null default 28;

-- -----------------------------------------------------------------------------
-- 2) 플랜 cap 가중치 컬럼 (참조용) — tier/금액으로 채움
-- -----------------------------------------------------------------------------
alter table public.mentor_plans
  add column if not exists cap_weight numeric;

-- tier 기준 채움 (limited/standard/premium)
update public.mentor_plans
set cap_weight = case lower(coalesce(plan_tier, ''))
    when 'limited' then 1.0
    when 'standard' then 2.5
    when 'premium' then 4.5
    else cap_weight
  end
where cap_weight is null
  and lower(coalesce(plan_tier, '')) in ('limited', 'standard', 'premium');

-- 금액(amount_cents = 캐시×100) 기준 폴백 (tier 비어있는 행)
update public.mentor_plans
set cap_weight = case amount_cents
    when 5500000 then 1.0   -- 55,000 캐시
    when 11490000 then 2.5  -- 114,900 캐시
    when 24990000 then 4.5  -- 249,900 캐시
    else cap_weight
  end
where cap_weight is null
  and amount_cents in (5500000, 11490000, 24990000);

-- -----------------------------------------------------------------------------
-- 3) tier → cap 가중치 매핑 함수 (잠금값)
-- -----------------------------------------------------------------------------
create or replace function public.subscription_cap_weight(p_tier text)
returns numeric
language sql
immutable
as $$
  select case lower(coalesce(p_tier, ''))
    when 'limited' then 1.0
    when 'standard' then 2.5
    when 'premium' then 4.5
    else 0
  end::numeric;
$$;

-- -----------------------------------------------------------------------------
-- 4) 멘토 사용 cap 합 (활성 구독 기준) — SECURITY DEFINER로 RLS 우회 집계
--    개별 구독은 노출하지 않고 합계 numeric만 반환.
-- -----------------------------------------------------------------------------
create or replace function public.mentor_cap_used(p_mentor_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(public.subscription_cap_weight(s.plan_tier)), 0)::numeric
  from public.subscriptions s
  where s.mentor_id = p_mentor_id
    and lower(coalesce(s.status, '')) = 'active';
$$;

-- 멘토 cap 상한 (없으면 28)
create or replace function public.mentor_cap_limit(p_mentor_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select mp.cap_limit from public.mentor_profiles mp where mp.user_id = p_mentor_id),
    28
  )::numeric;
$$;

grant execute on function public.subscription_cap_weight(text) to anon, authenticated, service_role;
grant execute on function public.mentor_cap_used(uuid) to anon, authenticated, service_role;
grant execute on function public.mentor_cap_limit(uuid) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 5) 신규 active 구독 insert/update 시 cap 초과 차단 트리거 (동시성 안전)
--    (used_cap + 신규 plan cap_weight) > cap_limit 이면 예외.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_mentor_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used numeric;
  v_limit numeric;
  v_new numeric;
begin
  -- active 로 들어오는(또는 active 로 바뀌는) 행만 검사
  if lower(coalesce(NEW.status, '')) <> 'active' then
    return NEW;
  end if;
  if TG_OP = 'UPDATE' and lower(coalesce(OLD.status, '')) = 'active' then
    -- 이미 active 였던 행의 갱신은 추가 cap 점유가 아님
    return NEW;
  end if;

  v_new := public.subscription_cap_weight(NEW.plan_tier);
  if v_new <= 0 then
    return NEW; -- 가중치를 모르는 플랜은 차단하지 않음
  end if;

  select coalesce(sum(public.subscription_cap_weight(s.plan_tier)), 0)
    into v_used
  from public.subscriptions s
  where s.mentor_id = NEW.mentor_id
    and lower(coalesce(s.status, '')) = 'active'
    and s.id <> NEW.id;

  v_limit := public.mentor_cap_limit(NEW.mentor_id);

  if (v_used + v_new) > v_limit then
    raise exception 'MENTOR_CAP_EXCEEDED: mentor % cap %/% (+%) 초과', NEW.mentor_id, v_used, v_limit, v_new
      using errcode = 'check_violation';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_enforce_mentor_cap on public.subscriptions;
create trigger trg_enforce_mentor_cap
  before insert or update of status, plan_tier on public.subscriptions
  for each row execute function public.enforce_mentor_cap();
