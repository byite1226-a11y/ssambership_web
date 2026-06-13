-- =============================================================================
-- 061_review_consecutive_and_response_time.sql
-- 목적: 리뷰 자격 2개월 연속 구독 기준 + 멘토 평균 응답시간 RPC
-- 적용: Supabase SQL Editor 수동 적용
-- =============================================================================

create or replace function public.check_review_eligibility(
  p_mentor_id uuid,
  p_student_id uuid
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with paid_events as (
    -- subscriptions.payment_id -> payments: 결제 성공 구독 이력
    select coalesce(p.created_at, s.created_at) as paid_at
    from public.subscriptions s
    join public.payments p on p.id = s.payment_id
    where s.student_id = p_student_id
      and s.mentor_id = p_mentor_id
      and lower(trim(p.status)) in (
        'paid', 'succeeded', 'completed', 'complete', 'success',
        'captured', 'escrowed', 'paid_out'
      )
      and p.amount > 0
      and coalesce(lower(trim(s.plan_tier)), '') not in ('free', 'trial')
      and coalesce(lower(trim(s.plan_tier)), '') not like '%trial%'

    union all

    -- cash wallet checkout: cash_ledger 차감 시각을 결제 주기 대체 이력으로 사용
    select cl.created_at as paid_at
    from public.subscriptions s
    join public.cash_ledger cl on cl.ref_type = 'subscriptions' and cl.ref_id = s.id
    where s.student_id = p_student_id
      and s.mentor_id = p_mentor_id
      and cl.user_id = p_student_id
      and cl.delta_cents < 0
      and coalesce(lower(trim(s.plan_tier)), '') not in ('free', 'trial')
      and coalesce(lower(trim(s.plan_tier)), '') not like '%trial%'

    union all

    -- payment rows created by subscribe_checkout can be enough when subscription rows are upserted.
    select p.created_at as paid_at
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
      )
  ),
  paid_months as (
    select distinct date_trunc('month', paid_at at time zone 'Asia/Seoul')::date as month_start
    from paid_events
    where paid_at is not null
  )
  select exists (
    select 1
    from paid_months a
    join paid_months b on b.month_start = (a.month_start + interval '1 month')::date
  );
$$;

revoke all on function public.check_review_eligibility(uuid, uuid) from public, anon;
grant execute on function public.check_review_eligibility(uuid, uuid) to authenticated;

comment on function public.check_review_eligibility(uuid, uuid) is
  '리뷰 작성 자격: 동일 멘토에 결제 성공 구독이 2개월 연속 존재해야 함(payments/subscriptions/cash_ledger 기준).';

create or replace function public.get_mentor_avg_response_hours(p_mentor_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  with spans as (
    select
      qt.created_at as start_at,
      qt.first_answered_at as end_at
    from public.question_threads qt
    join public.mentor_student_rooms r on r.id = qt.mentor_student_room_id
    where r.mentor_id = p_mentor_id
      and qt.first_answered_at is not null
      and qt.first_answered_at > qt.created_at
      and lower(trim(qt.status)) in ('answered', 'confirmed')
  ),
  day_segments as (
    select
      s.start_at,
      s.end_at,
      gs.local_day
    from spans s
    cross join lateral generate_series(
      date_trunc('day', s.start_at at time zone 'Asia/Seoul'),
      date_trunc('day', s.end_at at time zone 'Asia/Seoul'),
      interval '1 day'
    ) as gs(local_day)
  ),
  counted as (
    select
      start_at,
      end_at,
      greatest(
        0,
        extract(epoch from (
          least(end_at, (local_day + interval '1 day') at time zone 'Asia/Seoul')
          - greatest(start_at, (local_day + interval '6 hours') at time zone 'Asia/Seoul')
        ))
      ) as seconds_counted
    from day_segments
  ),
  per_thread as (
    select start_at, end_at, sum(seconds_counted) as seconds_counted
    from counted
    group by start_at, end_at
  )
  select round((avg(seconds_counted) / 3600.0)::numeric, 2)
  from per_thread
  where seconds_counted > 0;
$$;

revoke all on function public.get_mentor_avg_response_hours(uuid) from public;
grant execute on function public.get_mentor_avg_response_hours(uuid) to anon, authenticated, service_role;

comment on function public.get_mentor_avg_response_hours(uuid) is
  '멘토 평균 응답시간: question_threads.created_at -> first_answered_at, 로컬 00:00~06:00 제외, answered/confirmed 대상.';
