-- =============================================================================
-- 082_community_shortform_likes.sql
-- Purpose: Add per-user like storage for shortform posts and keep
--          shortform_posts.like_count in sync.
--
-- Safety:
--   - Does not edit existing community/shortform tables except updating
--     shortform_posts.like_count through a trigger.
--   - RLS is narrow: authenticated users can read/insert/delete only their own
--     shortform reaction rows. Public count is exposed through
--     shortform_posts.like_count.
--   - No payment/escrow/auth-verification objects touched.
-- =============================================================================

begin;

create extension if not exists pgcrypto;

create table if not exists public.shortform_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  shortform_id uuid not null references public.shortform_posts (id) on delete cascade,
  type text not null default 'like' check (type in ('like')),
  created_at timestamptz not null default now(),
  unique (user_id, shortform_id, type)
);

create index if not exists idx_shortform_reactions_shortform
  on public.shortform_reactions (shortform_id, type);

create index if not exists idx_shortform_reactions_user
  on public.shortform_reactions (user_id, created_at desc);

create or replace function public.community_refresh_shortform_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  pid uuid;
begin
  pid := coalesce(new.shortform_id, old.shortform_id);

  update public.shortform_posts p
  set like_count = (
    select count(*)::int
    from public.shortform_reactions r
    where r.shortform_id = pid
      and r.type = 'like'
  )
  where p.id = pid;

  return coalesce(new, old);
end;
$function$;

drop trigger if exists trg_shortform_reactions_like_count on public.shortform_reactions;
create trigger trg_shortform_reactions_like_count
  after insert or delete on public.shortform_reactions
  for each row execute function public.community_refresh_shortform_like_count();

alter table public.shortform_reactions enable row level security;

drop policy if exists "shortform_reactions_select_own" on public.shortform_reactions;
create policy "shortform_reactions_select_own"
  on public.shortform_reactions for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "shortform_reactions_insert_own" on public.shortform_reactions;
create policy "shortform_reactions_insert_own"
  on public.shortform_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and type = 'like'
  );

drop policy if exists "shortform_reactions_delete_own" on public.shortform_reactions;
create policy "shortform_reactions_delete_own"
  on public.shortform_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.shortform_reactions to authenticated;

commit;
