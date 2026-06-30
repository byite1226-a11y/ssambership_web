import { test } from "@playwright/test";
import { admin } from "./helpers/db";

const PW = "Local!Test1234";
test.use({ viewport: { width: 1440, height: 900 } });

test("capture questionroom pagination", async ({ page }) => {
  test.setTimeout(90000);
  const a = admin();
  const studentId = (await a.from("users").select("id").eq("email", "local.student@ssam.test").maybeSingle()).data?.id as string;
  const priced = (await a.from("users").select("id").eq("email", "local.mentor.priced@ssam.test").maybeSingle()).data?.id as string;
  const room = (await a.from("mentor_student_rooms").select("id").eq("student_id", studentId).eq("mentor_id", priced).maybeSingle()).data?.id as string;

  await page.goto("/login/student", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.locator('input[type="email"]').first().fill("local.student@ssam.test");
  await page.locator('input[type="password"]').first().fill(PW);
  await page.waitForTimeout(250);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(1500);
  await page.goto(`/question-room/${room}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "screenshots_v2/desktop/verify-pagination.png", fullPage: true });
});
