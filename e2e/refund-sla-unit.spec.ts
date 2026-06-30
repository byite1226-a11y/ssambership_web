/**
 * 환불 SLA(5일) 남은 일수·강조 판정 단위 시뮬 (PART C: P0 #6).
 */
import { test, expect } from "@playwright/test";
import { refundSlaInfo, isSlaTrackedRequestType, REFUND_SLA_DAYS } from "../lib/admin/refundSla";

const NOW = new Date("2026-06-28T12:00:00Z");
function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
}

test("처리된 건은 SLA 추적 안 함", () => {
  const r = refundSlaInfo(daysAgo(10), "succeeded", NOW);
  expect(r.daysRemaining).toBeNull();
  expect(r.label).toBe("처리됨");
});

test("요청 직후 → 약 5일 남음(ok)", () => {
  const r = refundSlaInfo(daysAgo(0), "pending", NOW);
  expect(r.daysRemaining).toBe(REFUND_SLA_DAYS);
  expect(r.tone).toBe("ok");
});

test("4일 경과 → 1일 남음(임박 soon)", () => {
  const r = refundSlaInfo(daysAgo(4), "pending", NOW);
  expect(r.daysRemaining).toBe(1);
  expect(r.tone).toBe("soon");
});

test("6일 경과 → 1일 초과(over)", () => {
  const r = refundSlaInfo(daysAgo(6), "pending", NOW);
  expect(r.daysRemaining).toBeLessThan(0);
  expect(r.tone).toBe("over");
  expect(r.label).toContain("초과");
});

test("SLA 추적 대상은 멘토중단 환불", () => {
  expect(isSlaTrackedRequestType("subscription_mentor_suspended")).toBe(true);
  expect(isSlaTrackedRequestType("subscription_prorated")).toBe(false);
});
