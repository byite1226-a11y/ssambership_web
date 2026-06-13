-- STEP 5: 질문방 채팅 파일/사진 첨부 — private Storage 버킷 + storage.objects RLS
-- 경로 규칙: `<mentor_student_room_id>/<thread_id>/<uuid>-<filename>` (첫 세그먼트 = room id)
-- 읽기/쓰기: 해당 room 의 학생·멘토 당사자만. 선행: 002_p0 (mentor_student_rooms)
-- idempotent

-- ---------------------------------------------------------------------------
-- 1) Storage bucket (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-room-attachments',
  'question-room-attachments',
  false,
  20971520,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = coalesce(excluded.file_size_limit, storage.buckets.file_size_limit),
  allowed_mime_types = coalesce(excluded.allowed_mime_types, storage.buckets.allowed_mime_types);

-- ---------------------------------------------------------------------------
-- 2) Path → room UUID(첫 세그먼트) + 당사자 권한
-- ---------------------------------------------------------------------------
create or replace function public.qra_room_uuid_from_path(p_name text)
returns uuid
language plpgsql
immutable
security definer
set search_path = public
as $f$
begin
  return nullif(split_part(p_name, '/', 1), '')::uuid;
exception
  when others then
    return null;
end;
$f$;

create or replace function public.user_is_room_party_for_qra_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $f$
  select exists (
    select 1
    from public.mentor_student_rooms r
    where r.id = public.qra_room_uuid_from_path(p_name)
      and (select auth.uid()) in (r.student_id, r.mentor_id)
  );
$f$;

-- storage.objects: 읽기·쓰기 모두 해당 room 의 당사자(학생/멘토)만
drop policy if exists "qra_storage_read_party" on storage.objects;
create policy "qra_storage_read_party"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'question-room-attachments'
    and public.user_is_room_party_for_qra_path(name)
  );

drop policy if exists "qra_storage_insert_party" on storage.objects;
create policy "qra_storage_insert_party"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'question-room-attachments'
    and public.user_is_room_party_for_qra_path(name)
  );

-- =============================================================================
-- 검증 (SQL Editor)
-- select * from storage.buckets where id = 'question-room-attachments';
-- select * from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'qra_%';
-- =============================================================================
