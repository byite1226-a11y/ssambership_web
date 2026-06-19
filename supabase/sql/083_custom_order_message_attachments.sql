-- =============================================================================
-- 083_custom_order_message_attachments.sql
-- Purpose: Private, party-only attachments for custom order room messages.
--
-- Safety:
--   - Does not touch custom request order state machines, escrow, payment,
--     refund, 070 individual-question RPCs, or 077 verification objects.
--   - Creates a new private Storage bucket and a new metadata table only.
--   - Access is limited to the order student, assigned mentor, and admins.
--   - SQL is intended for manual Supabase SQL Editor execution.
-- =============================================================================

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'custom-order-message-attachments',
  'custom-order-message-attachments',
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
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.custom_order_message_attachments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.custom_request_orders (id) on delete cascade,
  message_id uuid references public.custom_order_messages (id) on delete set null,
  uploader_id uuid not null references public.users (id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  created_at timestamptz not null default now(),
  constraint custom_order_message_attachments_storage_path_unique unique (storage_path),
  constraint custom_order_message_attachments_size_check
    check (file_size_bytes > 0 and file_size_bytes <= 20971520),
  constraint custom_order_message_attachments_mime_type_check
    check (
      mime_type in (
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
        'application/zip',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      )
    ),
  constraint custom_order_message_attachments_storage_path_check
    check (
      storage_path ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9]+-[a-z0-9]{8,32}\.[a-z0-9]+$'
    )
);

create index if not exists idx_custom_order_message_attachments_order
  on public.custom_order_message_attachments (order_id, created_at asc);

create index if not exists idx_custom_order_message_attachments_message
  on public.custom_order_message_attachments (message_id);

alter table public.custom_order_message_attachments enable row level security;

create or replace function public.custom_order_message_attachment_order_id_from_path(p_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_parts text[];
begin
  v_parts := storage.foldername(coalesce(p_name, ''));
  if array_length(v_parts, 1) < 1 then
    return null;
  end if;
  if v_parts[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;
  return v_parts[1]::uuid;
exception
  when others then
    return null;
end;
$function$;

create or replace function public.custom_order_message_attachment_uploader_id_from_path(p_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_parts text[];
begin
  v_parts := storage.foldername(coalesce(p_name, ''));
  if array_length(v_parts, 1) < 2 then
    return null;
  end if;
  if v_parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;
  return v_parts[2]::uuid;
exception
  when others then
    return null;
end;
$function$;

create or replace function public.custom_order_message_attachment_is_party(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select coalesce((
    select
      public.is_admin()
      or j->>'student_id' = auth.uid()::text
      or j->>'buyer_id' = auth.uid()::text
      or j->>'client_id' = auth.uid()::text
      or j->>'user_id' = auth.uid()::text
      or j->>'author_id' = auth.uid()::text
      or j->>'requester_id' = auth.uid()::text
      or j->>'mentor_id' = auth.uid()::text
      or j->>'mentor_user_id' = auth.uid()::text
      or j->>'assignee_id' = auth.uid()::text
      or j->>'assigned_mentor_id' = auth.uid()::text
      or j->>'selected_mentor_id' = auth.uid()::text
      or j->>'expert_id' = auth.uid()::text
    from (
      select to_jsonb(o) as j
      from public.custom_request_orders o
      where o.id = p_order_id
    ) s
  ), false);
$function$;

drop policy if exists "coma_select_party" on public.custom_order_message_attachments;
create policy "coma_select_party" on public.custom_order_message_attachments
  for select to authenticated
  using (public.custom_order_message_attachment_is_party(order_id));

drop policy if exists "coma_insert_party" on public.custom_order_message_attachments;
create policy "coma_insert_party" on public.custom_order_message_attachments
  for insert to authenticated
  with check (
    uploader_id = (select auth.uid())
    and public.custom_order_message_attachment_is_party(order_id)
  );

drop policy if exists "coma_delete_uploader_or_admin" on public.custom_order_message_attachments;
create policy "coma_delete_uploader_or_admin" on public.custom_order_message_attachments
  for delete to authenticated
  using (
    uploader_id = (select auth.uid())
    or public.is_admin()
  );

grant select, insert, delete on public.custom_order_message_attachments to authenticated;
grant execute on function public.custom_order_message_attachment_order_id_from_path(text) to authenticated;
grant execute on function public.custom_order_message_attachment_uploader_id_from_path(text) to authenticated;
grant execute on function public.custom_order_message_attachment_is_party(uuid) to authenticated;

drop policy if exists "custom_order_message_attachments_storage_select_party" on storage.objects;
create policy "custom_order_message_attachments_storage_select_party" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'custom-order-message-attachments'
    and exists (
      select 1
      from public.custom_order_message_attachments a
      where a.storage_path = storage.objects.name
        and public.custom_order_message_attachment_is_party(a.order_id)
    )
  );

drop policy if exists "custom_order_message_attachments_storage_insert_party" on storage.objects;
create policy "custom_order_message_attachments_storage_insert_party" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'custom-order-message-attachments'
    and public.custom_order_message_attachment_order_id_from_path(name) is not null
    and public.custom_order_message_attachment_uploader_id_from_path(name) = (select auth.uid())
    and public.custom_order_message_attachment_is_party(
      public.custom_order_message_attachment_order_id_from_path(name)
    )
  );

drop policy if exists "custom_order_message_attachments_storage_delete_uploader_or_admin" on storage.objects;
create policy "custom_order_message_attachments_storage_delete_uploader_or_admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'custom-order-message-attachments'
    and (
      exists (
        select 1
        from public.custom_order_message_attachments a
        where a.storage_path = storage.objects.name
          and (
            a.uploader_id = (select auth.uid())
            or public.is_admin()
          )
      )
      or (
        public.custom_order_message_attachment_uploader_id_from_path(name) = (select auth.uid())
        and public.custom_order_message_attachment_is_party(
          public.custom_order_message_attachment_order_id_from_path(name)
        )
      )
    )
  );

comment on table public.custom_order_message_attachments is
  'Private custom-order chat attachments. Metadata only; file bytes live in custom-order-message-attachments Storage bucket.';

comment on function public.custom_order_message_attachment_is_party(uuid) is
  'Returns true when auth.uid() is the order student, assigned mentor, or admin. Used by order-message attachment table and Storage RLS.';

commit;
