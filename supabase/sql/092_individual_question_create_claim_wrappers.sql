-- =============================================================================
-- 092_individual_question_create_claim_wrappers.sql
-- Purpose: Authenticated client RPC wrappers the Flutter app calls by name for
--          individual-question CREATE (escrow hold), CLAIM (open-question
--          first-claim), and ANSWER (mentor posts answer + transition to
--          'answered'). All mutations go through SECURITY DEFINER RPCs to honor
--          070's design (no authenticated direct write on escrow tables).
--
--          The app calls:
--            create_individual_question_as_student {p_question_type,p_title,
--              p_body,p_amount_cents?,p_designated_mentor_id?,p_idempotency_key?}
--            claim_individual_question_as_mentor   {p_question_id}
--            answer_individual_question            {p_question_id, p_body}
--
--          Core escrow RPCs (070/080/081) are service_role only, so these
--          SECURITY DEFINER wrappers enforce "본인 한정" (self-only) and delegate
--          to the existing cores. No new money math is introduced.
--
-- Money-gate (💰) notes:
--   - Wrappers ONLY delegate to existing cores; they add NO amount calculation.
--   - 🔴 v2 호출: create -> create_individual_question_with_hold_v2,
--     claim -> claim_individual_question_v2. v1 코어가 아니라 v2를 호출하여
--     자격(학교tier/전공) 게이트가 항상 적용되도록 일관성을 맞춘다. 단,
--     이 래퍼는 자격 파라미터를 null로만 전달한다(기존 동작과 동일, 추가 제약 없음).
--   - Direct(지정) 질문 가격은 앱이 보내지 않고, 래퍼가 멘토 가격표
--     (mentor_individual_question_pricing.amount_cents)에서 조회한다 = 앱 표시가와
--     동일 소스. 임의 금액 계산을 하지 않는다.
--   - Core idempotency (individual_questions.create_idempotency_key + cash_ledger
--     'iq_hold:') still blocks double-hold. 앱이 키를 보내지 않으면 래퍼가
--     랜덤 키를 생성한다(코어의 NOT NULL 충족용). 진짜 멱등(재시도 중복 예치 방지)을
--     원하면 앱이 안정적인 키를 보내야 한다 — 보고서 미결 항목으로 표기.
--
-- Permission-gate (🔑) notes:
--   - G 교정: 에스크로 테이블 직접쓰기 정책(iq_update_claimed_mentor_answer,
--     iqm_insert_party)을 두지 않는다. 대신 answer_individual_question RPC 가
--     메시지 insert + status='answered' 전이를 원자적으로 처리(070 의 RPC-only
--     변경 설계와 일치, 웹과 동일 잠금). 멘토 권한은 payout 과 동일하게
--     coalesce(claimed_mentor_id, designated_mentor_id) 로 바인딩. 현금 이동 없음.
--   - SELECT 는 070 의 기존 iq_select_party / iqm_select_party(헬퍼
--     user_is_individual_question_party)가 당사자 읽기를 이미 허용 → 추가 없음.
--
-- Safety:
--   - Additive only. Does NOT edit/drop/revoke 070/080/081 core functions.
--   - create/claim/answer 래퍼는 신규 함수명이므로 기존 객체와 충돌 없음.
--   - 신규 RLS 정책 추가 없음(직접쓰기는 RPC 경유로 처리).
--
-- Rollback:
--   drop function if exists public.answer_individual_question(uuid, text);
--   drop function if exists public.claim_individual_question_as_mentor(uuid);
--   drop function if exists public.create_individual_question_as_student(text, text, text, int, uuid, text);
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- RPC wrapper: create (student creates question + escrow hold)
-- App call: rpc('create_individual_question_as_student', { ... })
--   open   : { p_question_type:'open',   p_title, p_body, p_amount_cents }
--   direct : { p_question_type:'direct', p_title, p_body, p_designated_mentor_id }
-- Returns the created individual_questions row (app reads row.first).
-- ---------------------------------------------------------------------------
create or replace function public.create_individual_question_as_student(
  p_question_type text,
  p_title text,
  p_body text,
  p_amount_cents int default null,
  p_designated_mentor_id uuid default null,
  p_idempotency_key text default null
)
returns setof public.individual_questions
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_type text := lower(trim(coalesce(p_question_type, '')));
  v_idem text := nullif(trim(coalesce(p_idempotency_key, '')), '');
  v_price int;
  v_res public.individual_question_escrow_result;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  if v_type not in ('direct', 'open') then
    raise exception 'INVALID_INPUT: question_type must be direct or open'
      using errcode = '22023';
  end if;

  if length(trim(coalesce(p_title, ''))) = 0
     or length(trim(coalesce(p_body, ''))) = 0 then
    raise exception 'INVALID_INPUT: title and body are required'
      using errcode = '22023';
  end if;

  -- 가격 결정: open 은 앱이 보낸 금액, direct 은 멘토 가격표에서 조회.
  if v_type = 'direct' then
    if p_designated_mentor_id is null then
      raise exception 'INVALID_INPUT: designated_mentor_id is required for direct'
        using errcode = '22023';
    end if;

    select amount_cents
      into v_price
    from public.mentor_individual_question_pricing
    where mentor_id = p_designated_mentor_id;

    if v_price is null then
      raise exception 'MENTOR_PRICE_NOT_SET' using errcode = 'P0001';
    end if;
  else
    v_price := p_amount_cents;
    if v_price is null or v_price <= 0 then
      raise exception 'INVALID_INPUT: amount_cents must be positive for open'
        using errcode = '22023';
    end if;
  end if;

  -- 멱등성 키: 앱이 안 보내면 랜덤 생성(코어 NOT NULL 충족용).
  if v_idem is null then
    v_idem := 'iqc:' || gen_random_uuid()::text;
  end if;

  -- 🔴 v2 코어 호출(자격 게이트 일관). 자격 파라미터는 null 만 전달.
  v_res := public.create_individual_question_with_hold_v2(
    v_uid,                       -- p_student_id (self only)
    v_type,                      -- p_question_type
    p_designated_mentor_id,      -- p_mentor_id (direct only; null for open)
    null,                        -- p_subject
    null,                        -- p_topic
    p_title,                     -- p_title
    p_body,                      -- p_body
    v_price,                     -- p_price_cents
    v_idem,                      -- p_idempotency_key
    null,                        -- p_required_school_tier
    null                         -- p_required_major_category
  );

  if not v_res.ok then
    raise exception 'INDIVIDUAL_QUESTION_CREATE_FAILED:%:%', v_res.code, v_res.message
      using errcode = 'P0001';
  end if;

  return query
    select * from public.individual_questions where id = v_res.question_id;
end;
$function$;

revoke all on function public.create_individual_question_as_student(text, text, text, int, uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_individual_question_as_student(text, text, text, int, uuid, text)
  to authenticated;
comment on function public.create_individual_question_as_student(text, text, text, int, uuid, text) is
  'Authenticated client wrapper for individual-question create + escrow hold. Self(student)-only; delegates to create_individual_question_with_hold_v2 (v2, qualification params null). Direct price looked up from mentor_individual_question_pricing. Adds no money math.';

-- ---------------------------------------------------------------------------
-- RPC wrapper: claim (mentor first-claims an open question)
-- App call: rpc('claim_individual_question_as_mentor', { p_question_id })
-- ---------------------------------------------------------------------------
create or replace function public.claim_individual_question_as_mentor(
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

  -- 🔴 v2 코어 호출(자격 게이트 일관). 멘토 = auth.uid() 강제.
  v_res := public.claim_individual_question_v2(p_question_id, v_uid);

  if not v_res.ok then
    raise exception 'INDIVIDUAL_QUESTION_CLAIM_FAILED:%:%', v_res.code, v_res.message
      using errcode = 'P0001';
  end if;

  return v_res;
end;
$function$;

revoke all on function public.claim_individual_question_as_mentor(uuid)
  from public, anon, authenticated;
grant execute on function public.claim_individual_question_as_mentor(uuid)
  to authenticated;
comment on function public.claim_individual_question_as_mentor(uuid) is
  'Authenticated client wrapper for open individual-question first-claim. Self(mentor=auth.uid())-only; delegates to claim_individual_question_v2 (v2, qualification gate). Adds no money math.';

-- ---------------------------------------------------------------------------
-- RPC: answer (mentor posts answer + transition to 'answered') — G 교정
--   070 설계 원칙: 개별질문(에스크로) 테이블은 authenticated 직접 insert/update
--   를 두지 않고, 모든 변경은 service_role/SECURITY DEFINER RPC 로만(070 주석).
--   → 앱 answer() 의 직접 insert+update 2회를 이 단일 RPC 로 대체(웹과 동일 잠금).
--   → 따라서 직접쓰기 정책(iq_update_claimed_mentor_answer, iqm_insert_party)은
--     두지 않는다. SELECT 는 070 의 기존 iqm_select_party / iq_select_party 가
--     이미 당사자 읽기를 허용하므로 추가 불필요.
--
-- 멘토 바인딩: payout(release_individual_question_payout)이 정산 대상으로
--   coalesce(claimed_mentor_id, designated_mentor_id) 를 쓰므로 answer 권한도
--   동일하게 바인딩한다. (open=claimed_mentor_id, direct=designated_mentor_id;
--   claimed 단독 체크는 direct 질문에서 실패하므로 금지.)
-- status 가드: 070 CHECK 값 기준 답변 가능 상태만 허용 = 'claimed'(open 클레임 후),
--   'assigned'(direct 지정). 그 외(escrowed/open/answered/released/refunded/
--   expired/canceled)는 거부. 현금 이동 없음(정산은 별도 release RPC).
-- ---------------------------------------------------------------------------
create or replace function public.answer_individual_question(
  p_question_id uuid,
  p_body text
)
returns setof public.individual_questions
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_question public.individual_questions%rowtype;
  v_mentor_id uuid;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  if coalesce(btrim(p_body), '') = '' then
    raise exception 'INVALID_INPUT: body is required' using errcode = '22023';
  end if;

  select *
    into v_question
  from public.individual_questions
  where id = p_question_id
  for update;

  if not found then
    raise exception 'QUESTION_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- payout 과 동일한 멘토 해석(open=claimed, direct=designated).
  v_mentor_id := coalesce(v_question.claimed_mentor_id, v_question.designated_mentor_id);
  if v_mentor_id is null or v_mentor_id <> v_uid then
    raise exception 'NOT_QUESTION_MENTOR' using errcode = '42501';
  end if;

  if v_question.status not in ('claimed', 'assigned') then
    raise exception 'NOT_ANSWERABLE_STATUS:%', v_question.status using errcode = 'P0001';
  end if;

  insert into public.individual_question_messages (question_id, author_id, body)
  values (p_question_id, v_uid, p_body);

  update public.individual_questions
  set status = 'answered',
      answered_at = coalesce(answered_at, now())
  where id = p_question_id
  returning * into v_question;

  return next v_question;
end;
$function$;

revoke all on function public.answer_individual_question(uuid, text)
  from public, anon;
grant execute on function public.answer_individual_question(uuid, text)
  to authenticated;
comment on function public.answer_individual_question(uuid, text) is
  'Authenticated wrapper: mentor posts an answer message + transitions question to answered, atomically. Mentor = coalesce(claimed_mentor_id, designated_mentor_id) (matches payout). No cash movement. Replaces app direct insert/update to keep 070 RPC-only mutation design.';

commit;
