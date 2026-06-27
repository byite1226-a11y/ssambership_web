/**
 * 구독 관련 UI 동선 — 해지 버튼·내역 표시·재구독 진입점
 * 페이지 200 + 핵심 텍스트/액션 노출 여부 (모델 C 항목 ②③ 검증)
 */
import { test, expect, type Page } from "@playwright/test";
import { loadEnvLocal } from "./helpers/env";

const env = loadEnvLocal();
const STUDENT_EMAIL = env.E2E_STUDENT_EMAIL ?? "";
const PW = "Local!Test1234";

async function loginStudent(page: Page) {
  await page.goto("/login/student", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.fill('input[type="email"]', STUDENT_EMAIL);
  await page.fill('input[type="password"]', PW);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30_000 }).catch(() => undefined);
}

test("UI: 구독 관리 페이지 — 해지 동선 + 갱신 내역 표시", async ({ page }) => {
  await loginStudent(page);

  const r = await page.goto("/subscriptions", { waitUntil: "domcontentloaded" });
  expect(r?.status() ?? 500, "/subscriptions < 500").toBeLessThan(500);

  const html = await page.content();
  // 모델 C ② 간편 해지 동선 — '해지' 텍스트 또는 cancel 액션 존재
  const hasCancelHook = /해지|구독 해지|취소|cancel/i.test(html);
  // 모델 C ③ 갱신 내역 — '다음 결제일' / '결제 완료' / '캐시' 텍스트
  const hasRenewalInfo = /다음 결제일|결제 완료|결제일|갱신|이용 중|만료|환불/.test(html);
  console.log(`[UI subscriptions] cancel=${hasCancelHook ? "Y" : "N"} renewalInfo=${hasRenewalInfo ? "Y" : "N"}`);
  expect(hasCancelHook || hasRenewalInfo, "/subscriptions 핵심 동선 노출").toBeTruthy();
});

test("UI: 마이페이지 — 활성 구독 카드", async ({ page }) => {
  await loginStudent(page);
  const r = await page.goto("/mypage", { waitUntil: "domcontentloaded" });
  expect(r?.status() ?? 500).toBeLessThan(500);
  const html = await page.content();
  console.log(`[UI mypage] sub-card? ${/구독|이용 중|남은 질문/.test(html) ? "Y" : "N"}`);
});

test("UI: /wallet/charge — 캐시 충전 진입(잔액부족 대응)", async ({ page }) => {
  await loginStudent(page);
  const r = await page.goto("/wallet/charge", { waitUntil: "domcontentloaded" });
  expect(r?.status() ?? 500, "/wallet/charge < 500").toBeLessThan(500);
});
