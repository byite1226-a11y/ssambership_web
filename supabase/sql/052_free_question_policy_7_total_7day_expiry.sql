-- 052_free_question_policy_7_total_7day_expiry.sql
-- 무료 질문권: 총량 15→7, 가입일(users.created_at) 기준 7일 만료 (앱 freeQuestionPolicy.ts와 동기)
-- 선행: 044_free_question_usage.sql, 046_free_question_usage_db_guard.sql

create or replace function public.check_free_question_usage_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  per_mentor_count integer;
  total_count integer;
  signup_at timestamptz;
begin
  select created_at
  into signup_at
  from public.users
  where id = new.student_id;

  if signup_at is null then
    raise exception 'FREE_QUESTION_STUDENT_NOT_FOUND'
      using errcode = 'P0003';
  end if;

  if signup_at + interval '7 days' < now() then
    raise exception 'FREE_QUESTION_EXPIRED'
      using errcode = 'P0003';
  end if;

  select count(*)::integer
  into per_mentor_count
  from public.free_question_usage
  where student_id = new.student_id
    and mentor_id = new.mentor_id;

  if per_mentor_count >= 3 then
    raise exception 'FREE_QUESTION_PER_MENTOR_LIMIT'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
  into total_count
  from public.free_question_usage
  where student_id = new.student_id;

  if total_count >= 7 then
    raise exception 'FREE_QUESTION_TOTAL_LIMIT'
      using errcode = 'P0002';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_free_question_usage_limits on public.free_question_usage;
create trigger trg_free_question_usage_limits
  before insert on public.free_question_usage
  for each row
  execute function public.check_free_question_usage_limits();

revoke all on function public.check_free_question_usage_limits() from public, anon;
grant execute on function public.check_free_question_usage_limits() to authenticated;

comment on function public.check_free_question_usage_limits() is
  '무료 질문권: 가입 후 7일·총 7회·멘토당 3회 INSERT 강제';
