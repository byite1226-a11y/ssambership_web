-- P0: 멘토 지원서 포트폴리오 첨부 — private Storage + custom_request_application_attachments + storage.objects RLS
-- 선행: 001( users ), 003( custom_request_posts / custom_request_applications ), is_admin()
-- 012( post 첨부 )와 버킷/정책명 분리. RLS 주의: post는 mentor 전원 read — 본 테이블은 **지원 멘토 본인 + post 작성 학생 + admin** 만 read.
-- idempotent

-- ---------------------------------------------------------------------------
-- 1) custom_request_application_attachments
-- ---------------------------------------------------------------------------
create table if not exists public.custom_request_application_attachments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.custom_request_applications (id) on delete cascade,
  uploaded_by uuid not null references public.users (id) on delete restrict,
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  file_size_bytes bigint,
  created_at timestamptz not null default now()
);

comment on table public.custom_request_application_attachments is
  '멘토 지원서 제출 시 올린 포트폴리오/참고 파일 메타. storage_path 는 ASCII 키(버킷 내부), 표시명은 original_filename.';

create index if not exists idx_craa_application_created
  on public.custom_request_application_attachments (application_id, created_at asc);

alter table public.custom_request_application_attachments enable row level security;

-- ---------------------------------------------------------------------------
-- 2) Helper — application → post 작성자(학생) 확인 (012 post 작성자 동의어)
-- ---------------------------------------------------------------------------
create or replace function public.user_is_post_author_for_craa_application(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $f$
  select exists (
    select 1
    from public.custom_request_applications a
    join public.custom_request_posts p on p.id = a.post_id
    where a.id = p_application_id
      and (
        p.author_id = (select auth.uid())
        or p.student_id = (select auth.uid())
        or p.user_id = (select auth.uid())
        or p.requester_id = (select auth.uid())
        or p.client_id = (select auth.uid())
      )
  );
$f$;

create or replace function public.user_is_application_mentor_for_craa_application(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $f$
  select exists (
    select 1
    from public.custom_request_applications a
    where a.id = p_application_id
      and a.mentor_id = (select auth.uid())
  );
$f$;

-- ---------------------------------------------------------------------------
-- 3) 테이블 RLS — INSERT: 지원 멘토 본인 / SELECT: 멘토 본인 · post 작성 학생 · admin (mentor 전원 read 금지)
-- ---------------------------------------------------------------------------
drop policy if exists "craa_insert_mentor" on public.custom_request_application_attachments;
create policy "craa_insert_mentor"
  on public.custom_request_application_attachments
  for insert
  to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and public.user_is_application_mentor_for_craa_application(application_id) = true
  );

drop policy if exists "craa_select_authorized" on public.custom_request_application_attachments;
create policy "craa_select_authorized"
  on public.custom_request_application_attachments
  for select
  to authenticated
  using (
    (select public.is_admin()) = true
    or public.user_is_application_mentor_for_craa_application(application_id) = true
    or public.user_is_post_author_for_craa_application(application_id) = true
  );

-- ---------------------------------------------------------------------------
-- 4) Storage bucket (private) — 012와 동일 20MB / MIME
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'custom-request-application-attachments',
  'custom-request-application-attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
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
-- 5) Path → application UUID(첫 세그먼트) + storage.objects RLS
--    경로: {applicationId}/{timestamp}-{8hex}.{ext}
-- ---------------------------------------------------------------------------
create or replace function public.craa_application_uuid_from_path(p_name text)
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

create or replace function public.user_is_application_mentor_for_craa_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $f$
  select public.user_is_application_mentor_for_craa_application(
    public.craa_application_uuid_from_path(p_name)
  );
$f$;

create or replace function public.user_can_read_craa_storage_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $f$
  select
    (select public.is_admin()) = true
    or public.user_is_application_mentor_for_craa_path(p_name) = true
    or public.user_is_post_author_for_craa_application(
      public.craa_application_uuid_from_path(p_name)
    ) = true;
$f$;

drop policy if exists "craa_storage_read_authorized" on storage.objects;
create policy "craa_storage_read_authorized"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'custom-request-application-attachments'
    and public.user_can_read_craa_storage_path(name)
  );

drop policy if exists "craa_storage_insert_mentor" on storage.objects;
create policy "craa_storage_insert_mentor"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'custom-request-application-attachments'
    and public.user_is_application_mentor_for_craa_path(name) = true
  );

-- =============================================================================
-- Supabase SQL Editor — 검증용
-- -- 테이블
-- select column_name, data_type from information_schema.columns
--   where table_schema = 'public' and table_name = 'custom_request_application_attachments'
--   order by ordinal_position;
-- -- 버킷
-- select id, name, public, file_size_limit from storage.buckets
--   where id = 'custom-request-application-attachments';
-- -- 정책
-- select policyname, cmd from pg_policies
--   where schemaname = 'public' and tablename = 'custom_request_application_attachments';
-- select policyname, cmd from pg_policies
--   where schemaname = 'storage' and tablename = 'objects' and policyname like 'craa_%';
-- =============================================================================
