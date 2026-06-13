import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CASH_DATA_MODEL,
  fetchCashLedgerForUser,
  fetchCashTopupPackages,
  fetchRecentPaymentsForUser,
  fetchWalletBalanceByUserId,
} from "@/lib/cash/cashQueries";

export const WALLET_CHARGE_DATA_MODEL = [
  "지갑 잔액",
  "충전 상품 안내",
  "최근 캐시 사용 요약(맞춤의뢰와 별도)",
  "최근 결제 요약",
] as const;

export const WALLET_LEDGER_DATA_MODEL = [
  "캐시 사용 내역(원장)",
  "맞춤의뢰 결제와 구분되는 캐시 흐름",
  "상단 잔액",
] as const;

export type WalletChargePageData = {
  balance: Awaited<ReturnType<typeof fetchWalletBalanceByUserId>>;
  packages: Awaited<ReturnType<typeof fetchCashTopupPackages>>;
  ledgerPreview: Awaited<ReturnType<typeof fetchCashLedgerForUser>>;
  payments: Awaited<ReturnType<typeof fetchRecentPaymentsForUser>>;
};

export type WalletLedgerPageData = {
  balance: Awaited<ReturnType<typeof fetchWalletBalanceByUserId>>;
  ledger: Awaited<ReturnType<typeof fetchCashLedgerForUser>>;
  /** URL 쿼리(필터 UI 자리) */
  filter: { from: string | null; to: string | null; kind: string | null };
};

export async function loadWalletChargePageData(
  supabase: SupabaseClient,
  userId: string
): Promise<WalletChargePageData> {
  const [balance, packages, ledgerPreview, payments] = await Promise.all([
    fetchWalletBalanceByUserId(supabase, userId),
    fetchCashTopupPackages(supabase),
    fetchCashLedgerForUser(supabase, userId, 80),
    fetchRecentPaymentsForUser(supabase, userId, 5),
  ]);
  return { balance, packages, ledgerPreview, payments };
}

export async function loadWalletLedgerPageData(
  supabase: SupabaseClient,
  userId: string,
  sp: { from?: string; to?: string; kind?: string }
): Promise<WalletLedgerPageData> {
  const [balance, ledger] = await Promise.all([
    fetchWalletBalanceByUserId(supabase, userId),
    fetchCashLedgerForUser(supabase, userId, 250),
  ]);
  return {
    balance,
    ledger,
    filter: {
      from: sp.from ?? null,
      to: sp.to ?? null,
      kind: sp.kind ?? null,
    },
  };
}

export { CASH_DATA_MODEL };
