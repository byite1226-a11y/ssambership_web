-- =============================================================================
-- 098_weekly_usage_count_on_create.sql
-- Purpose: Weekly question quota is consumed on CREATE (thread written), not on
--          student confirmation. Policy 286/284: count on write, no restore.
--          Mentor non-answer is handled by report/ops flow, not quota refund.
--
-- Prerequisite:
--   - 065_anchor_weekly_question_usage.sql has been applied.
--
-- Scope:
--   - Replace get_weekly_question_usage(uuid, uuid) only (065 active body).
--   - No cash debit, renewal batch, escrow, or custom request changes.
--
-- Changes vs 065 (ONLY these two lines in the count query):
--   1) Count condition: qt.status = 'confirmed'
--        -> lower(coalesce(qt.status,'')) in ('pending','answered','confirmed','closed','archived')
--      i.e. any forward (non-discarded) thread, counted from creation.
--   2) Window timestamp: coalesce(qt.updated_at, qt.created_at) -> qt.created_at
--      i.e. usage window keyed to write time, independent of later status changes.
--   Everything else (anchor 7-day boundary, limit, can_ask, signature, return)
--   is reproduced from 065 verbatim.
--
-- Formula (unchanged):
--   anchor = coalesce(subscriptions.started_at, subscriptions.created_at)
--   period_start = anchor + floor((now - anchor) / 7 days) * 7 days
--   period_end = period_start + 7 days
--
-- Verify after applying:
--   select * from get_weekly_question_usage('<student_uuid>','<mentor_uuid>');
--   -- After creating 1 pending thread, used should be +1 (before any confirm).
-- =============================================================================

create or replace function public.get_weekly_question_usage(
  p_student_id uuid,
  p_mentor_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_anchor timestamptz;
  v_week_start timestamptz;
  v_week_end timestamptz;
  v_elapsed_seconds numeric;
  v_period_index integer;
  v_used integer := 0;
  v_plan_tier text;
  v_limit integer := 0;
begin
  if p_student_id is null or p_mentor_id is null then
    raise exception 'p_student_id and p_mentor_id are required';
  end if;

  select
    s.plan_tier,
    coalesce(s.started_at, s.created_at)
  into v_plan_tier, v_anchor
  from public.subscriptions s
  where s.student_id = p_student_id
    and s.mentor_id = p_mentor_id
    and lower(coalesce(s.status, '')) = 'active'
  order by s.created_at desc
  limit 1;

  v_limit := case lower(coalesce(v_plan_tier, ''))
    when 'limited' then 4
    when 'standard' then 9
    when 'premium' then 999
    else 0
  end;

  if v_anchor is not null then
    v_elapsed_seconds := extract(epoch from (now() - v_anchor));
    v_period_index := greatest(0, floor(v_elapsed_seconds / 604800.0)::integer);
    v_week_start := v_anchor + (v_period_index * interval '7 days');
    v_week_end := v_week_start + interval '7 days';

    select count(*)::integer into v_used
    from public.question_threads qt
    inner join public.mentor_student_rooms r on r.id = qt.mentor_student_room_id
    where r.student_id = p_student_id
      and r.mentor_id = p_mentor_id
      and lower(coalesce(qt.status, '')) in ('pending', 'answered', 'confirmed', 'closed', 'archived')
      and qt.created_at >= v_week_start
      and qt.created_at < v_week_end;
  end if;

  return json_build_object(
    'used', coalesce(v_used, 0),
    'limit', v_limit,
    'plan_tier', v_plan_tier,
    'remaining', greatest(0, v_limit - coalesce(v_used, 0)),
    'can_ask', coalesce(v_used, 0) < v_limit,
    'week_start', v_week_start,
    'week_end', v_week_end
  );
end;
$function$;

revoke all on function public.get_weekly_question_usage(uuid, uuid) from public;
grant execute on function public.get_weekly_question_usage(uuid, uuid) to authenticated;
grant execute on function public.get_weekly_question_usage(uuid, uuid) to service_role;

comment on function public.get_weekly_question_usage(uuid, uuid) is
  'Weekly question usage: forward (non-discarded) threads counted by created_at in a 7-day window anchored to subscriptions.started_at (fallback created_at), independently per student-mentor subscription. Quota consumed on create (098), not on confirm.';
