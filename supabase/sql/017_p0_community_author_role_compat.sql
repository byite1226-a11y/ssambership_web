-- P0: community_posts / shortform_posts — author_role (앱 insert와 스키마 정렬)
-- idempotent, staging(컬럼 부족) / 로컬 초안(004) 모두에 적용 가능
-- Supabase: SQL Editor에서 실행

-- ---------------------------------------------------------------------------
-- public.community_posts
-- ---------------------------------------------------------------------------
alter table public.community_posts
  add column if not exists author_role text default 'mentor';

update public.community_posts
set author_role = 'mentor'
where author_role is null;

alter table public.community_posts
  alter column author_role set default 'mentor';

do $do$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_posts_author_role_chk'
      and conrelid = 'public.community_posts'::regclass
  ) then
    alter table public.community_posts
      add constraint community_posts_author_role_chk
      check (author_role in ('mentor', 'student', 'admin', 'user'));
  end if;
end
$do$;

-- ---------------------------------------------------------------------------
-- public.shortform_posts
-- ---------------------------------------------------------------------------
alter table public.shortform_posts
  add column if not exists author_role text default 'mentor';

update public.shortform_posts
set author_role = 'mentor'
where author_role is null;

alter table public.shortform_posts
  alter column author_role set default 'mentor';

do $do$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shortform_posts_author_role_chk'
      and conrelid = 'public.shortform_posts'::regclass
  ) then
    alter table public.shortform_posts
      add constraint shortform_posts_author_role_chk
      check (author_role in ('mentor', 'student', 'admin', 'user'));
  end if;
end
$do$;

-- ---------------------------------------------------------------------------
-- 확인용 (Supabase SQL Editor; 주석)
-- select id, author_id, author_role, title, left(body, 30) as body_excerpt, category, created_at
--   from public.community_posts
--  order by created_at desc
--  limit 5;
-- select id, author_id, author_role, title, left(body, 30) as body_excerpt, category, source, created_at
--   from public.shortform_posts
--  order by created_at desc
--  limit 5;
