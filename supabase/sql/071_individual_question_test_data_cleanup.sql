-- =============================================================================
-- 071_individual_question_test_data_cleanup.sql  (one-off 정리 스크립트, 마이그레이션 아님)
--
-- 목적:
--   개별질문 캐시 단위(×100) 정규화 코드 배포 "전에", 구 규약(1캐시=1cent로 100배
--   작게 저장)된 테스트 개별질문을 안전하게 정리한다. 코드가 ÷100 표시로 바뀌면 구
--   데이터가 1/100로 보이고, 활성 예치(hold)는 에스크로와 어긋나므로 먼저 청소한다.
--
-- 실행 환경:
--   Supabase SQL Editor (service_role). 아래 (1)~(4)를 "순서대로", 단계별로 실행.
--
-- ⚠️ 절대 순서 (돈):
--   (1) 점검 → (2) 진행 중 예치 환불(070 RPC) → (3) 행 삭제 → (4) 단가 정리
--   환불(2) 없이 삭제(3)하면 학생 지갑에 예치금이 묶인 채 질문만 사라진다. 반드시 환불 먼저.
--
-- 안전 원칙:
--   - 환불은 070 `refund_individual_question_hold` RPC만 경유(멱등). 지갑/원장 직접 조작 금지.
--   - cash_ledger(append-only)는 삭제하지 않는다. 방금 기록한 환불 내역이 들어 있다.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- (1) 점검 — 먼저 현황을 확인한다 (삭제/환불 전에 반드시 실행)
-- ---------------------------------------------------------------------------

-- 1-a) status별 건수
select status, count(*) as n
from public.individual_questions
group by status
order by status;

-- 1-b) 아직 정리되지 않은 "예치 진행 중" 목록 (released/refunded 가 아닌 건 = 환불 대상)
--      answered 도 아직 미지급이므로 환불 대상이다.
select
  id,
  student_id,
  question_type,
  status,
  price_cents,           -- 구 규약값(원=cents). 환불은 이 값을 그대로 학생 지갑에 되돌린다.
  hold_ledger_id,
  release_ledger_id,
  refund_ledger_id,
  created_at
from public.individual_questions
where release_ledger_id is null
  and refund_ledger_id is null
  and status in ('escrowed', 'open', 'assigned', 'claimed', 'answered')
order by created_at;


-- ---------------------------------------------------------------------------
-- (2) 진행 중 예치 환불 — 070 RPC(멱등)로 학생 지갑 복구 + status='refunded'
--     이미 지급/환불된 건은 RPC가 스스로 스킵(already_released/already_refunded).
-- ---------------------------------------------------------------------------

do $$
declare
  r   record;
  res public.individual_question_escrow_result;
begin
  for r in
    select id
    from public.individual_questions
    where release_ledger_id is null
      and refund_ledger_id is null
      and status in ('escrowed', 'open', 'assigned', 'claimed', 'answered')
    order by created_at
  loop
    select * into res from public.refund_individual_question_hold(r.id);
    raise notice 'refund % -> ok=% code=% status=%', r.id, res.ok, res.code, res.status;
  end loop;
end $$;

-- 2-확인) 환불 후 남은 미정리 예치 (반드시 0건이어야 (3) 삭제 진행)
select
  id, status, hold_ledger_id, release_ledger_id, refund_ledger_id
from public.individual_questions
where release_ledger_id is null
  and refund_ledger_id is null
  and status in ('escrowed', 'open', 'assigned', 'claimed', 'answered');


-- ---------------------------------------------------------------------------
-- (3) 테스트 개별질문 행 삭제
--     attachments/messages 는 FK ON DELETE CASCADE 이지만, 명시 삭제 후 본체 삭제로 안전하게.
--     (cash_ledger 는 건드리지 않는다 — append-only, 환불 내역 보존)
-- ---------------------------------------------------------------------------

delete from public.individual_question_attachments
  where question_id in (select id from public.individual_questions);

delete from public.individual_question_messages
  where question_id in (select id from public.individual_questions);

delete from public.individual_questions;

-- 3-확인) 0건이어야 함
select count(*) as remaining_questions from public.individual_questions;


-- ---------------------------------------------------------------------------
-- (4) 멘토 개별질문 단가 테스트값 정리 — 새 규칙(원→×100 저장)으로 다시 입력할 것이므로 비운다.
-- ---------------------------------------------------------------------------

select * from public.mentor_individual_question_pricing;   -- 점검
delete from public.mentor_individual_question_pricing;      -- 정리


-- ---------------------------------------------------------------------------
-- (선택) Storage 테스트 첨부 정리
--   버킷 'individual-question-attachments' 의 객체는 Supabase 대시보드 Storage 에서
--   삭제하거나 storage API 로 정리한다. (질문 행이 삭제되어 더는 참조되지 않음)
--   SQL로 직접 지우려면 아래 — 신중히:
--   delete from storage.objects where bucket_id = 'individual-question-attachments';
-- ---------------------------------------------------------------------------
