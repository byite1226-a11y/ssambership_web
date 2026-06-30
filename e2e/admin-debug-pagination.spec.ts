/** 페이지네이션 HTML 출력 직접 검사 */
import { test, expect, type Page } from "@playwright/test";
import { loadEnvLocal } from "./helpers/env";

const env = loadEnvLocal();
const ADMIN_EMAIL = env.E2E_ADMIN_EMAIL ?? "";
const PW = "Local!Test1234";

async function loginAdmin(page: Page) {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', PW);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/admin/login"), { timeout: 30_000 }).catch(() => undefined);
}

test("페이지네이션 HTML 직접 검사", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/admin/refunds?status=all&page=2", { waitUntil: "domcontentloaded" });
  const html = await page.content();
  // pagination 컴포넌트의 출력 일부를 모두 찾기
  const m = html.match(/총\s*<strong[^>]*>([\d,]+)<\/strong>건[^<]*[\s\S]{0,200}/);
  console.log("[refunds] match:", m ? m[0].slice(0, 400) : "MATCH NONE");

  const pageNum = html.match(/페이지[^<]{0,20}/);
  console.log("[refunds] pageNum text:", pageNum ? JSON.stringify(pageNum[0]) : "NONE");

  // 표 안의 데이터 행 개수
  const trCount = (html.match(/<tr[^>]*class="hover:bg-slate-50/g) ?? []).length;
  console.log("[refunds] table rows on page:", trCount);

  expect(html.length).toBeGreaterThan(1000);
});
