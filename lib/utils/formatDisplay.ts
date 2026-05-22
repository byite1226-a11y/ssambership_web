/**
 * 앱 전역 표시 포맷 — 날짜·캐시 단위 통일
 */

/** 예: 2024.06.07 */
export function formatKoreanDate(iso: unknown): string {
  if (iso == null || iso === "") return "—";
  const raw = typeof iso === "string" ? iso : String(iso);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}.${match[2]}.${match[3]}`;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** 1캐시 = 1원 — UI 표기용 */
export function formatCashKrw(amount: number, options?: { unit?: "캐시" | "원" }): string {
  const unit = options?.unit ?? "캐시";
  const n = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `${n.toLocaleString("ko-KR")} ${unit}`;
}

/** cash_ledger / balance_cents 등 minor(×100) → 캐시 정수 */
export function minorUnitsToDisplayCash(minor: number): number {
  return Math.floor(Math.abs(minor) / 100);
}
