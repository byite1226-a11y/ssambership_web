-- P0: remove authenticated DELETE (and listed FOR ALL / self_rw) policies on subscription tables.
-- Service role is used for subscription lifecycle from the app; students must not delete rows to bypass status.
-- 028: INSERT/UPDATE already locked down; this file targets DELETE and duplicate drops for self_rw/pair.
-- Does not drop or alter SELECT-only policies (e.g. subscriptions_select_parties). Do not create new DELETE policies.

DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    drop policy if exists "subscriptions_delete_student" on public.subscriptions;
    drop policy if exists "subscriptions_delete_own" on public.subscriptions;
    drop policy if exists "subscriptions_user_delete" on public.subscriptions;
    drop policy if exists "subscriptions_self_rw" on public.subscriptions;
    drop policy if exists "subscriptions_pair" on public.subscriptions;
  end if;

  IF to_regclass('public.mentor_subscriptions') IS NOT NULL THEN
    drop policy if exists "mentor_subscriptions_delete_student" on public.mentor_subscriptions;
    drop policy if exists "mentor_subscriptions_delete_own" on public.mentor_subscriptions;
    drop policy if exists "mentor_subscriptions_user_delete" on public.mentor_subscriptions;
    drop policy if exists "mentor_subscriptions_self_rw" on public.mentor_subscriptions;
    drop policy if exists "mentor_subscriptions_pair" on public.mentor_subscriptions;
  end if;

  IF to_regclass('public.user_subscriptions') IS NOT NULL THEN
    drop policy if exists "user_subscriptions_delete_student" on public.user_subscriptions;
    drop policy if exists "user_subscriptions_delete_own" on public.user_subscriptions;
    drop policy if exists "user_subscriptions_user_delete" on public.user_subscriptions;
    drop policy if exists "user_subscriptions_self_rw" on public.user_subscriptions;
    drop policy if exists "user_subscriptions_pair" on public.user_subscriptions;
  end if;
END
$$;

-- After apply: no INSERT/UPDATE/DELETE policies on these tables (expected 0 rows):
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('subscriptions', 'mentor_subscriptions', 'user_subscriptions')
--   AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
-- ORDER BY tablename, cmd, policyname;

-- SELECT policies for parties (e.g. subscriptions_select_parties) should still exist; verify:
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('subscriptions', 'mentor_subscriptions', 'user_subscriptions')
--   AND cmd = 'SELECT'
-- ORDER BY tablename, policyname;
