-- 숏폼 v2: video_url, thumbnail, tags, status, counts, Storage bucket
-- 선행: 004(shortform_posts), 001(users)

create extension if not exists pgcrypto;

alter table public.shortform_posts
  add column if not exists creator_id uuid references public.users (id) on delete cascade,
  add column if not exists video_url text,
  add column if not exists thumbnail_url text,
  add column if not exists description text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists status text not null default 'published',
  add column if not exists view_count int not null default 0,
  add column if not exists like_count int not null default 0,
  add column if not exists updated_at timestamptz;

update public.shortform_posts
set creator_id = coalesce(creator_id, author_id)
where creator_id is null and author_id is not null;

alter table public.shortform_posts
  drop constraint if exists shortform_posts_status_chk;
alter table public.shortform_posts
  add constraint shortform_posts_status_chk
  check (status in ('draft', 'published', 'hidden'));

create index if not exists idx_sf_status_created on public.shortform_posts (status, created_at desc);
create index if not exists idx_sf_category_created on public.shortform_posts (category, created_at desc);

create or replace function public.increment_shortform_post_view(p_post_id uuid)
returns void language sql security definer set search_path = public as $f$
  update public.shortform_posts set view_count = view_count + 1
  where id = p_post_id and status = 'published';
$f$;
grant execute on function public.increment_shortform_post_view(uuid) to anon, authenticated;

-- 멘토만 insert (users.role = mentor)
create or replace function public.is_mentor()
returns boolean language sql stable security definer set search_path = public as $f$
  select coalesce((select u.role = 'mentor' from public.users u where u.id = auth.uid()), false);
$f$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shortform-videos',
  'shortform-videos',
  false,
  524288000,
  array['video/mp4', 'video/quicktime', 'video/webm']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shortform-thumbnails',
  'shortform-thumbnails',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set public = excluded.public;

drop policy if exists "sfv_public_read" on storage.objects;
create policy "sfv_public_read" on storage.objects for select to anon, authenticated
  using (bucket_id in ('shortform-videos', 'shortform-thumbnails'));

drop policy if exists "sfv_mentor_insert" on storage.objects;
create policy "sfv_mentor_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('shortform-videos', 'shortform-thumbnails')
    and (select public.is_mentor()) = true
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "sfv_mentor_delete_own" on storage.objects;
create policy "sfv_mentor_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id in ('shortform-videos', 'shortform-thumbnails')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "sf_select_published" on public.shortform_posts;
create policy "sf_select_published" on public.shortform_posts for select to anon, authenticated
  using (
    status = 'published'
    or author_id = (select auth.uid())
    or creator_id = (select auth.uid())
    or (select public.is_admin()) = true
  );

drop policy if exists "sf_insert_mentor" on public.shortform_posts;
create policy "sf_insert_mentor" on public.shortform_posts for insert to authenticated
  with check (
    (select public.is_mentor()) = true
    and (author_id = (select auth.uid()) or creator_id = (select auth.uid()))
  );

drop policy if exists "sf_update_own" on public.shortform_posts;
create policy "sf_update_own" on public.shortform_posts for update to authenticated
  using (author_id = (select auth.uid()) or creator_id = (select auth.uid()))
  with check (author_id = (select auth.uid()) or creator_id = (select auth.uid()));

drop policy if exists "sf_delete_own" on public.shortform_posts;
create policy "sf_delete_own" on public.shortform_posts for delete to authenticated
  using (author_id = (select auth.uid()) or creator_id = (select auth.uid()));
