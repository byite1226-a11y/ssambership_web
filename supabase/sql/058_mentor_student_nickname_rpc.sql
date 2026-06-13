-- =============================================================================
-- P0: 멘토 맞춤의뢰 화면 — 의뢰자 닉네임/이름 표시용 RPC
--  • users SELECT RLS(users_select_own)는 본인만 → 멘토가 학생 users 직접 SELECT 불가.
--  • SECURITY DEFINER + custom_request_orders(mentor_id = auth.uid()) 연결 student_id 만 반환.
--  • 반환: id, nickname, full_name (이메일 등 미포함). 관계 없는 student_id 는 0행.
--  • 호출: authenticated 멘토. staging·운영 적용 전 SQL Editor에서 점검.
--  • **이미 Supabase 적용됨 — 기록용.**
-- =============================================================================

create or replace function public.get_mentor_student_nicknames(p_student_ids uuid[])
returns table (
  id uuid,
  nickname text,
  full_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    u.nickname,
    u.full_name
  from public.users u
  where p_student_ids is not null
    and array_length(p_student_ids, 1) is not null
    and u.id = any (p_student_ids)
    and (select auth.uid()) is not null
    and exists (
      select 1
      from public.custom_request_orders o
      where o.mentor_id = (select auth.uid())
        and o.student_id = u.id
    );
$$;

revoke all on function public.get_mentor_student_nicknames(uuid[]) from public;
grant execute on function public.get_mentor_student_nicknames(uuid[]) to authenticated;

comment on function public.get_mentor_student_nicknames(uuid[]) is
  'P0 멘토: 본인 맞춤의뢰 주문에 연결된 학생 id[] 에 대한 nickname·full_name(표시용).';
