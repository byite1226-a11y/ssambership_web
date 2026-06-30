-- =============================================================================
-- 101_community_comments_admin_moderation.sql
--
-- Purpose: community_comments 모더레이션 활성화 — 현재 UPDATE/DELETE RLS 정책
--   자체가 없어 admin도 댓글을 hidden 으로 바꾸거나 삭제할 수 없음.
--
-- Changes (RLS only):
--   1) community_comments_update_admin (UPDATE) — admin 만 통과
--   2) community_comments_delete_admin (DELETE) — admin 만 통과
--   3) SELECT 정책 교체 — 기존 'community_comments_select_visible'(visible 만)
--      을 작성자 본인 + admin도 볼 수 있게 확장(작성자 본인 댓글 hidden 후
--      자기 댓글 회수·검토 가능).
--
-- Safety:
--   - 컬럼·테이블 스키마 변경 없음. RLS 정책만 추가/교체.
--   - DML/Trigger/Index 미변경.
--   - is_admin() (SECURITY DEFINER 함수) 는 기존 활성 정책(community_posts /
--     shortform_posts) 와 동일 패턴.
--
-- Apply (로컬):
--   psql -f supabase/sql/101_community_comments_admin_moderation.sql
--
-- Verify:
--   select polname from pg_policies where tablename='community_comments';
--   -- expect: community_comments_insert_authenticated,
--   --          community_comments_select_visible,
--   --          community_comments_update_admin,
--   --          community_comments_delete_admin
--
-- Rollback:
--   drop policy if exists "community_comments_update_admin" on public.community_comments;
--   drop policy if exists "community_comments_delete_admin" on public.community_comments;
--   drop policy if exists "community_comments_select_visible" on public.community_comments;
--   create policy "community_comments_select_visible" on public.community_comments
--     for select to anon, authenticated using (status = 'visible');
-- =============================================================================

begin;

-- SELECT 정책 교체 — visible 댓글 누구나 / 본인 댓글 + admin 은 hidden 도 조회
drop policy if exists "community_comments_select_visible" on public.community_comments;
create policy "community_comments_select_visible"
  on public.community_comments
  for select
  to anon, authenticated
  using (
    status = 'visible'
    or author_id = (select auth.uid())
    or (select public.is_admin()) = true
  );

-- UPDATE 정책 — admin 전용(작성자 본인 수정은 별도 정책이 없으면 보존하지
-- 않음. 현 스키마는 댓글 수정 UI 없음, 추후 author update 정책 필요 시 별도 추가).
drop policy if exists "community_comments_update_admin" on public.community_comments;
create policy "community_comments_update_admin"
  on public.community_comments
  for update
  to authenticated
  using ((select public.is_admin()) = true)
  with check ((select public.is_admin()) = true);

-- DELETE 정책 — admin 전용
drop policy if exists "community_comments_delete_admin" on public.community_comments;
create policy "community_comments_delete_admin"
  on public.community_comments
  for delete
  to authenticated
  using ((select public.is_admin()) = true);

comment on policy "community_comments_select_visible" on public.community_comments is
  'community_comments: visible 댓글은 누구나 / 본인 댓글 또는 admin 은 hidden 도 조회';
comment on policy "community_comments_update_admin" on public.community_comments is
  'community_comments: admin 만 status 등 변경(모더레이션) 가능';
comment on policy "community_comments_delete_admin" on public.community_comments is
  'community_comments: admin 만 행 삭제 가능';

commit;
