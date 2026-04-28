import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadApplicationById } from "@/lib/customRequest/customRequestQueries";

type Row = Record<string, unknown>;

/** 플랫폼 20% / 멘토 80% (1차 정책) */
export const CUSTOM_ORDER_PLATFORM_FEE_RATE = 0.2 as const;

function toPositiveIntWon(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v) && v > 0) {
    return Math.floor(v);
  }
  if (typeof v === "string" && v.trim()) {
    const n = Number(String(v).replace(/,/g, "").trim());
    if (Number.isFinite(n) && n > 0) {
      return Math.floor(n);
    }
  }
  return null;
}

/**
 * 주문·지원 행에서 총액(원, 정수) 후보를 순서대로 시도. 없으면 null.
 * paid_amount, final_price, price, quote_price … + 지원의 proposed_price 등.
 */
export function pickGrossAmountWonFromOrderAndApplication(order: Row | null, application: Row | null): number | null {
  const orderKeys = [
    "paid_amount",
    "final_price",
    "agreed_price",
    "price",
    "quote_price",
    "amount",
    "total",
    "total_amount",
  ] as const;
  for (const k of orderKeys) {
    if (order && k in order) {
      const n = toPositiveIntWon((order as Row)[k]);
      if (n != null) return n;
    }
  }
  const appKeys = ["proposed_price", "price", "quote_price", "bid_amount", "amount"] as const;
  for (const k of appKeys) {
    if (application && k in application) {
      const n = toPositiveIntWon((application as Row)[k]);
      if (n != null) return n;
    }
  }
  return null;
}

export function splitPlatformAndMentorForGross(
  grossWon: number,
  feeRate: number = CUSTOM_ORDER_PLATFORM_FEE_RATE
): { platformFee: number; mentorAmount: number } {
  const g = Math.max(0, Math.floor(grossWon));
  const platformFee = Math.floor(g * feeRate);
  const mentorAmount = g - platformFee;
  return { platformFee, mentorAmount };
}

/**
 * 주문 id로 지원 로드(금액 후보) — 수락 액션에서 insert 전에 사용.
 */
export async function loadApplicationRowForOrder(
  supabase: SupabaseClient,
  order: Row
): Promise<Row | null> {
  for (const k of ["application_id", "custom_request_application_id", "selected_application_id", "bid_id"] as const) {
    const v = order[k];
    if (typeof v === "string" && v.trim()) {
      const { row } = await loadApplicationById(supabase, v);
      return row;
    }
  }
  return null;
}
