/** 알림 카드 압축 후 타깃 재캡처(학생 리치 + 빈 학생) — 데스크탑+모바일. */
import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const PW = "Local!Test1234";
const VPS = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
];

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login/student", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(PW);
  await page.waitForTimeout(250);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(1800);
}

for (const vp of VPS) {
  test.describe(`recap-notif-${vp.tag}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });
    test(`recap ${vp.tag}`, async ({ page, context }) => {
      test.setTimeout(180000);
      const dir = join(process.cwd(), "screenshots_v2", vp.tag);
      mkdirSync(dir, { recursive: true });
      await context.clearCookies();
      await login(page, "local.student@ssam.test");
      await page.goto("/notifications", { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: join(dir, "student-notifications.png"), fullPage: true });
      await context.clearCookies();
      await login(page, "seed.student4@ssam.test");
      await page.goto("/notifications", { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: join(dir, "empty-notifications.png"), fullPage: true });
      console.log(`[${vp.tag}] notifications recaptured`);
    });
  });
}
