import { test, expect } from "@playwright/test";
import { ACCOUNTS } from "./helpers/auth";
import * as db from "./helpers/db";

/**
 * E2E Phase B — RPC 레벨 돈 검증 (UI 비경유).
 * 시나리오 1·2: 개별질문 예치(hold) → 정산(release) 15/85 무결성을 제품 RPC로 직접 검증.
 * - 사용자 승인 운영 DB. 표식: 제목/idempotency 에 'e2e-test'.
 * - 브라우저 미사용(서버액션 폼 자동화 이슈 우회) — db.admin() 서비스롤 RPC로 흐름 재현.
 * - 멘토 답변확정은 제품 코드와 동일하게 status update(claimed/assigned → answered).
 */

const PRICE_CASH = 5000;
const PRICE_CENTS = PRICE_CASH * 100; // 500,000
const MENTOR_PAYOUT = Math.floor(PRICE_CENTS * 0.85); // 425,000 (85%)
const PLATFORM_FEE = PRICE_CENTS - MENTOR_PAYOUT; // 75,000 (15%)

const admin = db.admin();

/** 멘토 답변 확정(제품 confirmIndividualQuestionAnswerByMentorAction 와 동일 효과): status → answered */
async function mentorConfirmAnswered(questionId: string, fromStatus: string, mentorId: string) {
  const { error } = await admin
    .from("individual_questions")
    .update({ status: "answered", answered_at: new Date().toISOString() })
    .eq("id", questionId)
    .eq("status", fromStatus)
    .or(`designated_mentor_id.eq.${mentorId},claimed_mentor_id.eq.${mentorId}`);
  expect(error, "멘토 답변확정 update 오류 없음").toBeFalsy();
}

test("시나리오1 공개형(RPC): 예치 → 수락 → 답변 → 확정 지급(15/85)", async () => {
  const studentId = await db.userIdByEmail(ACCOUNTS.student.email);
  const mentorId = await db.userIdByEmail(ACCOUNTS.mentor.email);
  const idem = `e2e-test-iq-open:${Date.now()}`;
  const title = `[e2e-test] 공개형(RPC) ${Date.now()}`;

  await db.seedCash(studentId, PRICE_CENTS + 100_000);
  const sBal0 = await db.walletBalance(studentId);
  const mBal0 = await db.walletBalance(mentorId);

  // 1) 예치 + 생성
  const { data: createData, error: createErr } = await admin.rpc("create_individual_question_with_hold_v2", {
    p_student_id: studentId,
    p_question_type: "open",
    p_mentor_id: null,
    p_subject: null,
    p_topic: null,
    p_title: title,
    p_body: "e2e-test 공개형 본문",
    p_price_cents: PRICE_CENTS,
    p_idempotency_key: idem,
    p_required_school_tier: null,
    p_required_major_category: null,
  });
  expect(createErr, "create RPC 오류 없음").toBeFalsy();
  const created = Array.isArray(createData) ? createData[0] : createData;
  expect(created?.ok, "create ok").toBeTruthy();
  const iqId: string = created.question_id;

  let iq = await db.iqById(iqId);
  expect(iq?.question_type).toBe("open");
  expect(iq?.status, "생성 직후 open").toBe("open");
  expect(iq?.price_cents, "price_cents = 캐시×100").toBe(PRICE_CENTS);

  // 예치: 학생 잔액 -price, ledger -price 기록
  expect(await db.walletBalance(studentId), "학생 잔액 = 전 − 예치").toBe(sBal0 - PRICE_CENTS);
  const hold = await db.ledgerForRef(studentId, iqId);
  expect(hold.some((l) => l.delta_cents === -PRICE_CENTS), "cash_ledger 예치 −price").toBeTruthy();

  // 2) 멘토 수락
  const { data: claimData, error: claimErr } = await admin.rpc("claim_individual_question_v2", {
    p_question_id: iqId,
    p_mentor_id: mentorId,
  });
  expect(claimErr, "claim RPC 오류 없음").toBeFalsy();
  const claimed = Array.isArray(claimData) ? claimData[0] : claimData;
  expect(claimed?.ok, "claim ok").toBeTruthy();
  iq = await db.iqById(iqId);
  expect(iq?.status, "수락 후 claimed").toBe("claimed");
  expect(iq?.claimed_mentor_id, "claimed_mentor_id=멘토").toBe(mentorId);

  // 3) 멘토 답변 확정
  await mentorConfirmAnswered(iqId, "claimed", mentorId);
  iq = await db.iqById(iqId);
  expect(iq?.status, "answered").toBe("answered");

  // 4) 학생 [해결됨] → release 지급(85%)
  const { data: relData, error: relErr } = await admin.rpc("release_individual_question_payout", {
    p_question_id: iqId,
  });
  expect(relErr, "release RPC 오류 없음").toBeFalsy();
  const rel = Array.isArray(relData) ? relData[0] : relData;
  expect(rel?.ok, "release ok").toBeTruthy();

  iq = await db.iqById(iqId);
  expect(iq?.status, "released").toBe("released");
  expect(iq?.release_ledger_id, "release_ledger_id 기록").toBeTruthy();

  // 정산: 멘토 +85%, 플랫폼 수수료 15%
  expect(await db.walletBalance(mentorId), "멘토 잔액 += floor(price×0.85)").toBe(mBal0 + MENTOR_PAYOUT);
  const payout = await db.ledgerForRef(mentorId, iqId);
  expect(payout.some((l) => l.delta_cents === MENTOR_PAYOUT), `멘토 지급 +${MENTOR_PAYOUT}(85%)`).toBeTruthy();
  expect(PRICE_CENTS - MENTOR_PAYOUT, "플랫폼 수수료 15%").toBe(PLATFORM_FEE);
});

test("시나리오2 지정형(RPC): 예치 → 답변 → 확정 지급(15/85) ★예치·정산 검증", async () => {
  const studentId = await db.userIdByEmail(ACCOUNTS.student.email);
  const mentorId = await db.userIdByEmail(ACCOUNTS.mentor.email);
  const idem = `e2e-test-iq-direct:${Date.now()}`;
  const title = `[e2e-test] 지정형(RPC) ${Date.now()}`;

  await db.seedCash(studentId, PRICE_CENTS + 100_000);
  const sBal0 = await db.walletBalance(studentId);
  const mBal0 = await db.walletBalance(mentorId);

  // 1) 지정형 예치 + 생성 (type=direct, 멘토 지정) — RPC에 price 직접 전달
  const { data: createData, error: createErr } = await admin.rpc("create_individual_question_with_hold", {
    p_student_id: studentId,
    p_question_type: "direct",
    p_mentor_id: mentorId,
    p_subject: null,
    p_topic: null,
    p_title: title,
    p_body: "e2e-test 지정형 본문",
    p_price_cents: PRICE_CENTS,
    p_idempotency_key: idem,
  });
  expect(createErr, "지정형 create RPC 오류 없음").toBeFalsy();
  const created = Array.isArray(createData) ? createData[0] : createData;
  expect(created?.ok, "지정형 create ok").toBeTruthy();
  const iqId: string = created.question_id;

  let iq = await db.iqById(iqId);
  expect(iq?.question_type).toBe("direct");
  expect(iq?.designated_mentor_id, "designated_mentor_id=멘토").toBe(mentorId);
  expect(iq?.status, "지정형 생성 직후 assigned").toBe("assigned");
  expect(iq?.price_cents).toBe(PRICE_CENTS);

  // 예치
  expect(await db.walletBalance(studentId), "학생 잔액 = 전 − 예치").toBe(sBal0 - PRICE_CENTS);
  const hold = await db.ledgerForRef(studentId, iqId);
  expect(hold.some((l) => l.delta_cents === -PRICE_CENTS), "예치 −price 기록").toBeTruthy();

  // 2) 멘토 답변 확정 (assigned → answered)
  await mentorConfirmAnswered(iqId, "assigned", mentorId);
  iq = await db.iqById(iqId);
  expect(iq?.status, "answered").toBe("answered");

  // 3) 학생 [해결됨] → release 지급(85%)
  const { data: relData, error: relErr } = await admin.rpc("release_individual_question_payout", {
    p_question_id: iqId,
  });
  expect(relErr, "release RPC 오류 없음").toBeFalsy();
  const rel = Array.isArray(relData) ? relData[0] : relData;
  expect(rel?.ok, "release ok").toBeTruthy();

  iq = await db.iqById(iqId);
  expect(iq?.status, "released").toBe("released");
  expect(iq?.release_ledger_id, "release_ledger_id 기록").toBeTruthy();

  // 정산 15/85
  expect(await db.walletBalance(mentorId), "멘토 잔액 += 85%").toBe(mBal0 + MENTOR_PAYOUT);
  const payout = await db.ledgerForRef(mentorId, iqId);
  expect(payout.some((l) => l.delta_cents === MENTOR_PAYOUT), `멘토 지급 +${MENTOR_PAYOUT}(85%)`).toBeTruthy();
});
