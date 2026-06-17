import { cashKrwForSubscribeTier } from "@/lib/subscribe/subscribePlanCatalog";
import type { SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";

type Row = Record<string, unknown>;

export type MentorSubscriptionPriceRule = {
  minCashKrw: number;
  recommendedCashKrw: number;
  maxCashKrw: number;
};

export const MENTOR_SUBSCRIPTION_PRICE_RULES: Record<SubscribePlanTier, MentorSubscriptionPriceRule> = {
  limited: {
    minCashKrw: 39_900,
    recommendedCashKrw: 55_000,
    maxCashKrw: 69_900,
  },
  standard: {
    minCashKrw: 84_900,
    recommendedCashKrw: 114_900,
    maxCashKrw: 149_900,
  },
  premium: {
    minCashKrw: 189_900,
    recommendedCashKrw: 249_900,
    maxCashKrw: 329_900,
  },
};

export const SUBSCRIBE_PLAN_TIERS: readonly SubscribePlanTier[] = ["limited", "standard", "premium"];

export function mentorSubscriptionPriceRule(tier: SubscribePlanTier): MentorSubscriptionPriceRule {
  return MENTOR_SUBSCRIPTION_PRICE_RULES[tier];
}

export function amountCentsFromCashKrw(cashKrw: number): number {
  return Math.round(cashKrw * 100);
}

export function cashKrwFromAmountCents(amountCents: number): number {
  return Math.round(amountCents / 100);
}

export function recommendedAmountCentsForSubscribeTier(tier: SubscribePlanTier): number {
  return amountCentsFromCashKrw(
    MENTOR_SUBSCRIPTION_PRICE_RULES[tier]?.recommendedCashKrw ?? cashKrwForSubscribeTier(tier),
  );
}

function positiveNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.]/g, "");
    if (!normalized) return null;
    const n = Number.parseFloat(normalized);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export function mentorPlanDebitAmountCents(row: Row | null, tier: SubscribePlanTier): number {
  if (row) {
    for (const key of ["amount_cents", "price_cents", "monthly_price_cents"] as const) {
      const amountCents = positiveNumber(row[key]);
      if (amountCents != null) return Math.trunc(amountCents);
    }

    for (const key of ["amount", "price", "monthly_price", "price_krw"] as const) {
      const cashKrw = positiveNumber(row[key]);
      if (cashKrw != null) return amountCentsFromCashKrw(cashKrw);
    }
  }

  return recommendedAmountCentsForSubscribeTier(tier);
}

export function mentorPlanCashKrw(row: Row | null, tier: SubscribePlanTier): number {
  return cashKrwFromAmountCents(mentorPlanDebitAmountCents(row, tier));
}

export function isOutsideMentorPriceGuide(cashKrw: number, tier: SubscribePlanTier): boolean {
  const rule = mentorSubscriptionPriceRule(tier);
  return cashKrw < rule.minCashKrw || cashKrw > rule.maxCashKrw;
}
