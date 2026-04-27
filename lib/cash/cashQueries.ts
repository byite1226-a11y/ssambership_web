import type { SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type TableProbe = { table: string | null; error: string | null };

/** 테이블 존재/RLS read 가능할 때까지 후보만 시도(더미 row 생성 금지) */
async function firstReadableTable(
  supabase: SupabaseClient,
  candidates: readonly string[]
): Promise<TableProbe> {
  let last = "no candidates";
  for (const table of candidates) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (!error) return { table, error: null };
    last = error.message;
  }
  return { table: null, error: last };
}

export type CashPackageRow = Record<string, unknown>;

export async function fetchCashTopupPackages(
  supabase: SupabaseClient
): Promise<{ rows: CashPackageRow[]; table: string | null; error: string | null }> {
  const probe = await firstReadableTable(supabase, ["cash_topup_packages", "topup_packages", "cash_packages"] as const);
  if (!probe.table) {
    return { rows: [], table: null, error: probe.error };
  }
  const { data, error } = await supabase.from(probe.table).select("*").limit(50);
  if (error) return { rows: [], table: probe.table, error: error.message };
  return { rows: (data as CashPackageRow[]) ?? [], table: probe.table, error: null };
}

export async function fetchWalletBalanceByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<{ row: Record<string, unknown> | null; table: string | null; error: string | null }> {
  const probe = await firstReadableTable(supabase, ["wallets", "user_wallets", "cash_wallets", "student_wallets"] as const);
  if (!probe.table) {
    return { row: null, table: null, error: probe.error };
  }
  const { column } = await pickExistingColumn(supabase, probe.table, ["user_id", "student_id", "owner_id"]);
  if (!column) {
    return { row: null, table: probe.table, error: "wallets: user FK column not found" };
  }
  const { data, error } = await supabase.from(probe.table).select("*").eq(column, userId).limit(1).maybeSingle();
  if (error) return { row: null, table: probe.table, error: error.message };
  return { row: (data as Record<string, unknown> | null) ?? null, table: probe.table, error: null };
}

export type LedgerLineRow = Record<string, unknown>;

export async function fetchCashLedgerForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 50
): Promise<{ rows: LedgerLineRow[]; table: string | null; error: string | null }> {
  const probe = await firstReadableTable(supabase, [
    "cash_ledger",
    "cash_ledger_entries",
    "wallet_ledger_lines",
    "wallet_transactions",
    "cash_ledger_lines",
  ] as const);
  if (!probe.table) {
    return { rows: [], table: null, error: probe.error };
  }
  const { column } = await pickExistingColumn(supabase, probe.table, ["user_id", "student_id", "account_owner_id"]);
  if (!column) {
    return { rows: [], table: probe.table, error: "ledger: user FK column not found" };
  }
  const { data, error } = await supabase
    .from(probe.table)
    .select("*")
    .eq(column, userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (/column|does not exist|order/i.test(error.message)) {
      const fb = await supabase.from(probe.table).select("*").eq(column, userId).limit(limit);
      if (fb.error) return { rows: [], table: probe.table, error: fb.error.message };
      return { rows: (fb.data as LedgerLineRow[]) ?? [], table: probe.table, error: null };
    }
    return { rows: [], table: probe.table, error: error.message };
  }
  return { rows: (data as LedgerLineRow[]) ?? [], table: probe.table, error: null };
}

/** 문서/스키마 연결 예정 포인트(화면에 그대로 노출 가능) */
export const CASH_DATA_MODEL = [
  "payments (캐시 충전/결제 intent, 맞춤의뢰와 분리)",
  "refunds",
  "subscriptions (멤버십 구독 — /subscribe 흐름, 캐시 잔액과 분리)",
  "notifications (결제·환불 알림)",
  "wallets + ledger (잔액/원장 — 본 화면만의 소스 of truth로 확정 예정)",
] as const;

const PAY_TABLES = ["payments", "payment_intents", "order_payments"] as const;
const PAY_USER_FK = ["user_id", "student_id", "subscriber_id", "owner_id", "recipient_id"] as const;

/**
 * 캐시·지갑 맥락의 최근 결제 row(맞춤의뢰 order_payments와 혼동 시 payload로 구분 예정)
 */
export async function fetchRecentPaymentsForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 5
): Promise<{ rows: Record<string, unknown>[]; table: string | null; error: string | null; probe: string }> {
  for (const table of PAY_TABLES) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) continue;
    const { column: sc } = await pickExistingColumn(supabase, table, PAY_USER_FK);
    if (!sc) continue;
    const { column: createdCol } = await pickExistingColumn(supabase, table, ["created_at", "inserted_at", "updated_at"]);
    let q = supabase.from(table).select("*").eq(sc, userId);
    if (createdCol) {
      q = q.order(createdCol, { ascending: false });
    }
    const o1 = await q.limit(limit);
    if (o1.error) {
      const o2 = await supabase.from(table).select("*").eq(sc, userId).limit(limit);
      if (o2.error) {
        return { table, rows: [], error: o2.error.message, probe: table };
      }
      return { table, rows: (o2.data as Record<string, unknown>[]) ?? [], error: null, probe: `${table} · order 생략` };
    }
    return { table, rows: (o1.data as Record<string, unknown>[]) ?? [], error: null, probe: `${table} · ${sc}` };
  }
  return { table: null, rows: [], error: null, probe: "payments 조회 경로 없음" };
}

export function formatWalletRowDisplay(row: Record<string, unknown> | null): string {
  if (!row) return "";
  if (typeof row.balance_cents === "number") return `잔액 ${row.balance_cents} (단위: 스키마에 cents 가정)`;
  if (typeof row.amount_cents === "number") return `잔액 ${row.amount_cents} (amount_cents)`;
  if (typeof row.balance === "number" || typeof row.balance === "string") return `잔액 ${String(row.balance)}`;
  return "잔액 컬럼을 wallets 스키마에 맞게 표시하세요 (balance / balance_cents 등).";
}
