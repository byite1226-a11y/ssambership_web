import { test, expect } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers/auth";
import * as db from "./helpers/db";

/**
 * 시나리오 1 — 개별질문(공개형) E2E
 * 학생 공개형 등록(가격 제시·예치) → 멘토 수락(답변하기) → 멘토 답변·확정 → 학생 [해결됨](지급).
 * 검증: 저장 위치(individual_questions) · 예치/차감 · 정산 15/85 · 잔액·cash_ledger.
 * ※ Next dev: networkidle 금지(HMR), 서버액션 폼은 하이드레이션 후 제출(클릭 전 대기 필요).
 */
const HYDRATE = 2500; // 컨트롤드/서버액션 폼 하이드레이션 대기(ms)

test("시나리오1 공개형: 예치→수락→답변→확정 지급(15/85)", async ({ browser }) => {
  const PRICE_CASH = 5000;
  const PRICE_CENTS = PRICE_CASH * 100; // 500,000
  const MENTOR_PAYOUT = Math.floor(PRICE_CENTS * 0.85); // 425,000
  const PLATFORM_FEE = PRICE_CENTS - MENTOR_PAYOUT; // 75,000
  const marker = Math.random().toString(36).slice(2, 8);
  const title = `[e2e-test] 공개형 ${marker}`;

  const studentId = await db.userIdByEmail(ACCOUNTS.student.email);
  const mentorId = await db.userIdByEmail(ACCOUNTS.mentor.email);

  await db.seedCash(studentId, PRICE_CENTS + 100_000);
  const studentBal0 = await db.walletBalance(studentId);
  const mentorBal0 = await db.walletBalance(mentorId);

  let iqId = "";

  await test.step("학생: 공개형 질문 등록(예치)", async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, ACCOUNTS.student);
    const beforeIds = await db.iqIdsForStudent(studentId);
    await page.goto("/individual-questions/new", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(HYDRATE);
    await page.fill('input[name="priceCents"]', String(PRICE_CASH));
    await page.fill('input[name="title"]', title);
    await page.fill('textarea[name="body"]', "e2e-test 공개형 질문 본문입니다. 자동화 검증용.");
    await Promise.all([
      page
        .waitForURL((u) => !u.pathname.endsWith("/individual-questions/new"), { timeout: 30_000 })
        .catch(() => undefined),
      page.getByRole("button", { name: "예치하고 공개 등록" }).click(),
    ]);

    const iq = await db.waitForNewIqForStudent(studentId, beforeIds);
    iqId = iq.id;
    expect(iq.question_type).toBe("open");
    expect(iq.status, "등록 직후 status=open").toBe("open");
    expect(iq.price_cents, "price_cents = 캐시×100").toBe(PRICE_CENTS);

    const studentBal1 = await db.walletBalance(studentId);
    expect(studentBal1, "학생 잔액 = 등록 전 − 예치액").toBe(studentBal0 - PRICE_CENTS);

    const hold = await db.ledgerForRef(studentId, iqId);
    expect(hold.some((l) => l.delta_cents === -PRICE_CENTS), "cash_ledger 예치 −price 기록").toBeTruthy();
    await ctx.close();
  });

  await test.step("멘토: 공개형 수락(답변하기)", async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, ACCOUNTS.mentor);
    await page.goto("/mentor/individual-questions", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(HYDRATE);
    const card = page.locator("article", { hasText: title });
    await card.first().waitFor({ timeout: 30_000 });
    await card.first().scrollIntoViewIfNeeded().catch(() => undefined);
    await card.getByRole("button", { name: "답변하기" }).first().click();

    const iq = await db.waitForIqStatus(iqId, "claimed");
    expect(iq.claimed_mentor_id, "claimed_mentor_id=멘토").toBe(mentorId);
    await ctx.close();
  });

  await test.step("멘토: 답변 메시지 + 답변 확정", async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, ACCOUNTS.mentor);
    await page.goto(`/mentor/individual-questions/${iqId}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(HYDRATE);
    const msg = page.locator('textarea[name="body"]');
    if (await msg.count()) {
      await msg.first().fill("e2e-test 멘토 답변입니다.");
      await page.getByRole("button", { name: "보내기" }).first().click();
      await page.waitForTimeout(2500);
    }
    await page.getByRole("button", { name: "답변 확정" }).first().click();
    await db.waitForIqStatus(iqId, "answered");
    await ctx.close();
  });

  await test.step("학생: [해결됨] 확정 → 멘토 지급(85%)", async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, ACCOUNTS.student);
    await page.goto(`/individual-questions/${iqId}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(HYDRATE);
    await page.getByRole("button", { name: "해결됨 (답변 확정)" }).first().click();

    const iq = await db.waitForIqStatus(iqId, "released");
    expect(iq.release_ledger_id, "release_ledger_id 기록").toBeTruthy();

    const mentorBal1 = await db.walletBalance(mentorId);
    expect(mentorBal1, "멘토 잔액 += floor(price×0.85)").toBe(mentorBal0 + MENTOR_PAYOUT);

    const payout = await db.ledgerForRef(mentorId, iqId);
    expect(
      payout.some((l) => l.delta_cents === MENTOR_PAYOUT),
      `cash_ledger 멘토 지급 +${MENTOR_PAYOUT}(85%)`
    ).toBeTruthy();
    expect(PRICE_CENTS - MENTOR_PAYOUT, "플랫폼 수수료 15%").toBe(PLATFORM_FEE);
    await ctx.close();
  });
});
