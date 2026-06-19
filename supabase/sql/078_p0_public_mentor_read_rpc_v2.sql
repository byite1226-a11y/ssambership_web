-- 078_p0_public_mentor_read_rpc_v2.sql
-- P0: Replace public mentor read RPCs with whitelist-only v2 functions.
-- Run manually in Supabase SQL Editor.

begin;

-- Public mentor directory: safe user fields only.
create or replace function public.mentor_directory_list_v2(p_limit int default 80)
returns table (
  id uuid,
  role text,
  status text,
  full_name text,
  nickname text,
  created_at timestamptz
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
    u.created_at
  from public.users u
  where u.role = 'mentor'
  order by u.created_at desc
  limit greatest(1, least(coalesce(p_limit, 80), 200));
$$;

-- Public single mentor user row: safe user fields only.
create or replace function public.mentor_user_public_v2(p_mentor_id uuid)
returns table (
  id uuid,
  role text,
  status text,
  full_name text,
  nickname text,
  created_at timestamptz
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
    u.created_at
  from public.users u
  where u.id = p_mentor_id
    and u.role = 'mentor'
  limit 1;
$$;

-- Public mentor profiles: safe profile fields plus approved school verification display fields.
create or replace function public.mentor_profiles_for_directory_v2(p_ids uuid[])
returns table (
  user_id uuid,
  university_name text,
  department_name text,
  teaching_subjects text[],
  intro_line text,
  verification_status text,
  created_at timestamptz,
  verified_university_name text,
  verified_department_name text,
  verified_major_category text,
  school_tier text,
  school_verified boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mp.user_id,
    mp.university_name,
    mp.department_name,
    mp.teaching_subjects,
    mp.intro_line,
    mp.verification_status,
    mp.created_at,
    sv.verified_university_name,
    sv.verified_department_name,
    sv.verified_major_category,
    sv.school_tier,
    (sv.mentor_id is not null) as school_verified
  from public.mentor_profiles mp
  left join lateral (
    select
      msv.mentor_id,
      msv.verified_university_name,
      msv.verified_department_name,
      msv.verified_major_category,
      msv.school_tier
    from public.mentor_school_verifications msv
    where msv.mentor_id = mp.user_id
      and msv.status = 'approved'
    order by coalesce(msv.reviewed_at, msv.updated_at, msv.created_at) desc, msv.created_at desc
    limit 1
  ) sv on true
  where p_ids is not null
    and array_length(p_ids, 1) is not null
    and mp.user_id = any (p_ids);
$$;

revoke all on function public.mentor_directory_list_v2(int) from public;
revoke all on function public.mentor_user_public_v2(uuid) from public;
revoke all on function public.mentor_profiles_for_directory_v2(uuid[]) from public;

grant execute on function public.mentor_directory_list_v2(int) to anon, authenticated;
grant execute on function public.mentor_user_public_v2(uuid) to anon, authenticated;
grant execute on function public.mentor_profiles_for_directory_v2(uuid[]) to anon, authenticated;

-- Stop direct anon/authenticated access to the old over-broad public RPCs.
-- Do not drop them here; revoking execute avoids breaking hidden dependencies more abruptly.
revoke execute on function public.mentor_directory_list(int) from anon, authenticated;
revoke execute on function public.mentor_user_public(uuid) from anon, authenticated;
revoke execute on function public.mentor_profiles_for_directory(uuid[]) from anon, authenticated;
revoke all on function public.mentor_directory_list(int) from public;
revoke all on function public.mentor_user_public(uuid) from public;
revoke all on function public.mentor_profiles_for_directory(uuid[]) from public;

comment on function public.mentor_directory_list_v2(int) is 'P0 public mentor directory whitelist. Excludes PII, consent metadata, payout data, and document paths.';
comment on function public.mentor_user_public_v2(uuid) is 'P0 public single mentor user whitelist. Excludes PII, consent metadata, payout data, and document paths.';
comment on function public.mentor_profiles_for_directory_v2(uuid[]) is 'P0 public mentor profile whitelist plus approved school verification display fields only.';

commit;
