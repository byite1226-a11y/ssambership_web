import type { SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";

export type SubscribePlanCatalogItem = {
  tier: SubscribePlanTier;
  label: string;
  cashKrw: number;
  weeklyLabel: string;
  recommend?: boolean;
};

/** 보고서 잠금 구독 플랜 (1캐시 = 1원). DB plan_id는 런타임에 멘토 플랜 행에서 조회. */
export const SUBSCRIBE_PLAN_CATALOG: readonly SubscribePlanCatalogItem[] = [
  { tier: "limited", label: "Limited", cashKrw: 55_000, weeklyLabel: "주 4개 질문" },
  { tier: "standard", label: "Standard", cashKrw: 114_900, weeklyLabel: "주 9개 질문", recommend: true },
  { tier: "premium", label: "Premium", cashKrw: 249_900, weeklyLabel: "질문 무제한(FUP)" },
] as const;

export function getSubscribeCatalogPlan(tier: SubscribePlanTier): SubscribePlanCatalogItem {
  return SUBSCRIBE_PLAN_CATALOG.find((p) => p.tier === tier) ?? SUBSCRIBE_PLAN_CATALOG[1];
}

export function cashKrwForSubscribeTier(tier: SubscribePlanTier): number {
  return getSubscribeCatalogPlan(tier).cashKrw;
}

export function isSubscribeAmountForTier(amountKrw: number, tier: SubscribePlanTier): boolean {
  return getSubscribeCatalogPlan(tier).cashKrw === amountKrw;
}

export function planIdFromRow(row: Record<string, unknown> | null): string | null {
  if (!row) return null;
  const id = row.id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}
