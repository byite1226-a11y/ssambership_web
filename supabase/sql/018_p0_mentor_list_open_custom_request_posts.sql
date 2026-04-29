-- P0: Mentor/admin browse list for open custom request posts.
-- custom_request_posts is protected by RLS, so mentors cannot directly SELECT the open request list.
-- This SECURITY DEFINER RPC exposes only the fields needed for the mentor browse/list UI.
-- Idempotent: create or replace.
-- Run after the existing 006 browse RPC in the Supabase SQL Editor.
create or replace function public.list_open_custom_request_posts_for_mentor_browse(p_limit int default 50)
returns table (
  id uuid,
  title text,
  body text,
  content text,
  subject text,
  description text,
  goal text,
  subcategory text,
  category text,
  due_at timestamptz,
  deadline timestamptz,
  due_date timestamptz,
  deliverable_type text,
  deliverable_format text,
  result_format text,
  output_format text,
  budget_min numeric,
  budget_max numeric,
  state text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $fn$
  select
    p.id,
    p.title,
    p.body,
    p.content,
    p.subject,
    p.description,
    p.goal,
    p.subcategory,
    p.category,
    p.due_at,
    p.deadline,
    p.due_date,
    p.deliverable_type,
    p.deliverable_format,
    p.result_format,
    p.output_format,
    p.budget_min,
    p.budget_max,
    p.state,
    p.status,
    p.created_at,
    p.updated_at
  from public.custom_request_posts p
  where (select auth.uid()) is not null
    and (
      (select public.is_admin()) = true
      or (
        exists (
          select 1
          from public.users u
          where u.id = (select auth.uid())
            and u.role = 'mentor'
        )
        and (
          lower(trim(coalesce(p.status, ''))) = 'open'
          or lower(trim(coalesce(p.state, ''))) in ('open', 'published')
        )
      )
    )
  order by p.created_at desc
  limit least(coalesce(nullif(p_limit, 0), 50), 200);
$fn$;

revoke all on function public.list_open_custom_request_posts_for_mentor_browse(int) from public;
grant execute on function public.list_open_custom_request_posts_for_mentor_browse(int) to authenticated;

comment on function public.list_open_custom_request_posts_for_mentor_browse(int) is
  'P0: Mentor/admin browse list for open custom request posts. Used because direct SELECT on custom_request_posts is restricted by RLS.';

