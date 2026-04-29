-- P0: block authenticated direct INSERT/UPDATE on subscription tables.
-- App writes go through service_role: insertSubscriptionRow in subscribeCheckoutService.ts
-- - Does not change SELECT policies (except: subscriptions_pair is FOR ALL — dropped and
--   replaced with SELECT-only when no SELECT/ALL policy would remain; see 002_p0/002_app drafts).
-- - Does not change payments, mentor_student_rooms.

DO $$
DECLARE
  nsel int;
BEGIN
  -- public.subscriptions
  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    drop policy if exists "subscriptions_insert_student" on public.subscriptions;
    drop policy if exists "subscriptions_update_student" on public.subscriptions;
    drop policy if exists "subscriptions_self_rw" on public.subscriptions;
    drop policy if exists "subscriptions_pair" on public.subscriptions;

    select coalesce(count(*)::int, 0) into nsel
    from pg_policies
    where schemaname = 'public'
      and tablename = 'subscriptions'
      and cmd in ('SELECT', 'ALL');
    if nsel is null then
      nsel := 0;
    end if;
    if nsel = 0 then
      -- Match 002_p0_subscriptions_questions_draft.sql (student_id, mentor_id).
      -- 002_app_core_schema_draft "subscriptions_pair" used coalesce; if your schema
      -- differs, add a SELECT policy manually.
      create policy "subscriptions_select_parties" on public.subscriptions
        for select to authenticated
        using ( (select auth.uid()) in (student_id, mentor_id) );
    end if;
  end if;

  -- public.mentor_subscriptions
  if to_regclass('public.mentor_subscriptions') is not null then
    drop policy if exists "mentor_subscriptions_insert_student" on public.mentor_subscriptions;
    drop policy if exists "mentor_subscriptions_update_student" on public.mentor_subscriptions;
    drop policy if exists "mentor_subscriptions_self_rw" on public.mentor_subscriptions;
  end if;

  -- public.user_subscriptions
  if to_regclass('public.user_subscriptions') is not null then
    drop policy if exists "user_subscriptions_insert_student" on public.user_subscriptions;
    drop policy if exists "user_subscriptions_update_student" on public.user_subscriptions;
    drop policy if exists "user_subscriptions_self_rw" on public.user_subscriptions;
  end if;
END
$$;

-- Check (run in SQL editor; expect no INSERT/UPDATE for these tables from this migration):
-- SELECT schemaname, tablename, policyname, cmd, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('subscriptions', 'mentor_subscriptions', 'user_subscriptions')
--   AND cmd IN ('INSERT', 'UPDATE')
-- ORDER BY tablename, cmd, policyname;
