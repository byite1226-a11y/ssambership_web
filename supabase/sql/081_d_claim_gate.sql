-- =============================================================================
-- 081_d_claim_gate.sql
-- Purpose: Enforce open individual-question qualification requirements at claim.
--
-- Safety:
--   - Does not edit/drop/revoke 070 claim_individual_question v1.
--   - Adds claim_individual_question_v2 with the same signature as v1.
--   - Keeps v1 first-claim UPDATE conditions and ledger/wallet no-op behavior.
--   - Adds only a pre-UPDATE early return guard based on latest approved
--     mentor_school_verifications row.
--   - v2 execute remains service_role only.
--   - Requires 079 school tier CHECK/catalog and 080 individual question
--     qualification columns to be applied first.
-- =============================================================================

begin;

create or replace function public.claim_individual_question_v2(
  p_question_id uuid,
  p_mentor_id uuid
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_question public.individual_questions%rowtype;
  v_required_school_tier text;
  v_required_major_category text;
  v_verified_school_tier text;
  v_verified_major_category text;
begin
  if p_question_id is null or p_mentor_id is null then
    return (false, 'invalid_input', 'question_id and mentor_id are required', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  if not public.individual_question_user_is_approved_mentor(p_mentor_id) then
    return (false, 'mentor_not_approved', 'mentor is not approved for individual questions', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  select
    q.required_school_tier,
    q.required_major_category
    into v_required_school_tier, v_required_major_category
  from public.individual_questions q
  where q.id = p_question_id
    and q.question_type = 'open'
    and q.status = 'open'
    and q.claimed_mentor_id is null
    and (q.expires_at is null or q.expires_at > now())
    and q.student_id <> p_mentor_id;

  if not found then
    return (false, 'not_available', 'question is already claimed, expired, or unavailable', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_required_school_tier is not null or v_required_major_category is not null then
    select
      msv.school_tier,
      msv.verified_major_category
      into v_verified_school_tier, v_verified_major_category
    from public.mentor_school_verifications msv
    where msv.mentor_id = p_mentor_id
      and msv.status = 'approved'
    order by coalesce(msv.reviewed_at, msv.updated_at, msv.created_at) desc, msv.created_at desc
    limit 1;

    if not found then
      return (false, 'mentor_school_verification_required', 'mentor school verification is required for this question', p_question_id, null, null, null)::public.individual_question_escrow_result;
    end if;

    if v_required_school_tier is not null
       and coalesce(v_verified_school_tier, '') <> v_required_school_tier then
      return (false, 'mentor_qualification_not_met', 'mentor school tier does not match this question requirement', p_question_id, null, null, null)::public.individual_question_escrow_result;
    end if;

    if v_required_major_category is not null
       and coalesce(v_verified_major_category, '') <> v_required_major_category then
      return (false, 'mentor_qualification_not_met', 'mentor major category does not match this question requirement', p_question_id, null, null, null)::public.individual_question_escrow_result;
    end if;
  end if;

  update public.individual_questions
  set
    claimed_mentor_id = p_mentor_id,
    claimed_at = now(),
    status = 'claimed'
  where id = p_question_id
    and question_type = 'open'
    and status = 'open'
    and claimed_mentor_id is null
    and (expires_at is null or expires_at > now())
    and student_id <> p_mentor_id
  returning * into v_question;

  if not found then
    return (false, 'not_available', 'question is already claimed, expired, or unavailable', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  return (true, 'claimed', 'individual question claimed', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
end;
$function$;

revoke all on function public.claim_individual_question_v2(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.claim_individual_question_v2(uuid, uuid)
  to service_role;

comment on function public.claim_individual_question_v2(uuid, uuid) is
  'Q1 open individual question first-claim v2. Enforces required school/major qualification against the latest approved mentor_school_verifications row. service_role only.';

commit;

