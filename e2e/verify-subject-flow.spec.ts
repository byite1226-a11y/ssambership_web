/**
 * 검증:
 *  (항목2) 질문 작성 과목 옵션 = 그 방 멘토 지정 과목만.
 *  (항목3) 0과목 멘토: 프로필 편집 안내 + 공개 디렉터리 제외.
 */
import { test, expect } from "@playwright/test";
import { admin } from "./helpers/db";

const PW = "Local!Test1234";

async function login(page: import("@playwright/test").Page, email: string, role: "student" | "mentor") {
  const path = role === "mentor" ? "/login/mentor" : "/login/student";
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(PW);
  await page.waitForTimeout(250);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(1500);
}

test.use({ viewport: { width: 1440, height: 900 } });

test("항목2: 과목 옵션 = 멘토 지정 과목", async ({ page, context }) => {
  test.setTimeout(120000);
  const a = admin();
  // unpriced 멘토(과목 {수학})의 방 사용 — priced 방은 주간한도 4/4라 모달 opener 비활성.
  const studentId = (await a.from("users").select("id").eq("email", "local.student@ssam.test").maybeSingle()).data?.id as string;
  const unpriced = (await a.from("users").select("id").eq("email", "local.mentor.unpriced@ssam.test").maybeSingle()).data?.id as string;
  const room = (await a.from("mentor_student_rooms").select("id").eq("student_id", studentId).eq("mentor_id", unpriced).maybeSingle()).data?.id as string;
  const mentorSubjects = (await a.from("mentor_profiles").select("teaching_subjects").eq("user_id", unpriced).maybeSingle()).data?.teaching_subjects as string[];
  console.log(`[verify2] unpriced mentor subjects = ${JSON.stringify(mentorSubjects)}`);

  await context.clearCookies();
  await login(page, "local.student@ssam.test", "student");
  await page.goto(`/question-room/${room}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /새로운 질문/ }).first().click();
  await page.waitForTimeout(800);
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  const optionTexts = (await dialog.locator("select option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  console.log(`[verify2] subject <option>s = ${JSON.stringify(optionTexts)}`);
  await page.screenshot({ path: "screenshots_v2/desktop/verify-subject-filter.png", fullPage: true });

  // 멘토 지정 과목(수학)만 + "과목 미지정"; 무관 과목(영어/한국사/과학 등) 없어야
  expect(optionTexts.some((t) => t.includes("수학"))).toBeTruthy();
  expect(optionTexts.some((t) => t.includes("과목 미지정"))).toBeTruthy();
  expect(optionTexts.some((t) => t === "영어")).toBeFalsy();
  expect(optionTexts.some((t) => t.includes("한국사"))).toBeFalsy();
  expect(optionTexts.some((t) => t.includes("과학"))).toBeFalsy();
});

test("항목3: 0과목 멘토 안내 + 디렉터리 제외", async ({ page, context }) => {
  test.setTimeout(120000);
  // 프로필 편집 안내
  await context.clearCookies();
  await login(page, "seed.mentor7@ssam.test", "mentor");
  await page.goto("/mentor/profile/edit", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "screenshots_v2/desktop/verify-zero-subject-notice.png", fullPage: true });
  await expect(page.getByText(/활동\(구독 공개\)하려면 담당 과목/)).toBeVisible();

  // 공개 디렉터리 제외 (로그아웃)
  await context.clearCookies();
  await page.goto("/mentors", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  console.log(`[verify3] /mentors contains 시드멘토7? ${body.includes("시드멘토7")}; contains 가격설정멘토? ${body.includes("가격설정멘토")}`);
  expect(body.includes("시드멘토7")).toBeFalsy(); // 0과목 → 제외
});
