-- =============================================================================
-- P0: 공개 멘토 목록/상세를 위한 읽기 RPC (001 users·mentor_profiles RLS “본인만” 보완)
--  • application layer가 직접 public.users 전체 row(이메일 등)를 공개 SELECT 하지 않도록
--    SECURITY DEFINER + 컬럼 제한(이메일 제외)으로 expose.
--  • **staging·운영** 적용 전 service_role / SQL Editor에서 점검. 운영은 이메일·정책·감사에 맞게 조정.
--  • 장기: 읽기 전용 VIEW + 최소 열, 또는 service_role BFF only.
-- =============================================================================

-- 멘토 목록: 이메일 제외(노출 최소)
create or replace function public.mentor_directory_list(p_limit int default 80)
returns table (
  id uuid,
  role text,
  status text,
  full_name text,
  nickname text,
  grade_level text,
  student_status text,
  birth_date date,
  terms_agreed_at timestamptz,
  privacy_agreed_at timestamptz,
  marketing_agreed boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    u.role,
    u.status,
    u.full_name,
    u.nickname,
    u.grade_level,
    u.student_status,
    u.birth_date,
    u.terms_agreed_at,
    u.privacy_agreed_at,
    u.marketing_agreed,
    u.created_at,
    u.updated_at
  from public.users u
  where u.role = 'mentor'
  order by u.created_at desc
  limit greatest(1, least(p_limit, 200));
$$;

-- 멘토 1인 공개(상세/구독) — role=mentor 가 아니면 0행
create or replace function public.mentor_user_public(p_mentor_id uuid)
returns table (
  id uuid,
  role text,
  status text,
  full_name text,
  nickname text,
  grade_level text,
  student_status text,
  birth_date date,
  terms_agreed_at timestamptz,
  privacy_agreed_at timestamptz,
  marketing_agreed boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    u.role,
    u.status,
    u.full_name,
    u.nickname,
    u.grade_level,
    u.student_status,
    u.birth_date,
    u.terms_agreed_at,
    u.privacy_agreed_at,
    u.marketing_agreed,
    u.created_at,
    u.updated_at
  from public.users u
  where u.id = p_mentor_id
    and u.role = 'mentor'
  limit 1;
$$;

-- 멘토 프로필 배치(목록·상세) — RLS “본인만” 보완
create or replace function public.mentor_profiles_for_directory(p_ids uuid[])
returns setof public.mentor_profiles
language sql
stable
security definer
set search_path = public
as $$
  select mp.*
  from public.mentor_profiles mp
  where p_ids is not null
    and array_length(p_ids, 1) is not null
    and mp.user_id = any (p_ids);
$$;

revoke all on function public.mentor_directory_list(int) from public;
revoke all on function public.mentor_user_public(uuid) from public;
revoke all on function public.mentor_profiles_for_directory(uuid[]) from public;

grant execute on function public.mentor_directory_list(int) to anon, authenticated;
grant execute on function public.mentor_user_public(uuid) to anon, authenticated;
grant execute on function public.mentor_profiles_for_directory(uuid[]) to anon, authenticated;

comment on function public.mentor_directory_list is 'P0 멘토 디렉터리(이메일 제외). 001 RLS로 목록이 비는 문제를 해결.';
comment on function public.mentor_user_public is 'P0 멘토 1인 공개 프로필용 users 행(이메일 제외).';
comment on function public.mentor_profiles_for_directory is 'P0 멘토 user_id[] 에 대한 mentor_profiles.';
