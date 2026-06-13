import type { SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";
import { cashKrwForSubscribeTier } from "@/lib/subscribe/subscribePlanCatalog";

type Row = Record<string, unknown>;

/**
 * DB `*_cents` 필드 → 캐시(KRW, 1캐시=1원).
 * - 진짜 minor(×100): 5_500_000 → 55_000
 * - 레거시/시드: 원 단위를 *_cents에 넣은 경우(55_000) → 그대로 사용
 */
export function cashKrwFromDbCentsField(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 500_000) return Math.round(value / 100);
  if (value >= 1_000) return Math.round(value);
  return Math.round(value / 100);
}

function parsePlainPrice(row: Row): number | null {
  for (const k of ["price", "monthly_price", "amount", "price_krw"]) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return Math.round(v);
    if (typeof v === "string") {
      const n = Number.parseFloat(v.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(n) && n > 0) return Math.round(n);
    }
  }
  return null;
}

/** plans / mentor_plans 행 → 월 구독 캐시(원) */
export function cashKrwFromPlanRow(row: Row | null, tier?: SubscribePlanTier): number {
  if (!row) return tier ? cashKrwForSubscribeTier(tier) : 0;

  for (const k of ["amount_cents", "price_cents", "monthly_price_cents"] as const) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      return cashKrwFromDbCentsField(v);
    }
  }

  const plain = parsePlainPrice(row);
  if (plain != null) {
    if (plain >= 10_000) return plain;
    return cashKrwFromDbCentsField(plain);
  }

  return tier ? cashKrwForSubscribeTier(tier) : 0;
}
