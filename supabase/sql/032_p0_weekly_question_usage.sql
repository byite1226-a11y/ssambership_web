-- [번호 충돌] 접두 032 — 동일 번호: 032_p1_admin_content_reports.sql (이 파일: 주간 질문 한도 P0)
-- P0: 주간 질문 한도 (월~일, confirmed 만 소비) + usage RPC

alter table public.question_threads drop constraint if exists question_threads_status_check;

alter table public.question_threads
  add constraint question_threads_status_check
  check (status in ('pending', 'answered', 'confirmed', 'open', 'closed', 'archived'));

comment on column public.question_threads.status is
  'pending=답변대기, answered=답변도착, confirmed=학생확인(소비). open/closed/archived=레거시 호환';

update public.question_threads
set status = case
  when status = 'open' then 'pending'
  when status = 'closed' then 'confirmed'
  else status
end
where status in ('open', 'closed');

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
  v_week_start timestamptz;
  v_week_end timestamptz;
  v_used integer;
  v_plan_tier text;
  v_limit integer;
begin
  if p_student_id is null or p_mentor_id is null then
    raise exception 'p_student_id and p_mentor_id are required';
  end if;

  -- 월요일 00:00 (Asia/Seoul) ~ 다음 월요일 00:00
  v_week_start := (
    date_trunc('week', (now() at time zone 'Asia/Seoul'))
    at time zone 'Asia/Seoul'
  );
  v_week_end := v_week_start + interval '7 days';

  select s.plan_tier into v_plan_tier
  from public.subscriptions s
  where s.student_id = p_student_id
    and s.mentor_id = p_mentor_id
    and s.status = 'active'
  order by s.created_at desc
  limit 1;

  v_limit := case lower(coalesce(v_plan_tier, ''))
    when 'limited' then 4
    when 'standard' then 9
    when 'premium' then 999
    else 0
  end;

  select count(*)::integer into v_used
  from public.question_threads qt
  inner join public.mentor_student_rooms r on r.id = qt.mentor_student_room_id
  where r.student_id = p_student_id
    and r.mentor_id = p_mentor_id
    and qt.status = 'confirmed'
    and coalesce(qt.updated_at, qt.created_at) >= v_week_start
    and coalesce(qt.updated_at, qt.created_at) < v_week_end;

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
