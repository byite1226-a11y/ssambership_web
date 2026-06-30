/**
 * 검증: 제목 없이 질문 작성 시 "질문 N"이 ★질문방 단위 독립 카운트인지.
 * 빈 unpriced 룸(스레드 0)에서 빈 제목 제출 → "질문 1" 이어야 함(학생 전체 누적 아님).
 */
import { test, expect } from "@playwright/test";
import { admin } from "./helpers/db";

const PW = "Local!Test1234";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login/student", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(PW);
  await page.waitForTimeout(250);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(1500);
}

test("질문 N은 질문방 단위 독립 카운트", async ({ page }) => {
  test.setTimeout(120000);
  const a = admin();
  const studentId = (await a.from("users").select("id").eq("email", "local.student@ssam.test").maybeSingle()).data?.id as string;
  const unpricedMentor = (await a.from("users").select("id").eq("email", "local.mentor.unpriced@ssam.test").maybeSingle()).data?.id as string;
  const room = (await a.from("mentor_student_rooms").select("id").eq("student_id", studentId).eq("mentor_id", unpricedMentor).maybeSingle()).data?.id as string;

  // 사전: 학생 전체 스레드 수 vs 이 방 스레드 수
  const totalBefore = (await a.from("question_threads").select("id", { count: "exact", head: true })
    .in("mentor_student_room_id",
      ((await a.from("mentor_student_rooms").select("id").eq("student_id", studentId)).data ?? []).map((r) => r.id as string)
    )).count ?? 0;
  const roomBefore = (await a.from("question_threads").select("id", { count: "exact", head: true })
    .eq("mentor_student_room_id", room)).count ?? 0;
  console.log(`[verify] student total threads=${totalBefore}, this room threads=${roomBefore}, room=${room}`);

  await login(page, "local.student@ssam.test");
  await page.goto(`/question-room/${room}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // 새 질문 모달 열기
  await page.getByRole("button", { name: /새로운 질문/ }).first().click();
  await page.waitForTimeout(800);
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  // 제목/과목 비우고 제출
  await dialog.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(2500);

  // 결과: 이 방의 최신 스레드 제목
  const newest = (await a.from("question_threads").select("title,created_at").eq("mentor_student_room_id", room)
    .order("created_at", { ascending: false }).limit(1).maybeSingle()).data as { title?: string } | null;
  const roomAfter = (await a.from("question_threads").select("id", { count: "exact", head: true })
    .eq("mentor_student_room_id", room)).count ?? 0;
  console.log(`[verify] newest title in room = "${newest?.title}", room threads now=${roomAfter}, expected="질문 ${roomBefore + 1}"`);

  expect(newest?.title).toBe(`질문 ${roomBefore + 1}`);
  // ★독립 카운트 증명: 학생 전체 누적(totalBefore+1)이 아니라 방 기준(roomBefore+1)
  expect(roomBefore + 1).toBeLessThan(totalBefore + 1);
});
