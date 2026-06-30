/** 잠금값 — 멘토 몫 비율 */
export const MENTOR_SUBSCRIPTION_SHARE = 0.85 as const;
export const MENTOR_CUSTOM_REQUEST_SHARE = 0.95 as const;

export const MENTOR_SUBSCRIPTION_PLATFORM_SHARE = 0.15 as const;
export const MENTOR_CUSTOM_REQUEST_PLATFORM_SHARE = 0.05 as const;

/** UI 표기 — 플랫폼 수수료(공제) */
export const SUBSCRIPTION_PLATFORM_FEE_LABEL = "15% 공제 (플랫폼 수수료)" as const;
export const CUSTOM_REQUEST_PLATFORM_FEE_LABEL = "5% 공제 (플랫폼 수수료)" as const;

import { formatCashKrw as formatCashKrwDisplay, minorUnitsToDisplayCash } from "@/lib/utils/formatDisplay";

/** cash_ledger minor 단위 → 표시 캐시(원) */
export function minorUnitsToCash(minor: number): number {
  return minorUnitsToDisplayCash(minor);
}

/** 정산 화면 인앱 가치 표시 — 캐시 단위(숫자 동일, 표시만). 실결제 KRW는 충전/토스에서만. */
export function formatCashKrw(n: number): string {
  return formatCashKrwDisplay(n, { unit: "캐시" });
}

export { formatCashKrwDisplay as formatCashAmount };

export const DEFAULT_MASKED_BANK_DISPLAY = "정산 계좌 미등록";
