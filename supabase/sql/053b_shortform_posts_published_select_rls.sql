-- 053b: shortform_posts 공개 SELECT RLS
-- 읽기 허용: published 글 / 작성자(author_id·creator_id) / 관리자.
-- 주의: 이 정책은 staging DB에 이미 적용됨. 이 파일은 레포 정본 완성/재구축용.
-- (drop if exists + create 라 idempotent: 재구축 시 안전하게 재적용됨)
-- 선행: 004 또는 038(shortform_posts·status), 003 등 is_admin()
-- 관련: 053_community_rls_legacy_select_cleanup.sql — community_posts 정리 + 동일 shortform 정책 인라인 포함

drop policy if exists sf_select_published on public.shortform_posts;

create policy sf_select_published
  on public.shortform_posts for select to anon, authenticated
  using (
    status = 'published'
    or author_id = (select auth.uid())
    or creator_id = (select auth.uid())
    or (select is_admin())
  );
