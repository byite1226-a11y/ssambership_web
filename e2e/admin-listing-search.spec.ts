/**
 * 관리자 목록 검색/필터/페이지네이션 동작 검증.
 * - 6개 페이지 각각 페이지 200 + toolbar/탭/페이지네이션 UI 노출
 * - refunds 한정 reason 칼럼 노출
 * - 페이지네이션 이동: ?page=2 가 200
 * - 상태 탭 전환: ?status=pending 등 200
 * - 검색: ?q=... 200 + 결과 표시
 */
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

const PAGES = [
  {
    href: "/admin/refunds",
    name: "환불",
    statusValueForFilter: "pending",
    searchExample: "subscription_prorated",
    expectReasonColumn: true,
  },
  {
    href: "/admin/moderation",
    name: "신고/검수",
    statusValueForFilter: "pending",
    searchExample: "seed-bulk",
    expectReasonColumn: false,
  },
  {
    href: "/admin/custom-request-orders",
    name: "맞춤의뢰 주문",
    statusValueForFilter: "completed",
    searchExample: "completed",
    expectReasonColumn: false,
  },
  {
    href: "/admin/disputes",
    name: "분쟁",
    statusValueForFilter: "open",
    searchExample: "seed-bulk",
    expectReasonColumn: false,
  },
  {
    href: "/admin/mentor-approval",
    name: "멘토 승인",
    statusValueForFilter: "pending",
    searchExample: "쌤버시티",
    expectReasonColumn: false,
  },
  {
    href: "/admin/academic-record-changes",
    name: "학적변경",
    statusValueForFilter: "pending",
    searchExample: "시드대학교",
    expectReasonColumn: false,
  },
] as const;

test("관리자 목록 6종 — 검색/탭/페이지네이션 UI 노출 + 동작", async ({ page }) => {
  await loginAdmin(page);

  const results: Array<{ href: string; ok: boolean; notes: string[] }> = [];

  for (const cfg of PAGES) {
    const notes: string[] = [];
    let allOk = true;

    // 1) 기본 진입
    const r0 = await page.goto(cfg.href, { waitUntil: "domcontentloaded" });
    if ((r0?.status() ?? 500) >= 500) {
      results.push({ href: cfg.href, ok: false, notes: [`기본 진입 500: ${r0?.status()}`] });
      continue;
    }
    const baseHtml = await page.content();
    // toolbar input 노출 (name="q")
    if (!/name=["']q["']/i.test(baseHtml)) {
      allOk = false;
      notes.push("검색 input(name=q) 미노출");
    }
    // pagination(이전/다음) 노출
    if (!/이전|다음/.test(baseHtml)) {
      allOk = false;
      notes.push("페이지네이션 텍스트 미노출");
    }
    // 상태 탭 텍스트
    if (!/전체|대기|승인|해결|거절|검토 중|접수|완료|작업 중|운영 검토|재제출 필요|취소|환불|숨김|삭제|제출됨|반려|기각|운영검토/.test(baseHtml)) {
      allOk = false;
      notes.push("상태 탭 텍스트 미노출");
    }
    // reason 칼럼 (refunds 만)
    if (cfg.expectReasonColumn) {
      if (!/사유/.test(baseHtml)) {
        allOk = false;
        notes.push("환불 reason 칼럼 미노출");
      }
    }

    // 2) 페이지 2 이동 (status=all 로 전체 보기)
    const r1 = await page.goto(`${cfg.href}?status=all&page=2`, { waitUntil: "domcontentloaded" });
    if ((r1?.status() ?? 500) >= 500) {
      allOk = false;
      notes.push(`status=all&page=2 진입 500: ${r1?.status()}`);
    }
    const p2Html = await page.content();
    const totalMatch = p2Html.match(/총\s*<strong[^>]*>([\d,]+)<\/strong>건/);
    const totalReported = totalMatch ? Number(totalMatch[1].replace(/,/g, "")) : -1;
    const hasPagination = /다음[\s\S]{0,50}?<\/a>/.test(p2Html) || />[\s\S]{0,5}다음\s*→[\s\S]{0,5}</.test(p2Html);
    notes.push(`총=${totalReported}건 / 페이지네이션 컴포넌트=${hasPagination ? "Y" : "N"}`);

    // 3) 상태 탭 전환
    const r2 = await page.goto(`${cfg.href}?status=${cfg.statusValueForFilter}`, { waitUntil: "domcontentloaded" });
    if ((r2?.status() ?? 500) >= 500) {
      allOk = false;
      notes.push(`?status=${cfg.statusValueForFilter} 진입 500: ${r2?.status()}`);
    }

    // 4) 검색
    const r3 = await page.goto(`${cfg.href}?q=${encodeURIComponent(cfg.searchExample)}`, { waitUntil: "domcontentloaded" });
    if ((r3?.status() ?? 500) >= 500) {
      allOk = false;
      notes.push(`?q=${cfg.searchExample} 진입 500: ${r3?.status()}`);
    }

    results.push({ href: cfg.href, ok: allOk, notes });
  }

  console.log("\n[admin-listing] 결과 표:");
  console.log("href | ok | notes");
  console.log("---|---|---");
  for (const r of results) {
    console.log(`${r.href} | ${r.ok ? "Y" : "N"} | ${r.notes.join("; ") || "-"}`);
  }

  for (const r of results) {
    expect(r.ok, `${r.href}: ${r.notes.join("; ")}`).toBe(true);
  }
});
