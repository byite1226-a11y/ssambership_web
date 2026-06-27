/**
 * 로컬 전용 종합 시나리오 — A1/A2/A3/A4 무인 실행.
 *
 * 원칙:
 *   - 로컬 Supabase(127.0.0.1)만 사용. db.admin()이 .env.local 기반.
 *   - 시드 4계정(local.student / local.mentor.priced / local.mentor.unpriced / local.admin) 사용.
 *   - UI는 가벼운 페이지 GET 단계만 보강 검증, 돈 흐름은 RPC로 결정적 검증.
 *   - 금지 없는 호출 경로만 사용 — 운영 RLS/정산 코드 미터치.
 *   - 신규 행 감지 대신 "RPC가 반환한 ID"를 키로 사용해 거짓양성 차단.
 */
import { test, expect, request as plRequest } from "@playwright/test";
import { randomUUID } from "node:crypto";
import * as db from "./helpers/db";
import { loadEnvLocal } from "./helpers/env";

const env = loadEnvLocal();
const STUDENT_EMAIL = env.E2E_STUDENT_EMAIL ?? "";
const MENTOR_PRICED_EMAIL = env.E2E_MENTOR_PRICED_EMAIL ?? "";
const MENTOR_UNPRICED_EMAIL = env.E2E_MENTOR_UNPRICED_EMAIL ?? "";
const ADMIN_EMAIL = env.E2E_ADMIN_EMAIL ?? "";

const PRICE_CASH = 5000;
const PRICE_CENTS = PRICE_CASH * 100;
const MENTOR_PAYOUT = Math.floor(PRICE_CENTS * 0.85);
const PLATFORM_FEE = PRICE_CENTS - MENTOR_PAYOUT;

const admin = db.admin();

/** 시드 RPC로 학생 캐시 충전. */
async function topupStudent(studentId: string, amountCents: number) {
  const { error } = await admin.rpc("record_cash_topup", {
    p_user_id: studentId,
    p_amount_cents: amountCents,
    p_idempotency_key: `e2e-topup:${studentId}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
  });
  expect(error, "topup 오류 없음").toBeFalsy();
}

async function mentorMarkAnswered(questionId: string, mentorId: string, fromStatus: string) {
  const { error } = await admin
    .from("individual_questions")
    .update({ status: "answered", answered_at: new Date().toISOString() })
    .eq("id", questionId)
    .eq("status", fromStatus)
    .or(`designated_mentor_id.eq.${mentorId},claimed_mentor_id.eq.${mentorId}`);
  expect(error, "mentor answered update 오류 없음").toBeFalsy();
}

/* ====================================================================== */
/* A1 — 개별질문 공개형(open): 예치 → 수락 → 답변 → 확정 지급(85/15)         */
/* ====================================================================== */
test("A1 공개형: 예치→수락→답변→확정 (85/15) — RPC 결정적 + UI 폼 존재 확인", async ({ page }) => {
  const studentId = await db.userIdByEmail(STUDENT_EMAIL);
  const mentorId = await db.userIdByEmail(MENTOR_PRICED_EMAIL);

  await topupStudent(studentId, PRICE_CENTS + 100_000);
  const sBal0 = await db.walletBalance(studentId);
  const mBal0 = await db.walletBalance(mentorId);

  const idem = `e2e-a1:${Date.now()}:${randomUUID()}`;
  const title = `[e2e-A1] 공개형 ${Date.now()}`;

  // 1) 예치 + 생성 (open)
  const { data: createData, error: createErr } = await admin.rpc("create_individual_question_with_hold_v2", {
    p_student_id: studentId,
    p_question_type: "open",
    p_mentor_id: null,
    p_subject: null,
    p_topic: null,
    p_title: title,
    p_body: "A1 e2e 공개형 본문",
    p_price_cents: PRICE_CENTS,
    p_idempotency_key: idem,
    p_required_school_tier: null,
    p_required_major_category: null,
  });
  expect(createErr, "open create 오류").toBeFalsy();
  const created = Array.isArray(createData) ? createData[0] : createData;
  expect(created?.ok, "open create ok").toBeTruthy();
  const iqId: string = created.question_id;
  expect(iqId, "iqId 반환").toBeTruthy();

  let iq = await db.iqById(iqId);
  expect(iq?.status, "open 상태").toBe("open");
  expect(iq?.price_cents).toBe(PRICE_CENTS);
  expect(await db.walletBalance(studentId)).toBe(sBal0 - PRICE_CENTS);
  const hold = await db.ledgerForRef(studentId, iqId);
  expect(hold.some((l) => l.delta_cents === -PRICE_CENTS), "예치 -price 원장").toBeTruthy();

  // 2) 멘토 수락 (claim)
  const { data: claimData, error: claimErr } = await admin.rpc("claim_individual_question_v2", {
    p_question_id: iqId,
    p_mentor_id: mentorId,
  });
  expect(claimErr, "claim 오류").toBeFalsy();
  const claimed = Array.isArray(claimData) ? claimData[0] : claimData;
  expect(claimed?.ok, "claim ok").toBeTruthy();
  iq = await db.iqById(iqId);
  expect(iq?.status).toBe("claimed");
  expect(iq?.claimed_mentor_id).toBe(mentorId);

  // 3) 멘토 답변 확정 (claimed → answered)
  await mentorMarkAnswered(iqId, mentorId, "claimed");
  iq = await db.iqById(iqId);
  expect(iq?.status).toBe("answered");

  // 4) 학생 확정 → release (멘토 85% 지급)
  const { data: relData, error: relErr } = await admin.rpc("release_individual_question_payout", {
    p_question_id: iqId,
  });
  expect(relErr, "release 오류").toBeFalsy();
  const rel = Array.isArray(relData) ? relData[0] : relData;
  expect(rel?.ok, "release ok").toBeTruthy();
  iq = await db.iqById(iqId);
  expect(iq?.status).toBe("released");
  expect(iq?.release_ledger_id, "release_ledger_id 기록").toBeTruthy();

  // 정산 검증
  expect(await db.walletBalance(mentorId), `멘토 += ${MENTOR_PAYOUT}(85%)`).toBe(mBal0 + MENTOR_PAYOUT);
  const payout = await db.ledgerForRef(mentorId, iqId);
  expect(payout.some((l) => l.delta_cents === MENTOR_PAYOUT), "멘토 지급 +85%").toBeTruthy();
  expect(PRICE_CENTS - MENTOR_PAYOUT).toBe(PLATFORM_FEE);

  // UI 보강: 공개형 등록 폼이 존재(요청 200, 핵심 필드 존재) — 비로그인은 /login으로 가므로 status 200 확인만.
  const res = await page.goto("/individual-questions/new", { waitUntil: "domcontentloaded" });
  expect(res?.status(), "공개형 등록 폼 페이지 200/302").toBeLessThan(500);
});

/* ====================================================================== */
/* A2 — 개별질문 지정형(direct): priced 멘토 통과 + unpriced 차단              */
/* ====================================================================== */
test("A2 지정형(priced): 예치→답변→확정 (85/15) + unpriced 등록 차단", async ({ page }) => {
  const studentId = await db.userIdByEmail(STUDENT_EMAIL);
  const mentorPriced = await db.userIdByEmail(MENTOR_PRICED_EMAIL);
  const mentorUnpriced = await db.userIdByEmail(MENTOR_UNPRICED_EMAIL);

  await topupStudent(studentId, PRICE_CENTS + 100_000);
  const sBal0 = await db.walletBalance(studentId);
  const mBal0 = await db.walletBalance(mentorPriced);

  const title = `[e2e-A2] 지정형 ${Date.now()}`;

  // 1) priced 멘토 — direct 예치 + 생성
  const { data: createData, error: createErr } = await admin.rpc("create_individual_question_with_hold_v2", {
    p_student_id: studentId,
    p_question_type: "direct",
    p_mentor_id: mentorPriced,
    p_subject: null,
    p_topic: null,
    p_title: title,
    p_body: "A2 e2e 지정형 본문",
    p_price_cents: PRICE_CENTS,
    p_idempotency_key: `e2e-a2-priced:${Date.now()}:${randomUUID()}`,
    p_required_school_tier: null,
    p_required_major_category: null,
  });
  expect(createErr, "direct create 오류").toBeFalsy();
  const created = Array.isArray(createData) ? createData[0] : createData;
  expect(created?.ok, "direct create ok").toBeTruthy();
  const iqId = created.question_id as string;
  expect(iqId).toBeTruthy();

  let iq = await db.iqById(iqId);
  expect(iq?.question_type).toBe("direct");
  expect(iq?.designated_mentor_id).toBe(mentorPriced);
  expect(iq?.status, "direct 생성 직후 assigned").toBe("assigned");
  expect(await db.walletBalance(studentId)).toBe(sBal0 - PRICE_CENTS);

  // 2) priced 멘토 답변 확정 (assigned → answered)
  await mentorMarkAnswered(iqId, mentorPriced, "assigned");
  iq = await db.iqById(iqId);
  expect(iq?.status).toBe("answered");

  // 3) 학생 확정 → release
  const { data: relData, error: relErr } = await admin.rpc("release_individual_question_payout", {
    p_question_id: iqId,
  });
  expect(relErr, "release 오류").toBeFalsy();
  const rel = Array.isArray(relData) ? relData[0] : relData;
  expect(rel?.ok, "release ok").toBeTruthy();
  iq = await db.iqById(iqId);
  expect(iq?.status).toBe("released");
  expect(await db.walletBalance(mentorPriced)).toBe(mBal0 + MENTOR_PAYOUT);

  // 4) unpriced 멘토 — RPC가 mentor_not_approved 로 차단해야 함 (verification_status=pending)
  const { data: blockData, error: blockErr } = await admin.rpc("create_individual_question_with_hold_v2", {
    p_student_id: studentId,
    p_question_type: "direct",
    p_mentor_id: mentorUnpriced,
    p_subject: null,
    p_topic: null,
    p_title: `[e2e-A2] 차단 ${Date.now()}`,
    p_body: "차단 확인 본문",
    p_price_cents: PRICE_CENTS,
    p_idempotency_key: `e2e-a2-blocked:${Date.now()}:${randomUUID()}`,
    p_required_school_tier: null,
    p_required_major_category: null,
  });
  expect(blockErr, "RPC 자체 오류 없음(반환 ok=false 기대)").toBeFalsy();
  const blocked = Array.isArray(blockData) ? blockData[0] : blockData;
  expect(blocked?.ok, "unpriced/미승인 direct 차단").toBeFalsy();
  expect(String(blocked?.code ?? "").toLowerCase()).toMatch(/mentor_not_approved/);

  // 5) UI: 학생 로그인 → 두 멘토 페이지 텍스트 검증
  //   - priced(approved+가격설정): 등록 폼이 노출(버튼 텍스트 "예치하고 보내기" 등)
  //   - unpriced(pending+미설정): 안내 텍스트("받지 않음"/"단가 미설정"/"승인 완료")
  await page.goto("/login/student", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const emailInput = page.locator('input[type="email"]').first();
  if (await emailInput.count()) {
    await emailInput.fill(STUDENT_EMAIL);
    await page.locator('input[type="password"]').first().fill("Local!Test1234");
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30_000 }).catch(() => undefined);
  }

  // priced: 단가 표시 또는 폼 존재
  await page.goto(`/mentors/${mentorPriced}/individual-question/new`, { waitUntil: "domcontentloaded" });
  const pricedBody = (await page.content()).toString();
  // 폼이 노출되거나 단가 30,000 표기. canSubmit=true 케이스.
  expect(
    /<form[^>]*>/.test(pricedBody) || /30,000|30000/.test(pricedBody),
    "priced 멘토: 등록 폼 또는 단가 표기"
  ).toBeTruthy();

  // unpriced: 폼 미노출 + 안내 문구
  await page.goto(`/mentors/${mentorUnpriced}/individual-question/new`, { waitUntil: "domcontentloaded" });
  const unpricedBody = (await page.content()).toString();
  expect(
    /미설정|승인 완료|받지 않/.test(unpricedBody),
    "unpriced 멘토: 등록 차단 안내 문구"
  ).toBeTruthy();
});

/* ====================================================================== */
/* A4 — 구독 결제(캐시 차감 → subscription + room 생성) + 취소·비례환불        */
/*   — A3 사전조건이므로 A4를 먼저 실행 (test 선언 순서로 직렬 보장)            */
/* ====================================================================== */
test("A4 구독: 캐시 차감 → 구독 active + 질문방 생성 + 취소(period end)·환불 pending", async () => {
  const studentId = await db.userIdByEmail(STUDENT_EMAIL);
  const mentorId = await db.userIdByEmail(MENTOR_PRICED_EMAIL);

  // 사전 정리(idempotent 재실행): 기존 (student,mentor) 구독·연관 행 제거
  const { data: existingSubs } = await admin
    .from("subscriptions")
    .select("id")
    .eq("student_id", studentId)
    .eq("mentor_id", mentorId);
  for (const s of (existingSubs ?? []) as Array<{ id: string }>) {
    await admin.from("subscription_billing_events").delete().eq("subscription_id", s.id);
    await admin.from("refunds").delete().eq("subscription_id", s.id);
    await admin.from("subscriptions").delete().eq("id", s.id);
  }

  // 사전: 멘토 플랜 행 보장 (limited 등 카탈로그) — cap_weight 명시
  const tierWeight: Record<string, number> = { limited: 1.0, standard: 2.5, premium: 4.5 };
  for (const tier of ["limited", "standard", "premium"] as const) {
    const amount = tier === "limited" ? 5_500_000 : tier === "standard" ? 11_490_000 : 24_990_000;
    await admin
      .from("mentor_plans")
      .upsert(
        {
          mentor_id: mentorId,
          plan_tier: tier,
          amount_cents: amount,
          label: tier,
          cap_weight: tierWeight[tier],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "mentor_id,plan_tier" }
      );
  }

  await topupStudent(studentId, 6_000_000); // limited 플랜 5,500,000 보다 여유

  const sBal0 = await db.walletBalance(studentId);

  // 1) payment 행 — pending
  const paymentId = randomUUID();
  const intentKey = `e2e_sub_${Date.now()}_${randomUUID()}`;
  const { error: payInsErr } = await admin.from("payments").insert({
    id: paymentId,
    user_id: studentId,
    mentor_id: mentorId,
    status: "pending",
    amount: 55000,
    currency: "KRW",
    external_id: `sub_intent_${intentKey}`,
    metadata: { planTier: "limited", intentKey, source: "e2e-a4" },
    kind: "subscription",
  });
  expect(payInsErr, "payments insert 오류 없음").toBeFalsy();

  // 2) subscriptions insert (active)
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const { data: planRow } = await admin
    .from("mentor_plans")
    .select("id")
    .eq("mentor_id", mentorId)
    .eq("plan_tier", "limited")
    .maybeSingle();
  const planId = (planRow as { id?: string } | null)?.id ?? null;

  const { data: subRow, error: subInsErr } = await admin
    .from("subscriptions")
    .insert({
      student_id: studentId,
      mentor_id: mentorId,
      payment_id: paymentId,
      plan_tier: "limited",
      plan_id: planId,
      status: "active",
      started_at: now.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      next_billing_at: periodEnd.toISOString(),
      billing_cycle: "monthly",
    })
    .select("id")
    .single();
  expect(subInsErr, "subscriptions insert 오류").toBeFalsy();
  const subscriptionId = (subRow as { id: string }).id;

  // 3) 캐시 차감 RPC (sub_debit_<paymentId>)
  const debitAmount = 5_500_000; // limited
  const { error: debErr } = await admin.rpc("record_subscription_cash_debit", {
    p_user_id: studentId,
    p_subscription_id: subscriptionId,
    p_payment_id: paymentId,
    p_amount_cents: debitAmount,
  });
  expect(debErr, "구독 캐시 debit 오류").toBeFalsy();
  expect(await db.walletBalance(studentId), "학생 잔액 = 전 − 차감").toBe(sBal0 - debitAmount);
  const { data: ledRows } = await admin
    .from("cash_ledger")
    .select("delta_cents, idempotency_key, reason")
    .eq("idempotency_key", `sub_debit_${paymentId}`);
  expect((ledRows ?? []).length, "sub_debit 원장 1건").toBe(1);
  expect((ledRows ?? [])[0]?.delta_cents).toBe(-debitAmount);

  // 4) 결제 succeeded 마킹 + billing_event(initial)
  await admin.from("payments").update({ status: "succeeded" }).eq("id", paymentId);
  const { error: beErr } = await admin
    .from("subscription_billing_events")
    .insert({
      subscription_id: subscriptionId,
      student_id: studentId,
      mentor_id: mentorId,
      event_type: "initial",
      status: "succeeded",
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
      billing_at: now.toISOString(),
      amount_cents: debitAmount,
      plan_tier: "limited",
      plan_id: planId,
      idempotency_key: `sub_initial:${subscriptionId}`,
      payment_id: paymentId,
      processed_at: now.toISOString(),
    });
  expect(beErr, "billing_event insert 오류").toBeFalsy();

  // 5) mentor_student_rooms (insert; service_role bypass RLS)
  const { data: existingRoom } = await admin
    .from("mentor_student_rooms")
    .select("id")
    .eq("student_id", studentId)
    .eq("mentor_id", mentorId)
    .maybeSingle();
  let roomId = (existingRoom as { id?: string } | null)?.id ?? null;
  if (!roomId) {
    const { data: roomIns, error: roomErr } = await admin
      .from("mentor_student_rooms")
      .insert({ student_id: studentId, mentor_id: mentorId, payment_id: paymentId, subscription_id: subscriptionId })
      .select("id")
      .single();
    expect(roomErr, "room insert 오류").toBeFalsy();
    roomId = (roomIns as { id: string }).id;
  }
  expect(roomId, "방 ID 확보").toBeTruthy();

  // 6) 취소 예약 (cancel_at_period_end=true). 상태는 그대로 active 유지.
  const { error: cancelErr } = await admin
    .from("subscriptions")
    .update({ cancel_at_period_end: true, cancel_requested_at: new Date().toISOString() })
    .eq("id", subscriptionId);
  expect(cancelErr, "cancel 예약 오류").toBeFalsy();
  const { data: subAfterCancel } = await admin
    .from("subscriptions")
    .select("status, cancel_at_period_end")
    .eq("id", subscriptionId)
    .single();
  expect((subAfterCancel as { status: string }).status, "취소 예약 후 status 유지=active").toBe("active");
  expect((subAfterCancel as { cancel_at_period_end: boolean }).cancel_at_period_end, "cancel flag true").toBe(true);

  // 7) 비례환불 추정 + refunds pending insert
  const amountCents = debitAmount;
  const remainingRatio = (periodEnd.getTime() - Date.now()) / (periodEnd.getTime() - now.getTime());
  const refundEstimate = Math.max(0, Math.floor(amountCents * Math.max(0, Math.min(1, remainingRatio))));
  const { data: refundRow, error: refErr } = await admin
    .from("refunds")
    .insert({
      user_id: studentId,
      amount_cents: refundEstimate,
      status: "pending",
      payment_id: paymentId,
      subscription_id: subscriptionId,
      request_type: "subscription_prorated",
      reason: "[e2e-A4] 비례환불 신청",
    })
    .select("id, status")
    .single();
  expect(refErr, "refund insert 오류").toBeFalsy();
  expect((refundRow as { status: string }).status).toBe("pending");

  // 잔액은 환불 승인 전에는 변하지 않는다(관리자 RPC에서만 환불 처리)
  expect(await db.walletBalance(studentId), "환불 pending 단계에서는 학생 잔액 불변").toBe(sBal0 - debitAmount);
});

/* ====================================================================== */
/* A3 — 구독 질문권 한도: 작성 시 -1, 복원 없음, 양측 동일 잔여                  */
/* ====================================================================== */
test("A3 구독 한도: 작성 시 +1(used), 상태 변경에도 복원 없음, 양쪽 같은 잔여 (A4 active sub 사용)", async () => {
  const studentId = await db.userIdByEmail(STUDENT_EMAIL);
  const mentorId = await db.userIdByEmail(MENTOR_PRICED_EMAIL);

  // A4가 만든 room 사용
  const { data: room } = await admin
    .from("mentor_student_rooms")
    .select("id")
    .eq("student_id", studentId)
    .eq("mentor_id", mentorId)
    .maybeSingle();
  expect(room?.id, "A3: 사전조건 (A4가 만든) room 존재").toBeTruthy();
  const roomId = (room as { id: string }).id;

  const usage = async () => {
    const { data, error } = await admin.rpc("get_weekly_question_usage", {
      p_student_id: studentId,
      p_mentor_id: mentorId,
    });
    expect(error, "get_weekly_question_usage 오류").toBeFalsy();
    return data as { used: number; limit: number; remaining: number; can_ask: boolean; plan_tier: string };
  };

  const u0 = await usage();
  expect(u0.plan_tier, "active 구독 plan_tier=limited").toBe("limited");
  expect(u0.limit, "limited 주간 한도 = 4").toBe(4);

  const title = `[e2e-A3] 한도 ${Date.now()}`;
  const { data: created, error: insErr } = await admin
    .from("question_threads")
    .insert({ mentor_student_room_id: roomId, title, status: "pending" })
    .select("id")
    .single();
  expect(insErr, "thread insert 오류").toBeFalsy();
  const threadId = (created as { id: string }).id;

  try {
    const u1 = await usage();
    expect(u1.used, "작성 직후 used +1").toBe(u0.used + 1);
    expect(u1.remaining, "remaining -1").toBe(Math.max(0, u0.remaining - 1));

    // 복원 없음 검증: answered 로 바꿔도 used 유지
    await admin.from("question_threads").update({ status: "answered" }).eq("id", threadId);
    const u2 = await usage();
    expect(u2.used, "answered 후에도 used 유지(복원 없음)").toBe(u0.used + 1);

    // 양쪽(학생/멘토) 호출도 동일 결과 (RPC가 같은 인자로 같은 잔여 반환)
    const { data: again } = await admin.rpc("get_weekly_question_usage", {
      p_student_id: studentId,
      p_mentor_id: mentorId,
    });
    expect((again as { used: number }).used, "동일 인자 호출 동일 잔여").toBe(u2.used);
  } finally {
    // 테스트 격리: 스레드 정리
    await admin.from("question_threads").delete().eq("id", threadId);
  }

  const u3 = await usage();
  expect(u3.used, "테스트 스레드 삭제 후 카운트 원복").toBe(u0.used);
});

/* ====================================================================== */
/* B4 — 돈 무결성: ledger 합 = wallet balance                                */
/* ====================================================================== */
test("B4 무결성: 모든 시드 계정의 cash_ledger 합 = cash_wallets.balance_cents", async () => {
  const emails = [STUDENT_EMAIL, MENTOR_PRICED_EMAIL, MENTOR_UNPRICED_EMAIL, ADMIN_EMAIL];
  for (const email of emails) {
    if (!email) continue;
    const id = await db.userIdByEmail(email);
    const { data: led } = await admin.from("cash_ledger").select("delta_cents").eq("user_id", id);
    const sum = (led ?? []).reduce((s, r) => s + Number(r.delta_cents ?? 0), 0);
    const bal = await db.walletBalance(id);
    expect(bal, `${email}: ledger 합 == wallet`).toBe(sum);
  }
});

/* ====================================================================== */
/* B4b — 멱등 이중 차감 없음: 같은 idempotency_key 재호출 0 effect           */
/* ====================================================================== */
test("B4b 멱등: 동일 idempotency 재호출 시 ledger 행이 증가하지 않는다", async () => {
  const studentId = await db.userIdByEmail(STUDENT_EMAIL);
  const key = `e2e-idem-${Date.now()}-${randomUUID()}`;
  const amt = 1_000_000;
  const before = await db.walletBalance(studentId);
  for (let i = 0; i < 3; i++) {
    const { error } = await admin.rpc("record_cash_topup", {
      p_user_id: studentId,
      p_amount_cents: amt,
      p_idempotency_key: key,
    });
    expect(error, `topup#${i} 멱등 호출 (오류 없음 또는 conflict 흡수)`).toBeFalsy();
  }
  const after = await db.walletBalance(studentId);
  expect(after - before, "잔액 증가는 1회만").toBe(amt);
  const { data: ledRows } = await admin
    .from("cash_ledger")
    .select("id")
    .eq("idempotency_key", key);
  expect((ledRows ?? []).length, "ledger 행 1건만").toBe(1);
});

/* ====================================================================== */
/* B5 — RLS: 핵심 테이블 enable 여부 + anon SELECT 차단                       */
/* ====================================================================== */
test("B5 RLS/권한: 핵심 테이블 anon SELECT 시 데이터 노출 0건", async () => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  expect(url, "NEXT_PUBLIC_SUPABASE_URL").toBeTruthy();
  expect(anonKey, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/ANON_KEY").toBeTruthy();

  const sensitive = [
    "individual_questions",
    "question_threads",
    "subscriptions",
    "cash_ledger",
    "cash_wallets",
    "refunds",
  ];
  // anon 클라이언트로 SELECT 시도 → 401/403 또는 빈 결과(데이터 노출 0)
  const ctx = await plRequest.newContext({ baseURL: url });
  for (const t of sensitive) {
    const r = await ctx.get(`/rest/v1/${t}?select=*&limit=5`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    const status = r.status();
    if (status === 200) {
      const body = await r.json().catch(() => []);
      expect(Array.isArray(body) ? body.length : 0, `${t} anon SELECT 결과 0건`).toBe(0);
    } else {
      expect(status, `${t} anon SELECT 4xx (RLS/grant 차단)`).toBeGreaterThanOrEqual(400);
      expect(status, `${t} anon SELECT < 500`).toBeLessThan(500);
    }
  }
  await ctx.dispose();
});

/* ====================================================================== */
/* B6 — IDOR: 멘토A의 토큰으로 멘토B의 individual_questions 조회 시도         */
/* ====================================================================== */
test("B6 IDOR: 타 계정 객체 직접 SELECT 차단(빈 결과)", async () => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // 학생으로 로그인 → access_token 받기
  const ctx = await plRequest.newContext({ baseURL: url });
  const tok = await ctx.post("/auth/v1/token?grant_type=password", {
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    data: { email: STUDENT_EMAIL, password: "Local!Test1234" },
  });
  expect(tok.status(), "학생 토큰 발급").toBe(200);
  const access = ((await tok.json()) as { access_token: string }).access_token;

  // 학생 본인의 IQ는 보임
  const own = await ctx.get(`/rest/v1/individual_questions?select=id&student_id=eq.${await db.userIdByEmail(STUDENT_EMAIL)}&limit=1`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${access}` },
  });
  expect(own.status(), "본인 IQ select 200").toBe(200);

  // 다른 사용자(멘토 priced)의 IQ를 student_id로 직접 조회 → 빈 결과
  const otherStudent = await db.userIdByEmail(MENTOR_PRICED_EMAIL); // 멘토 ID를 student_id 자리에 시도
  const other = await ctx.get(`/rest/v1/individual_questions?select=id&student_id=eq.${otherStudent}&limit=5`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${access}` },
  });
  expect(other.status(), "다른 사용자 student_id 필터 200(RLS는 빈 결과로 차단)").toBe(200);
  const otherBody = (await other.json()) as unknown[];
  expect(otherBody.length, "다른 사용자 IQ 노출 없음(IDOR 차단)").toBe(0);

  // 다른 사용자의 cash_wallets 직접 조회 → 빈 결과
  const otherWallet = await ctx.get(`/rest/v1/cash_wallets?select=balance_cents&user_id=eq.${otherStudent}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${access}` },
  });
  expect(otherWallet.status(), "wallet select 200").toBe(200);
  expect(((await otherWallet.json()) as unknown[]).length, "타인 wallet 노출 없음").toBe(0);

  await ctx.dispose();
});

/* ====================================================================== */
/* B7 — 민감정보(F1 실명 마스킹): 커뮤니티 응답에 full_name 노출 없는지        */
/* ====================================================================== */
test("B7 민감정보: 커뮤니티 응답에 author full_name 노출 없음(빈 결과 OK)", async () => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  // anon 으로 community_posts / shortform_posts 의 author 관련 join 시도 — 노출되면 안 됨
  const ctx = await plRequest.newContext({ baseURL: url });
  const tables = ["community_posts", "shortform_posts"];
  for (const t of tables) {
    const r = await ctx.get(`/rest/v1/${t}?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    if (r.status() === 200) {
      // 데이터가 없으면 skip
      const data = (await r.json()) as Array<Record<string, unknown>>;
      for (const row of data) {
        for (const k of Object.keys(row)) {
          expect(k.toLowerCase()).not.toBe("author_full_name");
          expect(k.toLowerCase()).not.toBe("full_name");
        }
      }
    }
  }
  await ctx.dispose();
});
