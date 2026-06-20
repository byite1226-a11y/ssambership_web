-- =============================================================================
-- 080_c_individual_question_qualification.sql
-- Purpose: Store qualification requirements for open individual questions.
--
-- Safety:
--   - Does not edit/drop/revoke 070 create_individual_question_with_hold v1.
--   - Adds nullable qualification columns to individual_questions.
--   - Adds create_individual_question_with_hold_v2 by copying v1 escrow flow
--     and only adding qualification validation + insert columns.
--   - v2 execute remains service_role only.
--   - Does not touch payments, custom-request escrow, refunds, 077 RLS/triggers.
-- =============================================================================

begin;

alter table public.individual_questions
  add column if not exists required_school_tier text,
  add column if not exists required_major_category text;

alter table public.individual_questions
  drop constraint if exists individual_questions_required_school_tier_check,
  add constraint individual_questions_required_school_tier_check
    check (
      required_school_tier is null
      or required_school_tier in ('서연고', '서성한', '중경외시', '건동홍', '그외', '미분류')
    );

alter table public.individual_questions
  drop constraint if exists individual_questions_required_major_category_check,
  add constraint individual_questions_required_major_category_check
    check (
      required_major_category is null
      or required_major_category in ('메디컬', '교육', '인문', '사회상경', '자연', '공학', '예체능', '기타')
    );

create index if not exists idx_iq_open_required_qualification
  on public.individual_questions (
    required_school_tier,
    required_major_category,
    created_at desc
  )
  where question_type = 'open' and status = 'open';

create or replace function public.create_individual_question_with_hold_v2(
  p_student_id uuid,
  p_question_type text,
  p_mentor_id uuid,
  p_subject text,
  p_topic text,
  p_title text,
  p_body text,
  p_price_cents int,
  p_idempotency_key text,
  p_required_school_tier text default null,
  p_required_major_category text default null
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_type text := lower(trim(coalesce(p_question_type, '')));
  v_status text;
  v_idem text := trim(coalesce(p_idempotency_key, ''));
  v_required_school_tier text := nullif(trim(coalesce(p_required_school_tier, '')), '');
  v_required_major_category text := nullif(trim(coalesce(p_required_major_category, '')), '');
  v_question public.individual_questions%rowtype;
  v_ledger_id uuid;
  v_wallet_balance bigint;
  v_wallet_rows int;
begin
  if p_student_id is null then
    return (false, 'invalid_student', 'student_id is required', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if not exists (select 1 from public.users u where u.id = p_student_id and u.role = 'student') then
    return (false, 'invalid_student', 'student must be a student user', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_type not in ('direct', 'open') then
    return (false, 'invalid_type', 'question_type must be direct or open', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_type = 'direct' and p_mentor_id is null then
    return (false, 'mentor_required', 'direct question requires mentor_id', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_type = 'direct' and not public.individual_question_user_is_approved_mentor(p_mentor_id) then
    return (false, 'mentor_not_approved', 'mentor is not approved for individual questions', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if p_price_cents is null or p_price_cents <= 0 then
    return (false, 'invalid_price', 'price_cents must be positive', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if p_price_cents > 1000000000 then
    return (false, 'price_too_large', 'price_cents is too large', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if length(v_idem) = 0 then
    return (false, 'invalid_idempotency_key', 'idempotency_key is required', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if length(trim(coalesce(p_title, ''))) = 0 or length(trim(coalesce(p_body, ''))) = 0 then
    return (false, 'invalid_content', 'title and body are required', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_type <> 'open' then
    v_required_school_tier := null;
    v_required_major_category := null;
  end if;

  if v_required_school_tier is not null
     and v_required_school_tier not in ('서연고', '서성한', '중경외시', '건동홍', '그외', '미분류') then
    return (false, 'invalid_required_school_tier', 'required_school_tier is invalid', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_required_major_category is not null
     and v_required_major_category not in ('메디컬', '교육', '인문', '사회상경', '자연', '공학', '예체능', '기타') then
    return (false, 'invalid_required_major_category', 'required_major_category is invalid', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  select *
    into v_question
  from public.individual_questions
  where create_idempotency_key = v_idem;

  if found then
    select balance_cents
      into v_wallet_balance
    from public.cash_wallets
    where user_id = p_student_id;

    return (
      true,
      'already_exists',
      'individual question already created for idempotency key',
      v_question.id,
      v_question.status,
      v_question.hold_ledger_id,
      v_wallet_balance
    )::public.individual_question_escrow_result;
  end if;

  insert into public.cash_wallets (user_id, balance_cents)
  values (p_student_id, 0)
  on conflict (user_id) do nothing;

  select balance_cents
    into v_wallet_balance
  from public.cash_wallets
  where user_id = p_student_id
  for update;

  -- Re-check idempotency after wallet lock to avoid double debit on concurrent calls.
  select *
    into v_question
  from public.individual_questions
  where create_idempotency_key = v_idem;

  if found then
    return (
      true,
      'already_exists',
      'individual question already created for idempotency key',
      v_question.id,
      v_question.status,
      v_question.hold_ledger_id,
      v_wallet_balance
    )::public.individual_question_escrow_result;
  end if;

  if coalesce(v_wallet_balance, 0) < p_price_cents then
    return (
      false,
      'insufficient_cash',
      'CASH_INSUFFICIENT',
      null,
      null,
      null,
      coalesce(v_wallet_balance, 0)
    )::public.individual_question_escrow_result;
  end if;

  v_status := case when v_type = 'direct' then 'assigned' else 'open' end;

  insert into public.individual_questions (
    student_id,
    question_type,
    designated_mentor_id,
    subject,
    topic,
    title,
    body,
    price_cents,
    status,
    create_idempotency_key,
    required_school_tier,
    required_major_category
  )
  values (
    p_student_id,
    v_type,
    case when v_type = 'direct' then p_mentor_id else null end,
    nullif(trim(coalesce(p_subject, '')), ''),
    nullif(trim(coalesce(p_topic, '')), ''),
    trim(p_title),
    trim(p_body),
    p_price_cents,
    v_status,
    v_idem,
    v_required_school_tier,
    v_required_major_category
  )
  returning * into v_question;

  insert into public.cash_ledger (
    user_id,
    delta_cents,
    reason,
    ref_type,
    ref_id,
    idempotency_key
  )
  values (
    p_student_id,
    -p_price_cents,
    'individual_question_escrow_hold',
    'individual_questions',
    v_question.id,
    'iq_hold:' || v_question.id::text
  )
  on conflict (idempotency_key) do nothing
  returning id into v_ledger_id;

  if v_ledger_id is null then
    raise exception 'INDIVIDUAL_QUESTION_HOLD_LEDGER_CONFLICT';
  end if;

  update public.cash_wallets
  set balance_cents = balance_cents - p_price_cents
  where user_id = p_student_id
    and balance_cents >= p_price_cents
  returning balance_cents into v_wallet_balance;

  get diagnostics v_wallet_rows = row_count;
  if coalesce(v_wallet_rows, 0) = 0 then
    raise exception 'CASH_INSUFFICIENT_AFTER_LOCK' using errcode = 'P0001';
  end if;

  update public.individual_questions
  set hold_ledger_id = v_ledger_id
  where id = v_question.id
  returning * into v_question;

  return (
    true,
    'created',
    'individual question created and cash held',
    v_question.id,
    v_question.status,
    v_ledger_id,
    v_wallet_balance
  )::public.individual_question_escrow_result;
end;
$function$;

revoke all on function public.create_individual_question_with_hold_v2(
  uuid, text, uuid, text, text, text, text, int, text, text, text
) from public, anon, authenticated;

grant execute on function public.create_individual_question_with_hold_v2(
  uuid, text, uuid, text, text, text, text, int, text, text, text
) to service_role;

comment on column public.individual_questions.required_school_tier is
  'Open individual-question qualification requirement: school tier. Null means no requirement.';

comment on column public.individual_questions.required_major_category is
  'Open individual-question qualification requirement: major category. Null means no requirement.';

comment on function public.create_individual_question_with_hold_v2(
  uuid, text, uuid, text, text, text, text, int, text, text, text
) is
  'Q1 individual question create + escrow hold v2. Adds nullable open-question qualification requirements. service_role only.';

commit;

