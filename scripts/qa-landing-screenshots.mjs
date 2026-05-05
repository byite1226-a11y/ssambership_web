/**
 * One-off QA: landing "/" at fixed viewports + horizontal overflow check + hamburger.
 * Run: npm run start (port 3000) then node scripts/qa-landing-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "qa", "screenshots");
const base = process.env.BASE_URL || "http://127.0.0.1:3000";

function overflowPx(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const b = document.body;
    const dx = Math.max(0, de.scrollWidth - de.clientWidth);
    const bx = Math.max(0, b.scrollWidth - b.clientWidth);
    return { document: dx, body: bx, max: Math.max(dx, bx) };
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  const shots = [
    { name: "pc-1440", width: 1440, height: 900, menu: false },
    { name: "mobile-390", width: 390, height: 844, menu: true },
    { name: "mobile-412", width: 412, height: 915, menu: true },
  ];

  for (const s of shots) {
    const page = await browser.newPage({
      viewport: { width: s.width, height: s.height },
      colorScheme: "dark",
    });
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(800);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const o1 = await overflowPx(page);
    await page.screenshot({ path: join(outDir, `${s.name}.png`), fullPage: true });
    results.push({
      viewport: `${s.width}x${s.height}`,
      bodyBg: bg,
      horizontalOverflowPx: o1.max,
      colorSchemeForcedDark: true,
    });

    if (s.menu) {
      const openBtn = page.locator('button[aria-label="메뉴 열기"]');
      if ((await openBtn.count()) > 0) {
        await openBtn.click();
        await page.waitForTimeout(300);
        const o2 = await overflowPx(page);
        await page.screenshot({ path: join(outDir, `${s.name}-menu-open.png`), fullPage: true });
        results[results.length - 1].horizontalOverflowPxMenuOpen = o2.max;
        await page.locator('button[aria-label="메뉴 닫기"]').click().catch(() => {});
      }
    }
    await page.close();
  }

  const loginPage = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
  await loginPage.goto(`${base}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await loginPage.waitForTimeout(600);
  const loginBg = await loginPage.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const loginOverflow = await overflowPx(loginPage);
  await loginPage.screenshot({ path: join(outDir, "control-login-390.png"), fullPage: false });
  await loginPage.close();
  results.push({
    viewport: "390 (control /login)",
    bodyBg: loginBg,
    horizontalOverflowPx: loginOverflow.max,
    note: "Non-landing sanity: prefers dark OS should not break entire app body if unchanged",
  });

  await browser.close();

  const report = {
    baseUrl: base,
    generatedAt: new Date().toISOString(),
    results,
  };
  await writeFile(join(root, "qa", "landing-qa-automation.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
