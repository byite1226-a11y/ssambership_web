-- --------------------------------------------------------------------------
-- Storage 버킷 비공개 점검 (쌤버십 필수 3종 + 미디어 버킷)
-- 실행 후: SELECT id, name, public FROM storage.buckets ORDER BY id;
-- --------------------------------------------------------------------------

-- 필수 비공개 (개인정보·납품·의뢰 첨부)
insert into storage.buckets (id, name, public)
values ('student-id-images', 'student-id-images', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('custom-order-deliverables', 'custom-order-deliverables', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('custom-request-post-attachments', 'custom-request-post-attachments', false)
on conflict (id) do update set public = false;

-- 커뮤니티·숏폼 미디어 (RLS + signed URL 사용)
update storage.buckets set public = false where id in (
  'community-post-images',
  'shortform-videos',
  'shortform-thumbnails'
);

-- 점검 쿼리 (Supabase SQL Editor에서 실행)
-- SELECT id, name, public FROM storage.buckets ORDER BY id;
