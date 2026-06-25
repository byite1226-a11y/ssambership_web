-- 092_individual_question_fee_15pct.sql
-- 개별질문 플랫폼 수수료 0% → 15% (멘토 전액 → 85%). 수수료 정책 변경 255.
--
-- 변경점(돈): release_individual_question_payout 의 멘토 지급액을
--   price_cents 전액 → floor(price_cents * 0.85). 플랫폼 15%는 hold 차액으로 implicit 보관
--   (맞춤의뢰 055 방식과 동일 — 별도 platform wallet/ledger 만들지 않음).
--   · 070의 함수 본문을 그대로 두고 지급액 2곳(cash_ledger delta + wallet credit)만 v_mentor_cents로 통일.
--   · 멱등성(idempotency_key 'iq_payout:{id}', on conflict do nothing, v_new_ledger 가드) 보존.
--   · hold/refund 로직·다른 개별질문 RPC(create/claim/refund) 미터치.
-- 소급 안 함: 이미 released된 과거 건은 전액 지급된 그대로. 신규 release만 85%.
-- 표시: 개별질문은 멘토 정산 화면 합산·수수료 라벨이 없어 앱 변경 없음(멘토 cash_ledger/잔액에 85% 자동 반영).
--
-- 실행: 검토 후 Supabase SQL Editor에서 전체 실행. (service_role 전용 RPC)
-- ⚠️ 090(맞춤의뢰)·091(구독)·092(개별질문) 세 파일을 함께 실행 권장(번호순 090→091→092).

begin;

create or replace function public.release_individual_question_payout(
  p_question_id uuid
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_question public.individual_questions%rowtype;
  v_mentor_id uuid;
  v_ledger_id uuid;
  v_wallet_balance bigint;
  v_new_ledger boolean := false;
  v_mentor_cents bigint;  -- 255: 멘토 지급 = floor(price_cents * 0.85), 플랫폼 15% 차액 implicit
begin
  if p_question_id is null then
    return (false, 'invalid_question', 'question_id is required', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  select *
    into v_question
  from public.individual_questions
  where id = p_question_id
  for update;

  if not found then
    return (false, 'not_found', 'individual question not found', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_question.release_ledger_id is not null or v_question.status = 'released' then
    return (true, 'already_released', 'individual question already released', v_question.id, v_question.status, v_question.release_ledger_id, null)::public.individual_question_escrow_result;
  end if;

  if v_question.refund_ledger_id is not null or v_question.status = 'refunded' then
    return (false, 'already_refunded', 'individual question already refunded', v_question.id, v_question.status, v_question.refund_ledger_id, null)::public.individual_question_escrow_result;
  end if;

  if v_question.status <> 'answered' then
    return (false, 'not_answered', 'question must be answered before payout', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
  end if;

  if v_question.hold_ledger_id is null then
    return (false, 'hold_missing', 'escrow hold ledger is missing', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
  end if;

  v_mentor_id := coalesce(v_question.claimed_mentor_id, v_question.designated_mentor_id);
  if v_mentor_id is null then
    return (false, 'mentor_missing', 'mentor is missing', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
  end if;

  if exists (
    select 1
    from public.cash_ledger l
    where l.idempotency_key = 'iq_refund:' || v_question.id::text
      and l.reason = 'individual_question_refund'
  ) then
    return (false, 'already_refunded', 'refund ledger already exists', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
  end if;

  -- 멘토 몫 85% (플랫폼 15%는 price_cents - v_mentor_cents = hold 차액으로 남김)
  v_mentor_cents := floor(v_question.price_cents::numeric * 0.85)::bigint;
  if v_mentor_cents <= 0 then
    return (false, 'invalid_payout', 'mentor payout amount must be positive', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
  end if;

  insert into public.cash_ledger (
    user_id,
    delta_cents,
    reason,
    ref_type,
    ref_id,
    idempotency_key
  )
  values (
    v_mentor_id,
    v_mentor_cents,
    'individual_question_payout',
    'individual_questions',
    v_question.id,
    'iq_payout:' || v_question.id::text
  )
  on conflict (idempotency_key) do nothing
  returning id into v_ledger_id;

  if v_ledger_id is not null then
    v_new_ledger := true;
  else
    select id
      into v_ledger_id
    from public.cash_ledger
    where idempotency_key = 'iq_payout:' || v_question.id::text
      and reason = 'individual_question_payout';
  end if;

  if v_ledger_id is null then
    raise exception 'INDIVIDUAL_QUESTION_PAYOUT_LEDGER_MISSING';
  end if;

  if v_new_ledger then
    insert into public.cash_wallets (user_id, balance_cents)
    values (v_mentor_id, 0)
    on conflict (user_id) do nothing;

    update public.cash_wallets
    set balance_cents = balance_cents + v_mentor_cents
    where user_id = v_mentor_id
    returning balance_cents into v_wallet_balance;

    if not found then
      raise exception 'INDIVIDUAL_QUESTION_MENTOR_WALLET_CREDIT_FAILED';
    end if;
  end if;

  update public.individual_questions
  set
    status = 'released',
    released_at = coalesce(released_at, now()),
    release_ledger_id = v_ledger_id
  where id = v_question.id
  returning * into v_question;

  return (true, 'released', 'individual question payout released', v_question.id, v_question.status, v_ledger_id, v_wallet_balance)::public.individual_question_escrow_result;
end;
$function$;

comment on function public.release_individual_question_payout(uuid) is
  '255: 15% platform fee. Mentor payout = floor(price_cents*0.85). Platform 15% implicit in hold. Idempotent (iq_payout:{id}). service_role only.';

revoke all on function public.release_individual_question_payout(uuid) from public, anon, authenticated;
grant execute on function public.release_individual_question_payout(uuid) to service_role;

commit;

-- 검증(실행 후 확인):
-- 1) 신규 release 시 멘토 cash_ledger delta = floor(price_cents*0.85), wallet도 동일 증가.
-- 2) 과거 released 건은 그대로(전액). refund(미답변)는 전액 환불 유지(미변경).
