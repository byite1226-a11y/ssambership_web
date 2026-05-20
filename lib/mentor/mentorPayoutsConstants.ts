/** 잠금값 — 멘토 몫 비율 */
export const MENTOR_SUBSCRIPTION_SHARE = 0.7 as const;
export const MENTOR_CUSTOM_REQUEST_SHARE = 0.8 as const;

export const MENTOR_SUBSCRIPTION_PLATFORM_SHARE = 0.3 as const;
export const MENTOR_CUSTOM_REQUEST_PLATFORM_SHARE = 0.2 as const;

/** cash_ledger minor 단위 → 표시 캐시(원) */
export function minorUnitsToCash(minor: number): number {
  return Math.floor(Math.abs(minor) / 100);
}

export function formatCashKrw(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

export const DEFAULT_MASKED_BANK_DISPLAY = "카카오뱅크 3333-**-****789";
