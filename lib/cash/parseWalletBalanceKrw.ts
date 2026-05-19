/** 지갑 row → 표시·충전 UI용 잔액(원, 정수). balance_cents는 minor(원×100) 스케일. */
export function parseWalletBalanceKrw(row: Record<string, unknown> | null): number {
  if (!row) return 0;
  if (typeof row.balance_cents === "number" && Number.isFinite(row.balance_cents)) {
    return Math.floor(row.balance_cents / 100);
  }
  if (typeof row.amount_cents === "number" && Number.isFinite(row.amount_cents)) {
    return Math.floor(row.amount_cents / 100);
  }
  if (typeof row.balance === "number" && Number.isFinite(row.balance)) {
    return Math.round(row.balance);
  }
  if (typeof row.balance === "string" && row.balance.trim()) {
    const n = Number(row.balance.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
  return 0;
}
