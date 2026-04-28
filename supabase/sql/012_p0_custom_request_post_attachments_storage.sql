-- P0: 맞춤의뢰 등록 첨부 — private Storage + custom_request_post_attachments + storage.objects RLS
-- 선행: 001( users ), 003( custom_request_posts ) — is_admin() 정의 권장
-- 010( custom-order-deliverables )와 버킷/정책명 분리, idempotent

-- ---------------------------------------------------------------------------
-- 1) custom_request_post_attachments
-- ---------------------------------------------------------------------------
create table if not exists public.custom_request_post_attachments (
  id uuid primary key default gen_random_uuid(),
  custom_request_post_id uuid not null references public.custom_request_posts (id) on delete cascade,
  uploaded_by uuid not null references public.users (id) on delete restrict,
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  file_size_bytes bigint,
  created_at timestamptz not null default now()
);

comment on table public.custom_request_post_attachments is
  '의뢰 등록 시 학생이 올린 첨부 메타. storage_path 는 ASCII 키(버킷 내부), 표시명은 original_filename.';

create index if not exists idx_crpa_post_created
  on public.custom_request_post_attachments (custom_request_post_id, created_at asc);

alter table public.custom_request_post_attachments enable row level security;

-- post 작성자(동의어) 또는 mentor/admin — 멘토는 지원 전 의뢰 열람·다운로드
drop policy if exists "crpa_select_authorized" on public.custom_request_post_attachments;
create policy "crpa_select_authorized"
  on public.custom_request_post_attachments
  for select
  to authenticated
  using (
    (select public.is_admin()) = true
    or exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'mentor')
    or exists (
      select 1
      from public.custom_request_posts p
      where p.id = custom_request_post_id
        and (
          p.author_id = (select auth.uid())
          or p.student_id = (select auth.uid())
          or p.user_id = (select auth.uid())
          or p.requester_id = (select auth.uid())
          or p.client_id = (select auth.uid())
        )
    )
  );

drop policy if exists "crpa_insert_author" on public.custom_request_post_attachments;
create policy "crpa_insert_author"
  on public.custom_request_post_attachments
  for insert
  to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and exists (
      select 1
      from public.custom_request_posts p
      where p.id = custom_request_post_id
        and (
          p.author_id = (select auth.uid())
          or p.student_id = (select auth.uid())
          or p.user_id = (select auth.uid())
          or p.requester_id = (select auth.uid())
          or p.client_id = (select auth.uid())
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 2) Storage bucket (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'custom-request-post-attachments',
  'custom-request-post-attachments',
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
-- 3) Path → post UUID(첫 세그먼트) + 권한 (storage RLS)
-- ---------------------------------------------------------------------------
create or replace function public.crp_uuid_from_post_attachment_path(p_name text)
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

create or replace function public.user_is_post_author_for_crpa_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $f$
  select exists (
    select 1
    from public.custom_request_posts p
    where p.id = public.crp_uuid_from_post_attachment_path(p_name)
      and (
        p.author_id = (select auth.uid())
        or p.student_id = (select auth.uid())
        or p.user_id = (select auth.uid())
        or p.requester_id = (select auth.uid())
        or p.client_id = (select auth.uid())
      )
  );
$f$;

create or replace function public.user_can_read_crpa_storage_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $f$
  select
    (select public.is_admin()) = true
    or public.user_is_post_author_for_crpa_path(p_name) = true
    or exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'mentor');
$f$;

-- storage.objects: 읽기 — 작성자·멘토·admin / 쓰기 — 작성자만(의뢰 등록 시 업로드)
drop policy if exists "crpa_storage_read_authorized" on storage.objects;
create policy "crpa_storage_read_authorized"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'custom-request-post-attachments'
    and public.user_can_read_crpa_storage_path(name)
  );

drop policy if exists "crpa_storage_insert_author" on storage.objects;
create policy "crpa_storage_insert_author"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'custom-request-post-attachments'
    and public.user_is_post_author_for_crpa_path(name)
  );

-- =============================================================================
-- Supabase — 검증용 (SQL Editor)
-- -- 테이블
-- select column_name, data_type from information_schema.columns
--   where table_schema = 'public' and table_name = 'custom_request_post_attachments' order by ordinal_position;
-- -- 버킷
-- select * from storage.buckets where id = 'custom-request-post-attachments';
-- -- storage policies
-- select * from pg_policies
--   where schemaname = 'storage' and tablename = 'objects' and policyname like 'crpa_%';
-- =============================================================================
