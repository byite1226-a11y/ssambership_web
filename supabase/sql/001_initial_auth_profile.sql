-- Supabase SQL Editor에 붙여넣어 한 번에 실행하세요. (필요 시 팀에서 마이그레이션으로 옮깁니다.)
-- TODO: 멘토 verification_status 심사(관리자 콘솔), 관리자 승인 플로우, student-id-images bucket은 대시보드에서 생성·정책 점검
-- TODO: 향후 role별 dashboard redirect는 앱의 getPostLoginPath와 맞출 것

-- Extensions
create extension if not exists "pgcrypto";

-- updated_at touch
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) public.users
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('student', 'mentor', 'admin')),
  status text not null default 'active',
  full_name text,
  nickname text,
  email text,
  grade_level text,
  student_status text,
  birth_date date,
  terms_agreed_at timestamptz,
  privacy_agreed_at timestamptz,
  marketing_agreed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

drop trigger if exists trg_users_set_updated on public.users;
create trigger trg_users_set_updated
  before update on public.users
  for each row execute function public.set_updated_at();

-- 2) public.mentor_profiles
create table if not exists public.mentor_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  university_name text not null,
  department_name text not null,
  teaching_subjects text[] not null default '{}',
  high_school_name text not null,
  intro_line text,
  verification_status text not null default 'pending',
  student_id_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_mentor_profiles_set_updated on public.mentor_profiles;
create trigger trg_mentor_profiles_set_updated
  before update on public.mentor_profiles
  for each row execute function public.set_updated_at();

-- 3) public.verification_logs
create table if not exists public.verification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  log_type text not null,
  status text not null,
  memo text,
  created_at timestamptz not null default now()
);

create index if not exists verification_logs_user_id_idx on public.verification_logs (user_id);

-- --------------------------------------------------------------------------
-- auth.users 가입 시 user_metadata( raw_user_meta_data )로 public.users / mentor / log 자동 반영
-- signUp options.data 키: app_role, full_name, nickname, grade_level, student_status, birth_date(YYYY-MM-DD),
--   university_name, department_name, teaching_subjects_csv(콤마구분), high_school_name, intro_line,
--   terms_agreed, privacy_agreed, marketing_agreed (text 'true'/'false')
-- --------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m jsonb;
  r text;
  subj text[];
  subj_str text;
  bdate date;
begin
  m := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  r := lower(trim(m->>'app_role'));
  if r is null or r = '' then
    r := 'student';
  end if;
  if r not in ('student', 'mentor', 'admin') then
    r := 'student';
  end if;

  subj_str := nullif(trim(m->>'teaching_subjects_csv'), '');
  if subj_str is not null then
    subj := array(
      select trim(both ' ' from x)
      from unnest(string_to_array(subj_str, ',')) as x
      where length(trim(both ' ' from x)) > 0
    );
  else
    subj := '{}';
  end if;

  begin
    bdate := (m->>'birth_date')::date;
  exception when others then
    bdate := null;
  end;

  insert into public.users (
    id, role, status, full_name, nickname, email,
    grade_level, student_status, birth_date,
    terms_agreed_at, privacy_agreed_at, marketing_agreed, updated_at
  ) values (
    NEW.id, r, 'active',
    nullif(trim(m->>'full_name'), ''),
    nullif(trim(m->>'nickname'), ''),
    coalesce(NEW.email, ''),
    nullif(trim(m->>'grade_level'), ''),
    nullif(trim(m->>'student_status'), ''),
    bdate,
    case when (m->>'terms_agreed') = 'true' then now() else null end,
    case when (m->>'privacy_agreed') = 'true' then now() else null end,
    case when (m->>'marketing_agreed') = 'true' then true else false end,
    now()
  )
  on conflict (id) do update set
    role = excluded.role,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    nickname = coalesce(excluded.nickname, public.users.nickname),
    email = excluded.email,
    grade_level = coalesce(excluded.grade_level, public.users.grade_level),
    student_status = coalesce(excluded.student_status, public.users.student_status),
    birth_date = coalesce(excluded.birth_date, public.users.birth_date),
    terms_agreed_at = coalesce(excluded.terms_agreed_at, public.users.terms_agreed_at),
    privacy_agreed_at = coalesce(excluded.privacy_agreed_at, public.users.privacy_agreed_at),
    marketing_agreed = excluded.marketing_agreed,
    updated_at = now();

  if r = 'mentor' then
    insert into public.mentor_profiles (
      user_id, university_name, department_name, teaching_subjects, high_school_name, intro_line,
      verification_status, student_id_image_url, updated_at
    ) values (
      NEW.id,
      coalesce(nullif(trim(m->>'university_name'), ''), '(미입력)'),
      coalesce(nullif(trim(m->>'department_name'), ''), '(미입력)'),
      coalesce(subj, '{}'),
      coalesce(nullif(trim(m->>'high_school_name'), ''), '(미입력)'),
      nullif(trim(m->>'intro_line'), ''),
      'pending',
      null,
      now()
    )
    on conflict (user_id) do update set
      university_name = excluded.university_name,
      department_name = excluded.department_name,
      teaching_subjects = excluded.teaching_subjects,
      high_school_name = excluded.high_school_name,
      intro_line = coalesce(excluded.intro_line, public.mentor_profiles.intro_line),
      updated_at = now();

    insert into public.verification_logs (user_id, log_type, status, memo) values
      (NEW.id, 'mentor_verification', 'pending', 'sign-up');
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.mentor_profiles enable row level security;
alter table public.verification_logs enable row level security;

-- users: 본인만 select/insert/update
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- mentor_profiles: 본인만 select/insert/update
drop policy if exists "mentor_select_own" on public.mentor_profiles;
create policy "mentor_select_own" on public.mentor_profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "mentor_insert_own" on public.mentor_profiles;
create policy "mentor_insert_own" on public.mentor_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "mentor_update_own" on public.mentor_profiles;
create policy "mentor_update_own" on public.mentor_profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- verification_logs: 일반 유저 select 불가(관리자·서비스롤은 RLS bypass). insert는 본인 로그 남기기(가입/재시도) 용
drop policy if exists "ver_logs_insert_own" on public.verification_logs;
create policy "ver_logs_insert_own" on public.verification_logs
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- 관리자 전용 select 예시(관리자 역할/테이블 생기기 전엔 service_role로만 SQL Editor에서 조회)
-- create policy "ver_logs_admin_select" on public.verification_logs
--   for select to authenticated
--   using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- --------------------------------------------------------------------------
-- Storage: bucket student-id-images (비공개 권장). bucket은 UI에서도 생성 가능. 중복 실행은 무시.
-- TODO: production에서 bucket 정책·CORS·객체 수명 점검
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('student-id-images', 'student-id-images', false)
  on conflict (id) do update set public = excluded.public;

-- 인증된 사용자: 객체 경로가 `{auth.uid()}/...`일 때만 접근(첫 path segment = uid)
drop policy if exists "student_id_images_select_own" on storage.objects;
create policy "student_id_images_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'student-id-images'
    and split_part (name, '/', 1) = (select auth.uid()::text)
  );

drop policy if exists "student_id_images_insert_own" on storage.objects;
create policy "student_id_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'student-id-images'
    and split_part (name, '/', 1) = (select auth.uid()::text)
  );

drop policy if exists "student_id_images_update_own" on storage.objects;
create policy "student_id_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'student-id-images'
    and split_part (name, '/', 1) = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'student-id-images'
    and split_part (name, '/', 1) = (select auth.uid()::text)
  );

drop policy if exists "student_id_images_delete_own" on storage.objects;
create policy "student_id_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'student-id-images'
    and split_part (name, '/', 1) = (select auth.uid()::text)
  );

-- anon 은 storage 접근 없음(기본)

comment on table public.users is '앱 프로필. auth 가입 직후 트리거로 1줄 동기화 + 세션 있을 시 클라이언트 upsert';
comment on table public.mentor_profiles is '멘토 전용 프로필. TODO: verification_status 심사';
comment on table public.verification_logs is '인증/심사 로그. select는 관리자(미구현) 또는 service_role.';
