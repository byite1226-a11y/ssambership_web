-- =============================================================================
-- 088_custom_order_status_transition_rpcs.sql
-- Purpose: Move custom_request_orders party status transitions behind RPCs (M-1 step 1).
-- Scope:
--   - Add SECURITY DEFINER RPCs for existing party status transitions.
--   - Preserve current transition rules before later RLS lockdown.
--   - Do not change RLS policies or table grants in this step.
--   - No escrow/refund/settlement/cash_ledger changes.
-- =============================================================================

begin;

create or replace function public._cro_transition_primary_status_col(o public.custom_request_orders)
returns text
language plpgsql
stable
set search_path = public
as $function$
begin
  if o.status is not null and btrim(o.status) <> '' then
    return 'status';
  elsif o.state is not null and btrim(o.state) <> '' then
    return 'state';
  elsif o.order_status is not null and btrim(o.order_status) <> '' then
    return 'order_status';
  elsif o.stage is not null and btrim(o.stage) <> '' then
    return 'stage';
  end if;
  return null;
end;
$function$;

create or replace function public._cro_transition_primary_status_norm(o public.custom_request_orders)
returns text
language plpgsql
stable
set search_path = public
as $function$
declare
  v_col text;
begin
  v_col := public._cro_transition_primary_status_col(o);
  if v_col = 'status' then
    return lower(btrim(o.status));
  elsif v_col = 'state' then
    return lower(btrim(o.state));
  elsif v_col = 'order_status' then
    return lower(btrim(o.order_status));
  elsif v_col = 'stage' then
    return lower(btrim(o.stage));
  end if;
  return '';
end;
$function$;

create or replace function public._cro_transition_is_terminal(o public.custom_request_orders)
returns boolean
language plpgsql
stable
set search_path = public
as $function$
declare
  v_terminal text[] := array[
    'completed', 'accepted', 'closed', 'finished', 'cancelled', 'canceled',
    'refunded', 'rejected', 'done', 'resolved', 'dispute_resolved'
  ];
begin
  if lower(btrim(coalesce(o.status, ''))) = any(v_terminal) then
    return true;
  elsif lower(btrim(coalesce(o.state, ''))) = any(v_terminal) then
    return true;
  elsif lower(btrim(coalesce(o.order_status, ''))) = any(v_terminal) then
    return true;
  elsif lower(btrim(coalesce(o.stage, ''))) = any(v_terminal) then
    return true;
  elsif o.completed_at is not null or o.closed_at is not null or o.finished_at is not null then
    return true;
  end if;
  return false;
end;
$function$;

create or replace function public._cro_transition_payment_confirmed(o public.custom_request_orders)
returns boolean
language plpgsql
stable
set search_path = public
as $function$
declare
  v_confirmed text[] := array['paid', 'succeeded', 'escrowed', 'completed', 'complete', 'success', 'captured', 'paid_out'];
begin
  if lower(btrim(coalesce(o.payment_status, ''))) = any(v_confirmed) then
    return true;
  end if;
  return false;
end;
$function$;

create or replace function public._cro_transition_actor_is_mentor(o public.custom_request_orders, p_actor uuid)
returns boolean
language sql
stable
set search_path = public
as $function$
  select p_actor is not null and (
    o.mentor_id = p_actor
    or o.selected_mentor_id = p_actor
    or o.assigned_mentor_id = p_actor
    or o.expert_id = p_actor
  );
$function$;

create or replace function public._cro_transition_actor_is_student(o public.custom_request_orders, p_actor uuid)
returns boolean
language sql
stable
set search_path = public
as $function$
  select p_actor is not null and (
    o.student_id = p_actor
    or o.buyer_id = p_actor
    or o.client_id = p_actor
    or o.user_id = p_actor
    or o.author_id = p_actor
    or o.requester_id = p_actor
  );
$function$;

create or replace function public._cro_transition_has_active_dispute(p_order_id uuid)
returns boolean
language sql
stable
set search_path = public
as $function$
  select exists (
    select 1
    from public.disputes d
    where d.custom_request_order_id = p_order_id
      and d.status in ('open', 'under_review', 'escalated')
  );
$function$;

create or replace function public._cro_transition_deliverable_count(p_order_id uuid)
returns integer
language sql
stable
set search_path = public
as $function$
  select count(*)::integer
  from public.custom_order_deliverables d
  where d.custom_request_order_id = p_order_id;
$function$;

create or replace function public._cro_transition_revision_count(p_order_id uuid)
returns integer
language sql
stable
set search_path = public
as $function$
  select count(*)::integer
  from public.custom_order_revisions r
  where r.custom_request_order_id = p_order_id;
$function$;

create or replace function public.custom_order_mentor_start(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_actor uuid := auth.uid();
  o public.custom_request_orders%rowtype;
  v_primary_col text;
  v_norm text;
  v_now timestamptz := now();
begin
  if v_actor is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into o
  from public.custom_request_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  if not public._cro_transition_actor_is_mentor(o, v_actor) then
    raise exception 'ORDER_MENTOR_FORBIDDEN' using errcode = 'P0001';
  end if;

  if public._cro_transition_has_active_dispute(p_order_id) then
    raise exception 'ORDER_HAS_ACTIVE_DISPUTE' using errcode = 'P0001';
  end if;

  if not public._cro_transition_payment_confirmed(o) then
    raise exception 'ORDER_PAYMENT_NOT_CONFIRMED' using errcode = 'P0001';
  end if;

  if public._cro_transition_is_terminal(o) then
    raise exception 'ORDER_TERMINAL' using errcode = 'P0001';
  end if;

  v_primary_col := public._cro_transition_primary_status_col(o);
  v_norm := public._cro_transition_primary_status_norm(o);

  if v_primary_col is null or v_norm = '' then
    raise exception 'ORDER_STATUS_COLUMN_MISSING' using errcode = 'P0001';
  end if;

  if v_norm = 'open' then
    raise exception 'ORDER_ALREADY_STARTED' using errcode = 'P0001';
  end if;

  if v_norm <> 'pending' then
    raise exception 'ORDER_STATUS_NOT_STARTABLE' using errcode = 'P0001';
  end if;

  update public.custom_request_orders
  set
    status = case when v_primary_col = 'status' then 'open' else status end,
    state = case when v_primary_col = 'state' then 'open' else state end,
    order_status = case when v_primary_col = 'order_status' then 'open' else order_status end,
    stage = case when v_primary_col = 'stage' then 'open' else stage end,
    started_at = v_now
  where id = p_order_id;

  return jsonb_build_object('ok', true, 'transition', 'mentor_start', 'from', v_norm, 'to', 'open');
end;
$function$;

create or replace function public.custom_order_mentor_deliver(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_actor uuid := auth.uid();
  o public.custom_request_orders%rowtype;
  v_primary_col text;
  v_norm text;
begin
  if v_actor is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into o
  from public.custom_request_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  if not public._cro_transition_actor_is_mentor(o, v_actor) then
    raise exception 'ORDER_MENTOR_FORBIDDEN' using errcode = 'P0001';
  end if;

  if public._cro_transition_is_terminal(o) then
    raise exception 'ORDER_TERMINAL' using errcode = 'P0001';
  end if;

  if public._cro_transition_deliverable_count(p_order_id) < 1 then
    raise exception 'ORDER_DELIVERABLE_REQUIRED' using errcode = 'P0001';
  end if;

  v_primary_col := public._cro_transition_primary_status_col(o);
  v_norm := public._cro_transition_primary_status_norm(o);

  update public.custom_request_orders
  set
    order_status = 'delivered',
    status = case when v_primary_col = 'status' then 'delivered' else status end,
    state = case when v_primary_col = 'state' then 'delivered' else state end,
    stage = case when v_primary_col = 'stage' then 'delivered' else stage end
  where id = p_order_id;

  return jsonb_build_object('ok', true, 'transition', 'mentor_deliver', 'from', v_norm, 'to', 'delivered');
end;
$function$;

create or replace function public.custom_order_student_request_revision(
  p_order_id uuid,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_actor uuid := auth.uid();
  o public.custom_request_orders%rowtype;
  v_norm text;
  v_note text := btrim(coalesce(p_note, ''));
  v_revision_id uuid;
begin
  if v_actor is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  if v_note = '' then
    raise exception 'REVISION_NOTE_REQUIRED' using errcode = 'P0001';
  end if;

  if char_length(v_note) > 8000 then
    raise exception 'REVISION_NOTE_TOO_LONG' using errcode = 'P0001';
  end if;

  select * into o
  from public.custom_request_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  if not public._cro_transition_actor_is_student(o, v_actor) then
    raise exception 'ORDER_STUDENT_FORBIDDEN' using errcode = 'P0001';
  end if;

  if public._cro_transition_has_active_dispute(p_order_id) then
    raise exception 'ORDER_HAS_ACTIVE_DISPUTE' using errcode = 'P0001';
  end if;

  v_norm := public._cro_transition_primary_status_norm(o);
  if v_norm = '' then
    raise exception 'ORDER_STATUS_COLUMN_MISSING' using errcode = 'P0001';
  end if;

  if public._cro_transition_is_terminal(o) then
    raise exception 'ORDER_TERMINAL' using errcode = 'P0001';
  end if;

  if v_norm not in (
    'delivered', 'delivered_pending_review', 'waiting_review', 'pending_review',
    'redelivered', 'delivery_submitted', 'in_review'
  ) then
    raise exception 'ORDER_STATUS_NOT_REVISIONABLE' using errcode = 'P0001';
  end if;

  if public._cro_transition_deliverable_count(p_order_id) < 1 then
    raise exception 'ORDER_DELIVERABLE_REQUIRED' using errcode = 'P0001';
  end if;

  if public._cro_transition_revision_count(p_order_id) >= 2 then
    raise exception 'REVISION_LIMIT_EXCEEDED' using errcode = 'P0001';
  end if;

  if lower(btrim(coalesce(o.order_status, ''))) <> 'delivered' then
    raise exception 'ORDER_STATUS_NOT_DELIVERED' using errcode = 'P0001';
  end if;

  insert into public.custom_order_revisions (
    custom_request_order_id,
    order_id,
    custom_order_id,
    request_order_id,
    author_id,
    request_note,
    status
  ) values (
    p_order_id,
    p_order_id,
    p_order_id,
    p_order_id,
    v_actor,
    v_note,
    'open'
  ) returning id into v_revision_id;

  update public.custom_request_orders
  set order_status = 'revision_requested'
  where id = p_order_id
    and order_status = 'delivered';

  if not found then
    raise exception 'ORDER_STATUS_NOT_DELIVERED' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'ok', true,
    'transition', 'student_request_revision',
    'from', v_norm,
    'to', 'revision_requested',
    'revision_id', v_revision_id
  );
end;
$function$;

comment on function public.custom_order_mentor_start(uuid) is
  'M-1 step 1: mentor-owned custom order work-start transition. Authenticated caller only; validates actor, payment, dispute, and current status.';
comment on function public.custom_order_mentor_deliver(uuid) is
  'M-1 step 1: mentor-owned custom order delivered transition. Authenticated caller only; validates actor, terminal state, and deliverable existence.';
comment on function public.custom_order_student_request_revision(uuid, text) is
  'M-1 step 1: student-owned custom order revision request transition. Inserts revision row and updates order_status atomically.';

revoke all on function public._cro_transition_primary_status_col(public.custom_request_orders) from public, anon, authenticated;
revoke all on function public._cro_transition_primary_status_norm(public.custom_request_orders) from public, anon, authenticated;
revoke all on function public._cro_transition_is_terminal(public.custom_request_orders) from public, anon, authenticated;
revoke all on function public._cro_transition_payment_confirmed(public.custom_request_orders) from public, anon, authenticated;
revoke all on function public._cro_transition_actor_is_mentor(public.custom_request_orders, uuid) from public, anon, authenticated;
revoke all on function public._cro_transition_actor_is_student(public.custom_request_orders, uuid) from public, anon, authenticated;
revoke all on function public._cro_transition_has_active_dispute(uuid) from public, anon, authenticated;
revoke all on function public._cro_transition_deliverable_count(uuid) from public, anon, authenticated;
revoke all on function public._cro_transition_revision_count(uuid) from public, anon, authenticated;

revoke all on function public.custom_order_mentor_start(uuid) from public, anon;
revoke all on function public.custom_order_mentor_deliver(uuid) from public, anon;
revoke all on function public.custom_order_student_request_revision(uuid, text) from public, anon;

grant execute on function public.custom_order_mentor_start(uuid) to authenticated, service_role;
grant execute on function public.custom_order_mentor_deliver(uuid) to authenticated, service_role;
grant execute on function public.custom_order_student_request_revision(uuid, text) to authenticated, service_role;

commit;