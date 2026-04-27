-- P0: 맞춤의뢰 납품 첨부 — private Storage 버킷 + custom_order_deliverables 메타 컬럼 + storage.objects RLS
-- 선행: 003( custom_request_orders, custom_order_deliverables ) · 001( is_admin / users )
-- Staging/운영: idempotent, 여러 번 실행해도 안전

-- ---------------------------------------------------------------------------
-- 1) custom_order_deliverables — 스토리지/파일 메타(기존 호환: IF NOT EXISTS)
-- ---------------------------------------------------------------------------
do $alter$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'custom_order_deliverables' and column_name = 'storage_path') then
    alter table public.custom_order_deliverables add column storage_path text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'custom_order_deliverables' and column_name = 'original_filename') then
    alter table public.custom_order_deliverables add column original_filename text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'custom_order_deliverables' and column_name = 'mime_type') then
    alter table public.custom_order_deliverables add column mime_type text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'custom_order_deliverables' and column_name = 'file_size') then
    alter table public.custom_order_deliverables add column file_size bigint;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'custom_order_deliverables' and column_name = 'file_size_bytes') then
    alter table public.custom_order_deliverables add column file_size_bytes bigint;
  end if;
end
$alter$;

comment on column public.custom_order_deliverables.storage_path is
  'Storage object key(버킷 내부, ASCII-only). 예: {orderId}/{ver}/{ts}-{8hex}.png — 원본 한글 파일명은 original_filename.';

-- ---------------------------------------------------------------------------
-- 2) Storage bucket (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'custom-order-deliverables',
  'custom-order-deliverables',
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
-- 3) Path → 주문 UUID(첫 세그먼트) + 당사자/멘토 판단 (storage RLS)
-- ---------------------------------------------------------------------------
create or replace function public.cro_uuid_from_deliverable_storage_path(p_name text)
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

create or replace function public.user_is_party_to_cro_storage_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $f$
  select exists (
    select 1
    from public.custom_request_orders o
    where o.id = public.cro_uuid_from_deliverable_storage_path(p_name)
      and (
        (select auth.uid()) in (o.student_id, o.mentor_id)
        or (select auth.uid()) in (o.buyer_id, o.client_id, o.user_id, o.author_id, o.requester_id)
        or (select public.is_admin()) = true
      )
  );
$f$;

create or replace function public.user_is_mentor_of_cro_storage_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $f$
  select exists (
    select 1
    from public.custom_request_orders o
    where o.id = public.cro_uuid_from_deliverable_storage_path(p_name)
      and o.mentor_id = (select auth.uid())
  );
$f$;

-- storage.objects: SELECT 당사자, INSERT 멘토만(납품 업로드)
drop policy if exists "custom_order_deliverable_storage_read_party" on storage.objects;
create policy "custom_order_deliverable_storage_read_party"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'custom-order-deliverables'
    and public.user_is_party_to_cro_storage_path(name)
  );

drop policy if exists "custom_order_deliverable_storage_insert_mentor" on storage.objects;
create policy "custom_order_deliverable_storage_insert_mentor"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'custom-order-deliverables'
    and public.user_is_mentor_of_cro_storage_path(name)
  );

-- (선택) storage.objects RLS on storage: Supabase는 기본으로 storage.objects RLS on — bucket 정책 누적
-- create index: 주문+버전 조회는 003에 idx_cdel_order 존재
create index if not exists idx_cdel_order_storage
  on public.custom_order_deliverables (custom_request_order_id, storage_path)
  where storage_path is not null;

-- =============================================================================
-- Supabase — 검증용 (SQL Editor)
-- -- 버킷
-- select * from storage.buckets where id = 'custom-order-deliverables';
-- -- deliverables 열
-- select column_name, data_type from information_schema.columns
--   where table_schema = 'public' and table_name = 'custom_order_deliverables' order by ordinal_position;
-- -- storage policies
-- select * from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'custom_order_deliverable%';
-- =============================================================================
