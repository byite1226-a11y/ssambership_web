-- 046_free_question_usage_db_guard.sql
-- 무료 질문권 TOCTOU 방지: free_question_usage INSERT 시 DB 레벨 한도 강제
-- 선행: 044_free_question_usage.sql

create or replace function public.check_free_question_usage_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  per_mentor_count integer;
  total_count integer;
begin
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

  if total_count >= 15 then
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
