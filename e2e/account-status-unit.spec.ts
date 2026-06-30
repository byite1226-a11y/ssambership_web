/**
 * 계정 상태(active/suspended/banned) 판정 단위 시뮬 — 노드 환경에서 함수 직접 실행.
 * (PART A: P0 #4 계정 상태 관리)
 */
import { test, expect } from "@playwright/test";
import {
  effectiveAccountStatus,
  accountIsBlocked,
  accountBlockMessage,
} from "../lib/auth/accountStatus";

const NOW = new Date("2026-06-28T00:00:00Z");
const FUTURE = new Date("2026-07-05T00:00:00Z").toISOString();
const PAST = new Date("2026-06-20T00:00:00Z").toISOString();

test("active 계정은 차단되지 않음", () => {
  expect(effectiveAccountStatus({ status: "active" }, NOW)).toBe("active");
  expect(accountIsBlocked({ status: "active" }, NOW)).toBe(false);
  expect(accountBlockMessage({ status: "active" }, NOW)).toBeNull();
});

test("suspended + 미래 만료 → 정지(차단)", () => {
  const info = { status: "suspended", suspended_until: FUTURE };
  expect(effectiveAccountStatus(info, NOW)).toBe("suspended");
  expect(accountIsBlocked(info, NOW)).toBe(true);
  expect(accountBlockMessage(info, NOW)).toContain("일시 정지");
});

test("suspended + 과거 만료 → 자동 해제(active)", () => {
  const info = { status: "suspended", suspended_until: PAST };
  expect(effectiveAccountStatus(info, NOW)).toBe("active");
  expect(accountIsBlocked(info, NOW)).toBe(false);
});

test("suspended + 만료시각 없음(영구 일시정지) → 차단", () => {
  const info = { status: "suspended", suspended_until: null };
  expect(effectiveAccountStatus(info, NOW)).toBe("suspended");
  expect(accountIsBlocked(info, NOW)).toBe(true);
});

test("banned → 영구 차단(만료 무관)", () => {
  const info = { status: "banned", suspended_until: PAST };
  expect(effectiveAccountStatus(info, NOW)).toBe("banned");
  expect(accountIsBlocked(info, NOW)).toBe(true);
  expect(accountBlockMessage(info, NOW)).toContain("영구");
});

test("null/누락 정보 → active 취급(안전 기본값)", () => {
  expect(effectiveAccountStatus(null, NOW)).toBe("active");
  expect(effectiveAccountStatus(undefined, NOW)).toBe("active");
  expect(effectiveAccountStatus({}, NOW)).toBe("active");
});
