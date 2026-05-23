/**
 * 멘토 정산 UI 표시 헬퍼 — 클라이언트·서버 공용 (server-only import 없음)
 */
import type {
  MentorPayoutDetailLine,
  MentorPayoutScheduleInfo,
  MentorPayoutSettlementTableRow,
  PayoutUiStatus,
} from "@/lib/mentor/mentorPayoutsTypes";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function formatPayoutDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const w = WEEKDAY_KO[d.getDay()];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day} (${w})`;
}

export function formatYearMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return `${y}년 ${String(m).padStart(2, "0")}월`;
}

export function formatChartMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  if (!y || !m) return ym;
  return `${y.slice(-2)}.${m}`;
}

export function buildPayoutScheduleInfo(
  expectedAmount: number,
  completedAmount: number,
  from = new Date()
): MentorPayoutScheduleInfo {
  const y = from.getFullYear();
  const m = from.getMonth();
  const day = from.getDate();
  const target = day < 10 ? new Date(y, m, 10) : new Date(y, m + 1, 10);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const progress = Math.min(100, Math.round((day / daysInMonth) * 100));

  return {
    nextPayoutDateIso: target.toISOString(),
    nextPayoutLabel: formatPayoutDateLabel(target.toISOString()),
    monthProgressPct: progress,
    monthLabel: `${m + 1}월`,
    completedPayoutAmount: completedAmount,
    expectedPayoutAmount: expectedAmount,
  };
}

function mapLineStatusToUi(status: string, net: number): PayoutUiStatus {
  const s = status.toLowerCase();
  if (s.includes("취소") || s.includes("cancel") || net < 0) return "cancelled";
  if (s.includes("완료") || s.includes("paid") || s.includes("지급")) return "paid";
  if (s.includes("보류") || s.includes("hold")) return "hold";
  return "scheduled";
}

export function detailLineToSettlementRow(line: MentorPayoutDetailLine): MentorPayoutSettlementTableRow {
  const uiStatus = mapLineStatusToUi(line.status, line.netAmount);
  const isCancelled = uiStatus === "cancelled";
  return {
    id: line.id,
    date: line.date,
    type: line.type,
    description: line.description,
    grossAmount: isCancelled ? -Math.abs(line.paymentAmount) : line.paymentAmount,
    feeAmount: isCancelled ? Math.abs(line.feeAmount) : line.feeAmount,
    netAmount: line.netAmount,
    uiStatus,
    isCancelled,
  };
}
