-- 멘토 프로필 사진(아바타) — 컬럼 + Storage 버킷 + RLS
-- 선행: 001(users), mentor_profiles(가입 sync 시 생성)
-- 표시 1순위 키: lib/mentor/mentorDisplayFields.ts → photoUrl = profile_image_url
--
-- ⚠️ 운영 메모: 기존 민감 버킷(student-id-images, community-post-images 등)은
--    public = false + signed URL 패턴입니다. 프로필 사진은 멘토찾기/상세에서
--    누구에게나 공개되는 영구 이미지이므로, 저장한 URL이 만료되지 않도록
--    public = true 버킷 + getPublicUrl 영구 URL을 사용합니다(표시 코드 미터치 전제).
--    돈/기존 버킷/기존 RLS는 일절 건드리지 않습니다.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) mentor_profiles.profile_image_url 컬럼
--    (존재 여부 확인: 본 파일 헤더 주석의 점검 쿼리 또는 아래 add ... if not exists)
-- ---------------------------------------------------------------------------
alter table public.mentor_profiles
  add column if not exists profile_image_url text;

-- ---------------------------------------------------------------------------
-- 2) Storage — profile-avatars (public read, 영구 URL)
--    community-post-images 버킷 정의를 모델로 하되 public = true.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 공개 읽기(스토리지 API select 패리티 — public 버킷이라 CDN 경로는 RLS 무관)
drop policy if exists "pa_public_read" on storage.objects;
create policy "pa_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'profile-avatars');

-- 본인 폴더({user_id}/...)만 insert/update/delete
drop policy if exists "pa_auth_insert_own" on storage.objects;
create policy "pa_auth_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "pa_auth_update_own" on storage.objects;
create policy "pa_auth_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "pa_auth_delete_own" on storage.objects;
create policy "pa_auth_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
