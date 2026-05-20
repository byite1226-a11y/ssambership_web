-- 커뮤니티 게시판 v2: community_posts 확장, comments(2depth), post_reactions, community_hashtags, 이미지 Storage
-- 선행: 001(users), 004(community_posts), 016(community_comments — 숏폼·레거시)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) community_posts 확장
-- ---------------------------------------------------------------------------
alter table public.community_posts
  add column if not exists content text,
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists hashtags text[] not null default '{}',
  add column if not exists view_count int not null default 0,
  add column if not exists like_count int not null default 0,
  add column if not exists comment_count int not null default 0,
  add column if not exists status text not null default 'published',
  add column if not exists author_label text,
  add column if not exists updated_at timestamptz;

update public.community_posts
set content = coalesce(nullif(trim(content), ''), nullif(trim(body), ''))
where content is null or trim(content) = '';

alter table public.community_posts
  drop constraint if exists community_posts_status_chk;
alter table public.community_posts
  add constraint community_posts_status_chk
  check (status in ('draft', 'published', 'hidden'));

create index if not exists idx_cp_status_created
  on public.community_posts (status, created_at desc);
create index if not exists idx_cp_category_created
  on public.community_posts (category, created_at desc);

-- ---------------------------------------------------------------------------
-- 2) comments (게시판 전용, 최대 2depth)
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  content text not null,
  like_count int not null default 0,
  is_deleted boolean not null default false,
  author_label text not null default '쌤버십 회원',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_content_len_chk check (char_length(trim(content)) between 1 and 2000)
);

create index if not exists idx_comments_post_created
  on public.comments (post_id, created_at asc);
create index if not exists idx_comments_parent
  on public.comments (parent_id);

-- ---------------------------------------------------------------------------
-- 3) post_reactions (좋아요 / 스크랩)
-- ---------------------------------------------------------------------------
create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  post_id uuid not null references public.community_posts (id) on delete cascade,
  type text not null check (type in ('like', 'scrap')),
  created_at timestamptz not null default now(),
  unique (user_id, post_id, type)
);

create index if not exists idx_post_reactions_post
  on public.post_reactions (post_id, type);

-- ---------------------------------------------------------------------------
-- 4) community_hashtags
-- ---------------------------------------------------------------------------
create table if not exists public.community_hashtags (
  tag text primary key,
  count int not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5) 트리거·함수
-- ---------------------------------------------------------------------------
create or replace function public.community_sync_hashtags()
returns trigger
language plpgsql
security definer
set search_path = public
as $f$
declare
  t text;
  old_tags text[];
  new_tags text[];
begin
  old_tags := coalesce(
    case when tg_op = 'UPDATE' then old.hashtags else '{}'::text[] end,
    '{}'::text[]
  );
  new_tags := coalesce(new.hashtags, '{}'::text[]);

  if tg_op = 'DELETE' then
    foreach t in array old_tags loop
      update public.community_hashtags set count = greatest(count - 1, 0), updated_at = now() where tag = t;
    end loop;
    return old;
  end if;

  foreach t in array old_tags loop
    if not (t = any (new_tags)) then
      update public.community_hashtags set count = greatest(count - 1, 0), updated_at = now() where tag = t;
    end if;
  end loop;

  foreach t in array new_tags loop
    if not (t = any (old_tags)) then
      insert into public.community_hashtags (tag, count) values (t, 1)
      on conflict (tag) do update set count = community_hashtags.count + 1, updated_at = now();
    end if;
  end loop;
  return new;
end;
$f$;

drop trigger if exists trg_cp_sync_hashtags on public.community_posts;
create trigger trg_cp_sync_hashtags
  after insert or update of hashtags or delete on public.community_posts
  for each row execute function public.community_sync_hashtags();

create or replace function public.community_refresh_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $f$
declare
  pid uuid;
begin
  pid := coalesce(new.post_id, old.post_id);
  update public.community_posts p
  set comment_count = (
    select count(*)::int from public.comments c
    where c.post_id = pid and c.is_deleted = false
  )
  where p.id = pid;
  return coalesce(new, old);
end;
$f$;

drop trigger if exists trg_comments_refresh_count on public.comments;
create trigger trg_comments_refresh_count
  after insert or update of is_deleted or delete on public.comments
  for each row execute function public.community_refresh_post_comment_count();

create or replace function public.increment_community_post_view(p_post_id uuid)
returns void
language sql
security definer
set search_path = public
as $f$
  update public.community_posts
  set view_count = view_count + 1
  where id = p_post_id and status = 'published';
$f$;

grant execute on function public.increment_community_post_view(uuid) to anon, authenticated;

create or replace function public.community_refresh_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $f$
declare
  pid uuid;
begin
  pid := coalesce(new.post_id, old.post_id);
  update public.community_posts p
  set like_count = (
    select count(*)::int from public.post_reactions r
    where r.post_id = pid and r.type = 'like'
  )
  where p.id = pid;
  return coalesce(new, old);
end;
$f$;

drop trigger if exists trg_post_reactions_like_count on public.post_reactions;
create trigger trg_post_reactions_like_count
  after insert or delete on public.post_reactions
  for each row execute function public.community_refresh_post_like_count();

-- ---------------------------------------------------------------------------
-- 6) Storage — community-post-images (public read)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-post-images',
  'community-post-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cpi_public_read" on storage.objects;
create policy "cpi_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'community-post-images');

drop policy if exists "cpi_auth_insert_own" on storage.objects;
create policy "cpi_auth_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'community-post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "cpi_auth_update_own" on storage.objects;
create policy "cpi_auth_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'community-post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "cpi_auth_delete_own" on storage.objects;
create policy "cpi_auth_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'community-post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- 7) RLS — comments
-- ---------------------------------------------------------------------------
alter table public.comments enable row level security;

drop policy if exists "comments_select_visible" on public.comments;
create policy "comments_select_visible"
  on public.comments for select to anon, authenticated
  using (is_deleted = false);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own"
  on public.comments for insert to authenticated
  with check (author_id = (select auth.uid()));

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own"
  on public.comments for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
  on public.comments for delete to authenticated
  using (author_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 8) RLS — post_reactions
-- ---------------------------------------------------------------------------
alter table public.post_reactions enable row level security;

drop policy if exists "post_reactions_select_all" on public.post_reactions;
create policy "post_reactions_select_all"
  on public.post_reactions for select to anon, authenticated
  using (true);

drop policy if exists "post_reactions_insert_own" on public.post_reactions;
create policy "post_reactions_insert_own"
  on public.post_reactions for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "post_reactions_delete_own" on public.post_reactions;
create policy "post_reactions_delete_own"
  on public.post_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 9) RLS — community_hashtags (읽기 공개)
-- ---------------------------------------------------------------------------
alter table public.community_hashtags enable row level security;

drop policy if exists "community_hashtags_select_all" on public.community_hashtags;
create policy "community_hashtags_select_all"
  on public.community_hashtags for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 10) community_posts RLS 보강 (published/draft)
-- ---------------------------------------------------------------------------
drop policy if exists "cp_select_published" on public.community_posts;
create policy "cp_select_published"
  on public.community_posts for select to anon, authenticated
  using (
    status = 'published'
    or author_id = (select auth.uid())
    or (select public.is_admin()) = true
  );

drop policy if exists "cp_update_own" on public.community_posts;
create policy "cp_update_own"
  on public.community_posts for update to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()) = true)
  with check (author_id = (select auth.uid()) or (select public.is_admin()) = true);

drop policy if exists "cp_delete_own" on public.community_posts;
create policy "cp_delete_own"
  on public.community_posts for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()) = true);
