import { test, expect } from "@playwright/test";
import { ACCOUNTS } from "./helpers/auth";
import * as db from "./helpers/db";

/**
 * E2E Phase B — RPC/데이터 레벨 구독 검증 (UI 비경유).
 * 시나리오 3: 구독 주간 한도 = "작성 시 차감(count-on-create)·복원 없음"(098).
 * 시나리오 4: 구독 캐시 차감 기록 + 비례환불 추정 금액(읽기 전용 — 운영 활성 구독 보호).
 * 표식: 'e2e-test'. 시나리오3이 만든 테스트 스레드는 종료 시 삭제(운영 주간 한도 미소모).
 */

const admin = db.admin();

async function weeklyUsage(studentId: string, mentorId: string) {
  const { data, error } = await admin.rpc("get_weekly_question_usage", {
    p_student_id: studentId,
    p_mentor_id: mentorId,
  });
  expect(error, "get_weekly_question_usage 오류 없음").toBeFalsy();
  return data as { used: number; limit: number; remaining: number; can_ask: boolean; plan_tier: string };
}

test("시나리오3 구독 한도: 작성 시 차감(+1)·상태변경 복원없음 (098)", async () => {
  const studentId = await db.userIdByEmail(ACCOUNTS.student.email);
  const mentorId = await db.userIdByEmail(ACCOUNTS.mentor.email);

  // 활성 구독 room
  const { data: room } = await admin
    .from("mentor_student_rooms")
    .select("id")
    .eq("student_id", studentId)
    .eq("mentor_id", mentorId)
    .maybeSingle();
  expect(room?.id, "테스트 쌍의 질문방 존재").toBeTruthy();
  const roomId = room!.id as string;

  const u0 = await weeklyUsage(studentId, mentorId);
  expect(u0.limit, "limited 플랜 주간 한도 = 4").toBe(4);
  expect(typeof u0.used, "used 숫자").toBe("number");

  // 작성(스레드 생성, status=pending) → 즉시 카운트
  const title = `[e2e-test] 한도 ${Date.now()}`;
  const { data: created, error: insErr } = await admin
    .from("question_threads")
    .insert({ mentor_student_room_id: roomId, title, status: "pending" })
    .select("id")
    .single();
  expect(insErr, "테스트 스레드 생성 오류 없음").toBeFalsy();
  const threadId = created!.id as string;

  try {
    const u1 = await weeklyUsage(studentId, mentorId);
    expect(u1.used, "작성 즉시 used +1 (확정 전 차감)").toBe(u0.used + 1);
    expect(u1.remaining, "remaining -1").toBe(Math.max(0, u0.remaining - 1));

    // 복원 없음: 상태를 answered 로 바꿔도 (forward 상태군) 여전히 카운트 유지
    await admin.from("question_threads").update({ status: "answered" }).eq("id", threadId);
    const u2 = await weeklyUsage(studentId, mentorId);
    expect(u2.used, "상태 변경 후에도 used 유지(복원 없음)").toBe(u0.used + 1);
  } finally {
    // 테스트 스레드 정리 — 운영 주간 한도를 실제로 소모하지 않도록 제거.
    await admin.from("question_threads").delete().eq("id", threadId);
  }

  // 정리 후 원복 확인(테스트 격리)
  const u3 = await weeklyUsage(studentId, mentorId);
  expect(u3.used, "테스트 스레드 삭제 후 원복").toBe(u0.used);
});

test("시나리오4 구독: 차감 기록 + 비례환불 추정(읽기 전용)", async () => {
  const studentId = await db.userIdByEmail(ACCOUNTS.student.email);
  const mentorId = await db.userIdByEmail(ACCOUNTS.mentor.email);

  // 활성 구독
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, status, plan_tier, current_period_start, current_period_end, payment_id, created_at, started_at")
    .eq("student_id", studentId)
    .eq("mentor_id", mentorId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .maybeSingle();
  expect(sub?.id, "활성 구독 존재").toBeTruthy();

  // (a) 구독 캐시 차감 기록: sub_debit_<paymentId> 멱등 키의 음수 원장 1건 이상
  const { data: debits, error: debErr } = await admin
    .from("cash_ledger")
    .select("delta_cents, idempotency_key, reason")
    .eq("user_id", studentId)
    .like("idempotency_key", "sub_debit_%");
  expect(debErr, "ledger 조회 오류 없음").toBeFalsy();
  expect((debits ?? []).length, "구독 차감 원장 1건 이상").toBeGreaterThan(0);
  for (const d of debits ?? []) {
    expect(d.delta_cents, "구독 차감은 음수").toBeLessThan(0);
  }

  // (b) 비례환불 추정: 최신 성공 billing event 기준 (읽기 전용 — 실제 refund insert 안 함)
  const { data: be } = await admin
    .from("subscription_billing_events")
    .select("amount_cents, period_start, period_end, status, payment_id")
    .eq("subscription_id", sub!.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const succeeded = (be ?? []).find((e) => String(e.status).toLowerCase() === "succeeded") ?? (be ?? [])[0];

  const amountCents = Number(succeeded?.amount_cents ?? 0);
  const startIso = (sub!.current_period_start as string) ?? (succeeded?.period_start as string);
  const endIso = (sub!.current_period_end as string) ?? (succeeded?.period_end as string);

  if (amountCents > 0 && startIso && endIso) {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const now = Date.now();
    expect(end, "기간 end > start").toBeGreaterThan(start);
    const remainingRatio = Math.min(1, Math.max(0, (end - now) / (end - start)));
    const estimate = Math.floor(amountCents * remainingRatio);
    expect(remainingRatio, "잔여비율 0..1").toBeGreaterThanOrEqual(0);
    expect(remainingRatio).toBeLessThanOrEqual(1);
    expect(estimate, "환불 추정 0..결제액").toBeGreaterThanOrEqual(0);
    expect(estimate, "환불 추정 <= 결제액").toBeLessThanOrEqual(amountCents);
    console.log(
      `[scenario4] amount=${amountCents} remainingRatio=${remainingRatio.toFixed(4)} prorated≈${estimate}`
    );
  } else {
    console.log("[scenario4] billing/period 데이터 부족 — 비례환불 추정 식 검증만 스킵(차감 기록은 검증됨).");
  }
});
