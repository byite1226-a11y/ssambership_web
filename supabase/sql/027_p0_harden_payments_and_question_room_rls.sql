-- =============================================================================
-- 027 P0 harden payments and mentor_student_rooms RLS
--
-- Purpose
-- 1. payments:
--    - Authenticated users must NOT update payment status directly.
--    - Payment status changes must happen only through trusted server/service_role flow.
--
-- 2. mentor_student_rooms:
--    - Authenticated users must NOT insert rooms directly from the client.
--    - Room creation must happen through subscription checkout server flow.
--
-- Notes
-- - This migration intentionally does NOT create an authenticated INSERT policy
--   for mentor_student_rooms.
-- - service_role bypasses RLS, so finalizeSubscriptionCheckout can still create
--   or reuse rooms through the server path.
-- - Run this first on staging if possible.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) Harden public.payments
-- -----------------------------------------------------------------------------

-- Remove direct authenticated UPDATE policies.
drop policy if exists "payments_update_own" on public.payments;
drop policy if exists "payments_update_student" on public.payments;
drop policy if exists "payments_user_update" on public.payments;
drop policy if exists "payments_students_update" on public.payments;

-- Remove old broad policy if it exists.
-- This may include UPDATE, so we split read/insert back into narrower policies.
drop policy if exists "payments_self_rw" on public.payments;

-- Keep authenticated read access only for own related rows.
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select to authenticated
  using (
    (select auth.uid()) in (user_id, student_id, payer_id, mentor_id)
  );

-- Allow users to create only pending/processing payment intents for themselves.
-- Actual success/failure status changes must be done by server/service_role.
drop policy if exists "payments_insert_intent" on public.payments;
create policy "payments_insert_intent" on public.payments
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status in ('pending', 'processing')
  );

comment on table public.payments is
  'RLS: authenticated users can select own payments and insert pending intents only. No authenticated UPDATE policy.';


-- -----------------------------------------------------------------------------
-- B) Harden public.mentor_student_rooms
-- -----------------------------------------------------------------------------

-- Remove client-side room creation policies.
drop policy if exists "msr_insert_pair" on public.mentor_student_rooms;
drop policy if exists "msr_insert_with_active_subscription" on public.mentor_student_rooms;

-- Remove old broad policy if it exists.
drop policy if exists "msr_pair" on public.mentor_student_rooms;

-- Keep room visibility for participants.
drop policy if exists "msr_select" on public.mentor_student_rooms;
create policy "msr_select" on public.mentor_student_rooms
  for select to authenticated
  using (
    (select auth.uid()) in (student_id, mentor_id)
  );

-- Remove broad participant UPDATE policy.
-- Room rows should generally be controlled by server/service_role because
-- student_id, mentor_id, and subscription_id are security-sensitive.
drop policy if exists "msr_update_parties" on public.mentor_student_rooms;

comment on table public.mentor_student_rooms is
  'RLS: authenticated users can select participant rooms only. No authenticated INSERT or UPDATE policy. Room creation is server/service_role only.';


-- -----------------------------------------------------------------------------
-- C) Verification queries to run manually after applying this SQL
-- -----------------------------------------------------------------------------

-- 1. payments must have no UPDATE policy.
-- Expected result: 0 rows.
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename = 'payments'
--   AND cmd = 'UPDATE';

-- 2. mentor_student_rooms must have no INSERT policy.
-- Expected result: 0 rows.
-- SELECT policyname, cmd, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename = 'mentor_student_rooms'
--   AND cmd = 'INSERT';

-- 3. mentor_student_rooms must have no UPDATE policy.
-- Expected result: 0 rows, unless you intentionally add a narrower server-reviewed policy later.
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename = 'mentor_student_rooms'
--   AND cmd = 'UPDATE';

-- 4. Detect rooms without subscription_id.
-- Investigate every returned row before launch.
-- SELECT id, student_id, mentor_id, subscription_id, created_at
-- FROM public.mentor_student_rooms
-- WHERE subscription_id IS NULL
-- ORDER BY created_at DESC
-- LIMIT 20;
-- =============================================================================
