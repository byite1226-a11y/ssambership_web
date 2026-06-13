export type WalletBalanceBreakdown = {
  totalCash: number;
  usableCash: number;
  bonusCash: number;
  expiringCash: number;
};

function readCashField(row: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      if (k.endsWith("_cents")) return Math.floor(v / 100);
      return Math.round(v);
    }
  }
  return 0;
}

/** 지갑 row → 표시·충전 UI용 잔액(캐시=원, 정수). balance_cents는 minor(원×100) 스케일. */
export function parseWalletBalanceKrw(row: Record<string, unknown> | null): number {
  return parseWalletBalanceBreakdown(row).totalCash;
}

export function parseWalletBalanceBreakdown(row: Record<string, unknown> | null): WalletBalanceBreakdown {
  if (!row) {
    return { totalCash: 0, usableCash: 0, bonusCash: 0, expiringCash: 0 };
  }

  const totalCash = readCashField(row, ["balance_cents", "amount_cents", "balance", "total_cash"]);
  const usableCash = readCashField(row, ["usable_cents", "usable_balance", "available_cents", "available_balance"]) || totalCash;
  const bonusCash = readCashField(row, ["bonus_cents", "bonus_balance", "bonus_cash"]);
  const expiringCash = readCashField(row, ["expiring_cents", "expiring_balance", "expiring_cash", "expires_soon_cents"]);

  return { totalCash, usableCash, bonusCash, expiringCash };
}
