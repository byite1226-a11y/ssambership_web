import { defineConfig } from "@playwright/test";

/**
 * E2E (Phase B) — 운영 staging 대상(사용자 명시 허용). 시나리오 1~4.
 * - workers:1 / fullyParallel:false : 돈·한도 흐름이 공유 DB에 걸려 순차 실행.
 * - webServer: 로컬 next dev 기동(reuse 가능). baseURL=localhost:3000.
 * - 테스트가 만든 데이터는 제목/내용에 'e2e-test' 표식을 남겨 추후 초기화 용이.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    actionTimeout: 25_000,
    navigationTimeout: 45_000,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
