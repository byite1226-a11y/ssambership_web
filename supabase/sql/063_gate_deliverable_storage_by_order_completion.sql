-- 063_gate_deliverable_storage_by_order_completion.sql
-- Purpose: prevent students from bypassing the server download action by creating a direct
-- signed URL for custom-order deliverable storage objects before order acceptance/completion.
--
-- Apply order:
--   1) Apply after 010_p0_custom_order_deliverable_files_storage.sql and the app deploy that
--      strips storage_path from pre-completion student views.
--   2) Run the policy inspection query below before and after applying this file.
--
-- Rollback:
--   drop policy if exists "custom_order_deliverable_storage_read_party" on storage.objects;
--   create policy "custom_order_deliverable_storage_read_party"
--     on storage.objects
--     for select
--     to authenticated
--     using (
--       bucket_id = 'custom-order-deliverables'
--       and public.user_is_party_to_cro_storage_path(name)
--     );
--
-- Inspect:
--   select policyname, cmd, roles, qual
--   from pg_policies
--   where schemaname = 'storage'
--     and tablename = 'objects'
--     and policyname like 'custom_order_deliverable%';

create or replace function public.cro_primary_status_norm(o public.custom_request_orders)
returns text
language sql
stable
security definer
set search_path = public
as $f$
  select lower(coalesce(
    nullif(btrim(o.status), ''),
    nullif(btrim(o.state), ''),
    nullif(btrim(o.order_status), ''),
    nullif(btrim(o.stage), ''),
    ''
  ));
$f$;

create or replace function public.cro_student_can_read_deliverable_storage(o public.custom_request_orders)
returns boolean
language sql
stable
security definer
set search_path = public
as $f$
  select case
    when public.cro_primary_status_norm(o) in (
      'cancelled',
      'canceled',
      'refunded',
      'rejected',
      'disputed',
      'dispute_resolved'
    ) then false
    when public.cro_primary_status_norm(o) in ('completed', 'accepted', 'finished') then true
    when public.cro_primary_status_norm(o) in (
      'delivered',
      'delivered_pending_review',
      'waiting_review',
      'pending_review',
      'redelivered',
      'delivery_submitted',
      'in_review',
      'paid'
    ) then false
    when o.completed_at is not null or o.accepted_at is not null then true
    else false
  end;
$f$;

create or replace function public.user_can_read_cro_deliverable_storage_path(p_name text)
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
        (select public.is_admin()) = true
        or o.mentor_id = (select auth.uid())
        or (
          (
            o.student_id = (select auth.uid())
            or o.buyer_id = (select auth.uid())
            or o.client_id = (select auth.uid())
            or o.user_id = (select auth.uid())
            or o.author_id = (select auth.uid())
            or o.requester_id = (select auth.uid())
          )
          and public.cro_student_can_read_deliverable_storage(o)
        )
      )
  );
$f$;

drop policy if exists "custom_order_deliverable_storage_read_party" on storage.objects;
create policy "custom_order_deliverable_storage_read_party"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'custom-order-deliverables'
    and public.user_can_read_cro_deliverable_storage_path(name)
  );
