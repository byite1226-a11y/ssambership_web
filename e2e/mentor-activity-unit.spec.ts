/**
 * 멘토 활동 상태 판정 단위 시뮬 (PART B: P0 #5).
 */
import { test, expect } from "@playwright/test";
import {
  mentorActivityState,
  mentorAcceptsNewSubscriptions,
  canRequestNormalRest,
  clampPauseDays,
  addDaysIso,
  MENTOR_MAX_PAUSE_DAYS,
} from "../lib/mentor/mentorActivity";

const NOW = new Date("2026-06-28T00:00:00Z");

test("active → 신규 구독 허용", () => {
  expect(mentorActivityState({ activity_status: "active" }, NOW)).toBe("active");
  expect(mentorAcceptsNewSubscriptions({ activity_status: "active" }, NOW)).toBe(true);
});

test("paused(미래 복귀) → 차단, 과거 복귀 → 자동복귀 active", () => {
  const future = new Date("2026-07-02T00:00:00Z").toISOString();
  const past = new Date("2026-06-25T00:00:00Z").toISOString();
  expect(mentorActivityState({ activity_status: "paused", pause_until: future }, NOW)).toBe("paused");
  expect(mentorAcceptsNewSubscriptions({ activity_status: "paused", pause_until: future }, NOW)).toBe(false);
  expect(mentorActivityState({ activity_status: "paused", pause_until: past }, NOW)).toBe("active");
});

test("terminating / terminated → 신규 구독 차단", () => {
  expect(mentorAcceptsNewSubscriptions({ activity_status: "terminating" }, NOW)).toBe(false);
  expect(mentorAcceptsNewSubscriptions({ activity_status: "terminated" }, NOW)).toBe(false);
});

test("일반휴식 빈도제한 — 6개월 이내 재신청 차단", () => {
  const threeMonthsAgo = new Date("2026-03-28T00:00:00Z").toISOString();
  const sevenMonthsAgo = new Date("2025-11-28T00:00:00Z").toISOString();
  expect(canRequestNormalRest(null, NOW)).toBe(true);
  expect(canRequestNormalRest(threeMonthsAgo, NOW)).toBe(false);
  expect(canRequestNormalRest(sevenMonthsAgo, NOW)).toBe(true);
});

test("일시중단 일수 클램프 1~7", () => {
  expect(clampPauseDays(0)).toBe(1);
  expect(clampPauseDays(3)).toBe(3);
  expect(clampPauseDays(99)).toBe(MENTOR_MAX_PAUSE_DAYS);
});

test("기간 연장 — addDaysIso", () => {
  const base = "2026-06-28T00:00:00.000Z";
  expect(addDaysIso(base, 7, NOW)).toBe("2026-07-05T00:00:00.000Z");
});
