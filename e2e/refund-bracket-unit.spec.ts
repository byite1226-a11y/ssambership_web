/**
 * 학원법 별표4 분기형 환불 계산 단위 시뮬 — 노드 환경에서 함수 직접 실행.
 * (브라우저 fixture 불필요. Playwright 러너는 spec 실행에만 사용.)
 */
import { test, expect } from "@playwright/test";
import {
  computeProratedRefundEstimate,
  refundBracketLabelKo,
} from "../lib/subscribe/subscriptionRefundProration";

const AMOUNT = 100_000; // 100,000 캐시 (cents)
const DAY_MS = 24 * 60 * 60 * 1000;
const START = new Date("2026-06-01T00:00:00Z");
const END = new Date(START.getTime() + 30 * DAY_MS); // 30일 후

function at(daysFromStart: number): Date {
  return new Date(START.getTime() + daysFromStart * DAY_MS);
}

test("(A) 학원법 별표4 — 학생자발 모드 케이스별 금액", async () => {
  const base = {
    amountCents: AMOUNT,
    periodStartIso: START.toISOString(),
    periodEndIso: END.toISOString(),
    mode: "student_voluntary" as const,
  };

  const cases: Array<{
    label: string;
    args: Parameters<typeof computeProratedRefundEstimate>[0];
    expectedAmount: number;
    expectedBracket: string;
  }> = [
    // 이용 개시 전 — 어떤 시점이든 전액
    { label: "이용 개시 전 (5일 경과)", args: { ...base, now: at(5), usageStarted: false }, expectedAmount: 100_000, expectedBracket: "before_usage" },
    { label: "이용 개시 전 (20일 경과)", args: { ...base, now: at(20), usageStarted: false }, expectedAmount: 100_000, expectedBracket: "before_usage" },

    // 이용 개시 후 — 경과율 분기
    { label: "0일 경과 (0%)", args: { ...base, now: at(0.001), usageStarted: true }, expectedAmount: 66_666, expectedBracket: "lt_1_3" },
    { label: "5일 경과 (16.7%)", args: { ...base, now: at(5), usageStarted: true }, expectedAmount: 66_666, expectedBracket: "lt_1_3" },
    { label: "9일 경과 (30%)", args: { ...base, now: at(9), usageStarted: true }, expectedAmount: 66_666, expectedBracket: "lt_1_3" },
    { label: "10일 경과 (33.3% 경계 직후)", args: { ...base, now: at(10.001), usageStarted: true }, expectedAmount: 50_000, expectedBracket: "lt_1_2" },
    { label: "14일 경과 (46.7%)", args: { ...base, now: at(14), usageStarted: true }, expectedAmount: 50_000, expectedBracket: "lt_1_2" },
    { label: "15일 경과 (50% 경계)", args: { ...base, now: at(15.001), usageStarted: true }, expectedAmount: 0, expectedBracket: "ge_1_2" },
    { label: "20일 경과 (66.7%)", args: { ...base, now: at(20), usageStarted: true }, expectedAmount: 0, expectedBracket: "ge_1_2" },
    { label: "29일 경과 (96.7%)", args: { ...base, now: at(29), usageStarted: true }, expectedAmount: 0, expectedBracket: "ge_1_2" },
  ];

  for (const c of cases) {
    const r = computeProratedRefundEstimate(c.args);
    expect(r.amountCents, `${c.label} amount`).toBe(c.expectedAmount);
    expect(r.bracketReason, `${c.label} bracket`).toBe(c.expectedBracket);
    expect(r.mode).toBe("student_voluntary");
    console.log(`[student_voluntary] ${c.label.padEnd(34)} → ${r.amountCents.toString().padStart(7)} (${refundBracketLabelKo(r.bracketReason)})`);
  }
});

test("(A) 학원법 별표4 — 멘토중단 모드 (잔여 일할비례 100%)", async () => {
  const base = {
    amountCents: AMOUNT,
    periodStartIso: START.toISOString(),
    periodEndIso: END.toISOString(),
    mode: "mentor_suspended" as const,
  };

  const cases: Array<{ label: string; nowDays: number; minExpect: number; maxExpect: number }> = [
    { label: "0일 경과", nowDays: 0.001, minExpect: 99_000, maxExpect: 100_000 },
    { label: "5일 경과 (16.7%)", nowDays: 5, minExpect: 83_000, maxExpect: 84_000 }, // 83333.x
    { label: "15일 경과 (50%)", nowDays: 15, minExpect: 49_500, maxExpect: 50_500 },
    { label: "20일 경과 (66.7%)", nowDays: 20, minExpect: 33_000, maxExpect: 34_000 },
    { label: "29일 경과 (96.7%)", nowDays: 29, minExpect: 3_000, maxExpect: 4_000 },
  ];

  for (const c of cases) {
    const r = computeProratedRefundEstimate({ ...base, now: at(c.nowDays) });
    expect(r.bracketReason, `${c.label} bracket`).toBe("mentor_remaining");
    expect(r.mode).toBe("mentor_suspended");
    expect(r.amountCents, `${c.label} amount in range`).toBeGreaterThanOrEqual(c.minExpect);
    expect(r.amountCents).toBeLessThanOrEqual(c.maxExpect);
    console.log(`[mentor_suspended] ${c.label.padEnd(34)} → ${r.amountCents.toString().padStart(7)}`);
  }
});

test("(A) 학원법 별표4 — 입력 invalid 케이스", async () => {
  // 금액 0
  let r = computeProratedRefundEstimate({
    amountCents: 0,
    periodStartIso: START.toISOString(),
    periodEndIso: END.toISOString(),
    usageStarted: true,
  });
  expect(r.amountCents).toBe(0);
  expect(r.bracketReason).toBe("invalid");

  // 주기 end <= start
  r = computeProratedRefundEstimate({
    amountCents: AMOUNT,
    periodStartIso: END.toISOString(),
    periodEndIso: START.toISOString(),
    usageStarted: true,
  });
  expect(r.bracketReason).toBe("invalid");

  // 날짜 null
  r = computeProratedRefundEstimate({
    amountCents: AMOUNT,
    periodStartIso: null,
    periodEndIso: null,
    usageStarted: true,
  });
  expect(r.bracketReason).toBe("invalid");
});

test("(A) 회귀: 우리(일할비례) vs 학원법 — 격차 표 출력", async () => {
  const base = {
    amountCents: AMOUNT,
    periodStartIso: START.toISOString(),
    periodEndIso: END.toISOString(),
    mode: "student_voluntary" as const,
    usageStarted: true,
  };
  console.log("\n[격차표] 경과일 | 단순일할비례 | 학원법(분기) | 학원법<단순");
  for (const days of [0.5, 5, 9, 10, 14, 15, 20, 25, 29]) {
    const lawful = computeProratedRefundEstimate({ ...base, now: at(days) });
    // 단순 일할비례 모드는 mentor_suspended 모드로 동일 계산 (사유만 다름)
    const linear = computeProratedRefundEstimate({ ...base, now: at(days), mode: "mentor_suspended" });
    console.log(
      `${days.toFixed(2).padStart(6)} | ${linear.amountCents.toString().padStart(8)} | ${lawful.amountCents.toString().padStart(8)} | ${(linear.amountCents - lawful.amountCents).toString().padStart(8)}`
    );
    // 학원법은 항상 더 보수적(=학생에게 덜 환불)
    expect(lawful.amountCents, `${days}일`).toBeLessThanOrEqual(linear.amountCents);
  }
});
