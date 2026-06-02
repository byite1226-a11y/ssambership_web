-- 053_community_rls_legacy_select_cleanup.sql
-- 004의 cp_select_all / sp_select_all(using true) 제거 후 037/038 published 정책만 유지
-- 선행: 037_p1_community_board_v2.sql, 038_p1_shortform_v2.sql

-- community_posts: 레거시 전체공개 select 제거
drop policy if exists "cp_select_all" on public.community_posts;

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

-- shortform_posts: 레거시 전체공개 select 제거
drop policy if exists "sp_select_all" on public.shortform_posts;

drop policy if exists "sf_select_published" on public.shortform_posts;
create policy "sf_select_published"
  on public.shortform_posts for select to anon, authenticated
  using (
    status = 'published'
    or author_id = (select auth.uid())
    or creator_id = (select auth.uid())
    or (select public.is_admin()) = true
  );

drop policy if exists "sf_insert_mentor" on public.shortform_posts;
create policy "sf_insert_mentor"
  on public.shortform_posts for insert to authenticated
  with check (
    (select public.is_mentor()) = true
    and (author_id = (select auth.uid()) or creator_id = (select auth.uid()))
  );

drop policy if exists "sf_update_own" on public.shortform_posts;
create policy "sf_update_own"
  on public.shortform_posts for update to authenticated
  using (author_id = (select auth.uid()) or creator_id = (select auth.uid()))
  with check (author_id = (select auth.uid()) or creator_id = (select auth.uid()));

drop policy if exists "sf_delete_own" on public.shortform_posts;
create policy "sf_delete_own"
  on public.shortform_posts for delete to authenticated
  using (author_id = (select auth.uid()) or creator_id = (select auth.uid()));
