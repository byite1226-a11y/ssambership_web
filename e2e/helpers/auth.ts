import type { Locator, Page } from "@playwright/test";
import { loadEnvLocal } from "./env";

/** 입력값이 실제 반영될 때까지 재시도(하이드레이션 타이밍 보정). */
async function expectFilled(locator: Locator, value: string): Promise<void> {
  for (let i = 0; i < 5; i++) {
    const v = await locator.inputValue().catch(() => "");
    if (v === value) return;
    await locator.fill(value).catch(() => undefined);
    await locator.page().waitForTimeout(400);
  }
}

// 테스트 계정 자격증명은 코드에 하드코딩하지 않고 .env.local 에서 읽는다(커밋/푸시 안전).
// .env.local 에 설정: E2E_STUDENT_EMAIL/_PW, E2E_MENTOR_EMAIL/_PW, E2E_ADMIN_EMAIL/_PW
const env = loadEnvLocal();
function cred(role: "STUDENT" | "MENTOR" | "ADMIN"): { email: string; pw: string } {
  return {
    email: env[`E2E_${role}_EMAIL`] ?? process.env[`E2E_${role}_EMAIL`] ?? "",
    pw: env[`E2E_${role}_PW`] ?? process.env[`E2E_${role}_PW`] ?? "",
  };
}

export const ACCOUNTS = {
  student: { ...cred("STUDENT"), role: "student" as const },
  mentor: { ...cred("MENTOR"), role: "mentor" as const },
  admin: { ...cred("ADMIN"), role: "admin" as const },
};

export async function login(
  page: Page,
  account: { email: string; pw: string; role: "student" | "mentor" | "admin" }
): Promise<void> {
  if (!account.email || !account.pw) {
    throw new Error(
      `E2E 계정 자격증명이 없습니다(role=${account.role}). .env.local 에 E2E_${account.role.toUpperCase()}_EMAIL / _PW 를 설정하세요.`
    );
  }
  const path = account.role === "admin" ? "/admin/login" : `/login/${account.role}`;
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const email = page.locator('input[type="email"]').first();
  const pw = page.locator('input[type="password"]').first();
  await email.waitFor({ state: "visible", timeout: 30_000 });
  // ★ 컨트롤드 폼 하이드레이션 대기 — 하이드레이션 전 입력은 React 상태에 안 잡혀 로그인 실패
  await page.waitForTimeout(2000);
  await email.fill(account.email);
  await pw.fill(account.pw);
  // 값이 실제로 반영됐는지 확인(하이드레이션 보장)
  await expectFilled(email, account.email);
  await page.waitForTimeout(300);
  await page.locator('button[type="submit"]').first().click();
  await page
    .waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 })
    .catch(() => undefined);
  await page.waitForTimeout(2000);
  if (page.url().includes("/login")) {
    throw new Error(`로그인 실패: ${account.email} — 여전히 ${page.url()}`);
  }
}
