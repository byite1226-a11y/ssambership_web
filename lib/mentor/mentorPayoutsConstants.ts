/** 잠금값 — 멘토 몫 비율 */
export const MENTOR_SUBSCRIPTION_SHARE = 0.7 as const;
export const MENTOR_CUSTOM_REQUEST_SHARE = 0.8 as const;

export const MENTOR_SUBSCRIPTION_PLATFORM_SHARE = 0.3 as const;
export const MENTOR_CUSTOM_REQUEST_PLATFORM_SHARE = 0.2 as const;

import { formatCashKrw as formatCashKrwDisplay, minorUnitsToDisplayCash } from "@/lib/utils/formatDisplay";

/** cash_ledger minor 단위 → 표시 캐시(원) */
export function minorUnitsToCash(minor: number): number {
  return minorUnitsToDisplayCash(minor);
}

/** @deprecated import from `@/lib/utils/formatDisplay` — 정산 화면은 원 단위 유지 */
export function formatCashKrw(n: number): string {
  return formatCashKrwDisplay(n, { unit: "원" });
}

export { formatCashKrwDisplay as formatCashAmount };

export const DEFAULT_MASKED_BANK_DISPLAY = "카카오뱅크 3333-**-****789";
