-- docs/audit/db_permission_audit_queries.sql
-- Read-only Supabase production permission audit queries.
-- Run in Supabase SQL Editor and compare the output with docs/audit/db_expected_state.md.
-- Every statement below is SELECT-only. Expected values are written above each query.

-- =============================================================================
-- A. SECURITY DEFINER / money RPC EXECUTE grants
-- =============================================================================

-- A1. Privilege matrix for sensitive money, escrow, settlement, refund, and IQ RPCs.
-- Expected:
--   - anon_can_execute = false for every existing target function/overload.
--   - authenticated_can_execute = false for every existing target function/overload.
--   - service_role_can_execute = true for deployed service-only RPCs.
--   - security_definer = true for these RPCs unless a later migration intentionally documents otherwise.
with target_functions(function_name) as (
  values
    ('record_cash_topup'),
    ('record_subscription_cash_debit'),
    ('record_subscription_cash_rollback'),
    ('process_subscription_renewal'),
    ('accept_custom_order_deliverable_atomic'),
    ('record_custom_order_escrow_hold'),
    ('record_custom_order_escrow_payout'),
    ('record_custom_order_escrow_refund'),
    ('record_custom_order_dispute_split'),
    ('approve_refund_request_admin'),
    ('reject_refund_request_admin'),
    ('create_individual_question_with_hold'),
    ('create_individual_question_with_hold_v2'),
    ('claim_individual_question'),
    ('claim_individual_question_v2'),
    ('release_individual_question_payout'),
    ('refund_individual_question_hold')
), funcs as (
  select
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as args,
    p.prosecdef as security_definer,
    has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
    has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join target_functions t on t.function_name = p.proname
  where n.nspname = 'public'
)
select
  schema_name,
  function_name,
  args,
  security_definer,
  anon_can_execute,
  authenticated_can_execute,
  service_role_can_execute,
  case
    when anon_can_execute or authenticated_can_execute then 'DRIFT: public client can execute'
    when not service_role_can_execute then 'DRIFT: service_role cannot execute'
    when not security_definer then 'CHECK: function is not SECURITY DEFINER'
    else 'OK'
  end as audit_status
from funcs
order by function_name, args;

-- A2. Drift-only view for public-client execution on sensitive RPCs.
-- Expected: 0 rows.
with target_functions(function_name) as (
  values
    ('record_cash_topup'),
    ('record_subscription_cash_debit'),
    ('record_subscription_cash_rollback'),
    ('process_subscription_renewal'),
    ('accept_custom_order_deliverable_atomic'),
    ('record_custom_order_escrow_hold'),
    ('record_custom_order_escrow_payout'),
    ('record_custom_order_escrow_refund'),
    ('record_custom_order_dispute_split'),
    ('approve_refund_request_admin'),
    ('reject_refund_request_admin'),
    ('create_individual_question_with_hold'),
    ('create_individual_question_with_hold_v2'),
    ('claim_individual_question'),
    ('claim_individual_question_v2'),
    ('release_individual_question_payout'),
    ('refund_individual_question_hold')
)
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join target_functions t on t.function_name = p.proname
where n.nspname = 'public'
  and (
    has_function_privilege('anon', p.oid, 'EXECUTE')
    or has_function_privilege('authenticated', p.oid, 'EXECUTE')
  )
order by function_name, args;

-- A3. Overload inventory for sensitive RPC names.
-- Expected:
--   - record_subscription_cash_debit should not have the old exposed orphan overload from 073.
--   - Any overload listed here must also appear as service_role-only in A1/A2.
with target_functions(function_name) as (
  values
    ('record_cash_topup'),
    ('record_subscription_cash_debit'),
    ('record_subscription_cash_rollback'),
    ('process_subscription_renewal'),
    ('accept_custom_order_deliverable_atomic'),
    ('record_custom_order_escrow_hold'),
    ('record_custom_order_escrow_payout'),
    ('record_custom_order_escrow_refund'),
    ('record_custom_order_dispute_split'),
    ('approve_refund_request_admin'),
    ('reject_refund_request_admin'),
    ('create_individual_question_with_hold'),
    ('create_individual_question_with_hold_v2'),
    ('claim_individual_question'),
    ('claim_individual_question_v2'),
    ('release_individual_question_payout'),
    ('refund_individual_question_hold')
)
select
  p.proname as function_name,
  count(*) as overload_count,
  array_agg(pg_get_function_identity_arguments(p.oid) order by pg_get_function_identity_arguments(p.oid)) as overload_args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join target_functions t on t.function_name = p.proname
where n.nspname = 'public'
group by p.proname
order by p.proname;

-- =============================================================================
-- B. RLS enabled state and policy dump for sensitive tables
-- =============================================================================

-- B1. RLS enabled check.
-- Expected: every deployed table below has table_exists = true and rls_enabled = true.
-- If a table is intentionally not applied yet, table_exists=false is not a drift by itself.
with sensitive_tables(schema_name, table_name) as (
  values
    ('public', 'payments'),
    ('public', 'mentor_student_rooms'),
    ('public', 'connection_notes'),
    ('public', 'cash_ledger'),
    ('public', 'cash_wallets'),
    ('public', 'individual_questions'),
    ('public', 'custom_request_orders'),
    ('public', 'custom_order_message_attachments'),
    ('public', 'admin_case_notes'),
    ('public', 'mentor_profiles'),
    ('public', 'mentor_school_verifications'),
    ('public', 'school_tier_catalog'),
    ('public', 'school_tier_mappings'),
    ('public', 'major_category_catalog'),
    ('public', 'shortform_reactions')
)
select
  st.schema_name,
  st.table_name,
  c.oid is not null as table_exists,
  coalesce(c.relrowsecurity, false) as rls_enabled,
  coalesce(c.relforcerowsecurity, false) as force_rls,
  case
    when c.oid is null then 'MISSING_OR_NOT_APPLIED'
    when not c.relrowsecurity then 'DRIFT: RLS disabled'
    else 'OK'
  end as audit_status
from sensitive_tables st
left join pg_namespace n on n.nspname = st.schema_name
left join pg_class c on c.relnamespace = n.oid and c.relname = st.table_name and c.relkind in ('r', 'p')
order by st.schema_name, st.table_name;

-- B2. Policy dump for sensitive tables.
-- Expected: compare with docs/audit/db_expected_state.md.
with sensitive_tables(table_name) as (
  values
    ('payments'),
    ('mentor_student_rooms'),
    ('connection_notes'),
    ('cash_ledger'),
    ('cash_wallets'),
    ('individual_questions'),
    ('custom_request_orders'),
    ('custom_order_message_attachments'),
    ('admin_case_notes'),
    ('mentor_profiles'),
    ('mentor_school_verifications'),
    ('school_tier_catalog'),
    ('school_tier_mappings'),
    ('major_category_catalog'),
    ('shortform_reactions')
)
select
  schemaname,
  tablename,
  policyname,
  permissive,
  array_to_string(roles, ', ') as roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (select table_name from sensitive_tables)
order by tablename, cmd, policyname;

-- B3. Direct authenticated payment updates must remain closed.
-- Expected: 0 rows.
select policyname, cmd, array_to_string(roles, ', ') as roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'payments'
  and cmd = 'UPDATE'
order by policyname;

-- B4. Direct authenticated mentor_student_rooms writes must remain closed.
-- Expected: 0 rows.
select policyname, cmd, array_to_string(roles, ', ') as roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'mentor_student_rooms'
  and cmd in ('INSERT', 'UPDATE')
order by cmd, policyname;

-- B5. connection_notes write policy author checks.
-- Expected:
--   - cn_insert WITH CHECK contains author_id = auth.uid() and room participant check.
--   - cn_update USING/WITH CHECK contain author_id = auth.uid() and room participant check.
--   - cn_delete USING contains author_id = auth.uid() and room participant check.
--   - cn_select remains participant-readable and is not expected to contain author_id.
select
  policyname,
  cmd,
  array_to_string(roles, ', ') as roles,
  qual,
  with_check,
  position('author_id' in coalesce(qual, '') || ' ' || coalesce(with_check, '')) > 0 as mentions_author_id,
  position('mentor_student_rooms' in coalesce(qual, '') || ' ' || coalesce(with_check, '')) > 0 as mentions_room_table
from pg_policies
where schemaname = 'public'
  and tablename = 'connection_notes'
order by cmd, policyname;

-- B6. mentor_profiles must not have anon table SELECT policy.
-- Expected: 0 rows. Public mentor reads should go through 078 v2 whitelist RPCs only.
select policyname, cmd, array_to_string(roles, ', ') as roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'mentor_profiles'
  and cmd = 'SELECT'
  and ('anon' = any(roles::text[]) or 'public' = any(roles::text[]))
order by policyname;

-- B7. Public mentor read RPC grant state.
-- Expected:
--   - v2 functions: anon/authenticated execute = true.
--   - old v1 functions: anon/authenticated execute = false.
--   - v2 profile function returns only whitelisted fields; verify definition separately if needed.
with public_read_functions(function_name, expected_public_execute) as (
  values
    ('mentor_directory_list_v2', true),
    ('mentor_user_public_v2', true),
    ('mentor_profiles_for_directory_v2', true),
    ('mentor_directory_list', false),
    ('mentor_user_public', false),
    ('mentor_profiles_for_directory', false)
)
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  f.expected_public_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  case
    when has_function_privilege('anon', p.oid, 'EXECUTE') = f.expected_public_execute
     and has_function_privilege('authenticated', p.oid, 'EXECUTE') = f.expected_public_execute
      then 'OK'
    else 'DRIFT'
  end as audit_status
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join public_read_functions f on f.function_name = p.proname
where n.nspname = 'public'
order by function_name, args;

-- =============================================================================
-- C. Storage bucket public flags
-- =============================================================================

-- C1. Buckets that must not be public.
-- Expected: every existing bucket has public = false. Missing buckets mean the related migration is not applied.
with expected_private_buckets(id) as (
  values
    ('student-id-images'),
    ('custom-order-deliverables'),
    ('custom-request-post-attachments'),
    ('community-post-images'),
    ('shortform-videos'),
    ('shortform-thumbnails'),
    ('custom-order-message-attachments')
)
select
  e.id,
  b.name,
  b.public,
  case
    when b.id is null then 'MISSING_OR_NOT_APPLIED'
    when b.public then 'DRIFT: bucket is public'
    else 'OK'
  end as audit_status
from expected_private_buckets e
left join storage.buckets b on b.id = e.id
order by e.id;

-- C2. Drift-only public bucket view.
-- Expected: 0 rows.
with expected_private_buckets(id) as (
  values
    ('student-id-images'),
    ('custom-order-deliverables'),
    ('custom-request-post-attachments'),
    ('community-post-images'),
    ('shortform-videos'),
    ('shortform-thumbnails'),
    ('custom-order-message-attachments')
)
select b.id, b.name, b.public
from storage.buckets b
join expected_private_buckets e on e.id = b.id
where b.public is true
order by b.id;
