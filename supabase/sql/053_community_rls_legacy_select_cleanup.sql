-- 053 community RLS cleanup (is_mentor 의존 제거, 안전/idempotent 버전)

drop policy if exists cp_select_own on public.community_posts;
create policy cp_select_own
  on public.community_posts
  for select
  using (
    author_id = (select auth.uid())
    or (select is_admin())
  );

drop policy if exists cp_select_all on public.community_posts;
drop policy if exists sp_select_all on public.shortform_posts;

-- shortform_posts: 미발행(draft) 숏폼 노출 차단 (community_posts와 동일 기준)
drop policy if exists "누구나 숏폼 읽기" on public.shortform_posts;
drop policy if exists sf_select_published on public.shortform_posts;
create policy sf_select_published
  on public.shortform_posts for select to anon, authenticated
  using (
    status = 'published'
    or author_id = (select auth.uid())
    or creator_id = (select auth.uid())
    or (select is_admin())
  );
