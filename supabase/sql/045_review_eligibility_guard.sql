-- =============================================================================
-- 045_review_eligibility_guard.sql
-- 목적: reviews INSERT RLS — 동일 멘토에 결제 완료 구독 2회 이상일 때만 허용
-- 선행: 004_p0_cash_disputes_admin_draft.sql (reviews.author_id), 002_p0 (subscriptions.student_id)
-- 적용: Supabase SQL Editor 수동 적용
-- =============================================================================

create or replace function public.check_review_eligibility(
  p_mentor_id uuid,
  p_student_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  paid_count integer;
  ledger_paid integer;
begin
  if p_mentor_id is null or p_student_id is null then
    return false;
  end if;

  -- subscriptions.payment_id → payments (002 스키마; payments.subscription_id 없음)
  select count(*)::integer
  into paid_count
  from public.subscriptions s
  inner join public.payments p on p.id = s.payment_id
  where s.student_id = p_student_id
    and s.mentor_id = p_mentor_id
    and lower(trim(p.status)) in (
      'paid', 'succeeded', 'completed', 'complete', 'success',
      'captured', 'escrowed', 'paid_out'
    )
    and p.amount > 0
    and coalesce(lower(trim(s.plan_tier)), '') not in ('free', 'trial')
    and coalesce(lower(trim(s.plan_tier)), '') not like '%trial%';

  if paid_count >= 2 then
    return true;
  end if;

  -- 캐시 구독 차감( payment_id 없음 ) 대체 판정
  select count(*)::integer
  into ledger_paid
  from public.subscriptions s
  where s.student_id = p_student_id
    and s.mentor_id = p_mentor_id
    and exists (
      select 1
      from public.cash_ledger cl
      where cl.user_id = p_student_id
        and cl.ref_type = 'subscriptions'
        and cl.ref_id = s.id
        and cl.delta_cents < 0
    );

  return ledger_paid >= 2;
end;
$$;

revoke all on function public.check_review_eligibility(uuid, uuid) from public, anon;
grant execute on function public.check_review_eligibility(uuid, uuid) to authenticated;

comment on function public.check_review_eligibility(uuid, uuid) is
  '리뷰 작성 자격: 동일 멘토 paid 구독 2회+ (payments 또는 cash_ledger 차감)';

drop policy if exists "reviews_insert_author" on public.reviews;
drop policy if exists "reviews_insert_student" on public.reviews;

create policy "reviews_insert_student" on public.reviews
  for insert
  to authenticated
  with check (
    (select auth.uid()) = author_id
    and public.check_review_eligibility(mentor_id, (select auth.uid()))
  );
