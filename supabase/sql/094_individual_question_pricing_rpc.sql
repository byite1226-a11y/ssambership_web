-- =============================================================================
-- 094_individual_question_pricing_rpc.sql
-- Purpose (S3): Restore the mentor self-service write path for individual-question
--               pricing. mentor_individual_question_pricing has RLS on with only
--               a SELECT policy (070 miqp_select_authenticated) → authenticated
--               INSERT/UPDATE is deny-all, so the app's price upsert is blocked.
--               070 도메인 테이블이므로 직접 쓰기 정책 대신 SECURITY DEFINER RPC
--               로 멘토 본인 가격만 upsert (answer_individual_question 와 동일 원칙).
--
-- S3 정적 대조 결과(이 파일이 다루지 않는 항목 — 무변경):
--   - favorites          : 034 에 RLS + select/insert/delete own(user_id) 이미
--                          완비 → 변경 불요. (브리프의 "정책 0개"는 034 번호 충돌
--                          favorites vs admin_disputes 로 인한 정적 대조 착오)
--   - disputes(insert)   : 036 dispute_ins WITH CHECK 가 앱 insert
--                          (custom_request_order_id + student_id=auth.uid(),
--                          mentor_id 미설정) 와 일치 → 무변경.
--                          앱의 custom_request_orders status='disputed' 직접
--                          update 도 003 cro_update(student_id=auth.uid()) 로 허용.
--
-- Permission-gate (🔑):
--   - set_individual_question_price: 멘토 본인(mentor_id = auth.uid()) 가격만
--     upsert. 타인 가격 변경 불가. 현금 이동 없음.
--   - 승인 멘토 한정 게이트는 기본 미적용(아래 주석 토글). 사유: 가격 행은
--     direct 질문에만 쓰이고 direct 생성 시점에 이미 approved-mentor 게이트(080)가
--     적용된다. 미승인 사용자의 가격 행은 inert. 온보딩 단계(승인 전) 가격 설정
--     UX 를 막지 않기 위해 self-only 로 둔다. → 비즈니스 룰 확정 시 토글.
--
-- Money note (💰): 이 값은 direct 질문 hold 금액 산정(091/092 래퍼)에 쓰인다.
--   RPC 는 금액을 받기만 하고 계산하지 않는다(검증: amount_cents > 0).
--
-- Safety:
--   - Additive only. 신규 함수만 추가. 기존 테이블/정책/함수 수정·삭제 없음.
--   - SELECT 정책(miqp_select_authenticated)은 그대로 두어 가격 조회는 유지.
--
-- Rollback:
--   drop function if exists public.set_individual_question_price(int);
-- =============================================================================

begin;

create or replace function public.set_individual_question_price(
  p_amount_cents int
)
returns setof public.mentor_individual_question_pricing
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_mentor uuid := (select auth.uid());
begin
  if v_mentor is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  if coalesce(p_amount_cents, 0) <= 0 then
    raise exception 'INVALID_INPUT: amount_cents must be positive' using errcode = '22023';
  end if;

  -- (옵션·미적용) 승인 멘토 한정 게이트 — 비즈니스 룰 확정 시 주석 해제:
  -- if not public.individual_question_user_is_approved_mentor(v_mentor) then
  --   raise exception 'MENTOR_NOT_APPROVED' using errcode = '42501';
  -- end if;

  insert into public.mentor_individual_question_pricing (mentor_id, amount_cents)
  values (v_mentor, p_amount_cents)
  on conflict (mentor_id) do update
    set amount_cents = excluded.amount_cents,
        updated_at = now();

  return query
    select * from public.mentor_individual_question_pricing where mentor_id = v_mentor;
end;
$function$;

revoke all on function public.set_individual_question_price(int)
  from public, anon;
grant execute on function public.set_individual_question_price(int)
  to authenticated;
comment on function public.set_individual_question_price(int) is
  'Authenticated wrapper: mentor upserts their own individual-question price. Self(mentor=auth.uid())-only; no cash movement. Replaces app direct upsert (070 RPC-only mutation design). Approved-mentor gate optional (off by default).';

commit;
