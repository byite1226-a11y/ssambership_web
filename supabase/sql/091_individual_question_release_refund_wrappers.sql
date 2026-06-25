-- =============================================================================
-- 091_individual_question_release_refund_wrappers.sql
-- Purpose: Authenticated client RPC wrappers the Flutter app calls by name for
--          individual-question escrow RELEASE (payout) and REFUND.
--          The app calls release_individual_question / refund_individual_question
--          with {p_question_id}. Core escrow RPCs (070) are service_role only,
--          so these SECURITY DEFINER wrappers enforce "본인(student) 한정" and
--          delegate to the existing core. No new money math is introduced.
--
-- Money-gate (💰) notes:
--   - Wrappers ONLY delegate to existing cores; they add NO amount calculation.
--   - release/refund have NO _v2 in 070, so wrappers call the v1 cores as-is.
--   - Self-only: only the question's student (auth.uid() = student_id) may
--     trigger release(정산) or refund(환불). Mentor/other roles are rejected.
--   - Core idempotency (cash_ledger.idempotency_key 'iq_payout:'/'iq_refund:')
--     still blocks double payout/refund; wrappers do not bypass it.
--
-- Safety:
--   - Additive only. Does NOT edit/drop/revoke 070 core functions.
--   - Does not touch tables, RLS, or other escrow flows.
--   - Reuses public.individual_question_escrow_result return type (070).
--
-- Rollback:
--   drop function if exists public.refund_individual_question(uuid);
--   drop function if exists public.release_individual_question(uuid);
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- RPC wrapper: release (student confirms answer -> mentor payout)
-- App call: rpc('release_individual_question', { p_question_id })
-- ---------------------------------------------------------------------------
create or replace function public.release_individual_question(
  p_question_id uuid
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_res public.individual_question_escrow_result;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  if p_question_id is null then
    raise exception 'INVALID_INPUT: question_id is required' using errcode = '22023';
  end if;

  -- 본인 한정: only the owning student may release/settle their question.
  if not exists (
    select 1
    from public.individual_questions q
    where q.id = p_question_id
      and q.student_id = v_uid
  ) then
    raise exception 'NOT_QUESTION_OWNER' using errcode = '42501';
  end if;

  v_res := public.release_individual_question_payout(p_question_id);

  if not v_res.ok then
    raise exception 'INDIVIDUAL_QUESTION_RELEASE_FAILED:%:%', v_res.code, v_res.message
      using errcode = 'P0001';
  end if;

  return v_res;
end;
$function$;

revoke all on function public.release_individual_question(uuid)
  from public, anon, authenticated;
grant execute on function public.release_individual_question(uuid)
  to authenticated;
comment on function public.release_individual_question(uuid) is
  'Authenticated client wrapper for individual-question payout. Self(student)-only; delegates to release_individual_question_payout (no _v2). Adds no money math.';

-- ---------------------------------------------------------------------------
-- RPC wrapper: refund (student cancels -> escrow returned to student)
-- App call: rpc('refund_individual_question', { p_question_id })
-- ---------------------------------------------------------------------------
create or replace function public.refund_individual_question(
  p_question_id uuid
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_res public.individual_question_escrow_result;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  if p_question_id is null then
    raise exception 'INVALID_INPUT: question_id is required' using errcode = '22023';
  end if;

  -- 본인 한정: only the owning student may refund their question.
  if not exists (
    select 1
    from public.individual_questions q
    where q.id = p_question_id
      and q.student_id = v_uid
  ) then
    raise exception 'NOT_QUESTION_OWNER' using errcode = '42501';
  end if;

  v_res := public.refund_individual_question_hold(p_question_id);

  if not v_res.ok then
    raise exception 'INDIVIDUAL_QUESTION_REFUND_FAILED:%:%', v_res.code, v_res.message
      using errcode = 'P0001';
  end if;

  return v_res;
end;
$function$;

revoke all on function public.refund_individual_question(uuid)
  from public, anon, authenticated;
grant execute on function public.refund_individual_question(uuid)
  to authenticated;
comment on function public.refund_individual_question(uuid) is
  'Authenticated client wrapper for individual-question escrow refund. Self(student)-only; delegates to refund_individual_question_hold (no _v2). Adds no money math.';

commit;
