/**
 * 환불 처리 SLA — 멘토 중단 환불은 요청일로부터 5일 내 처리 목표.
 * (PART C: P0 #6, PART D ⑤ SLA 대시보드 공용)
 */
export const REFUND_SLA_DAYS = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

export type RefundSlaTone = "ok" | "soon" | "over";

export type RefundSlaInfo = {
  /** 마감(요청일 + SLA) 까지 남은 일수(올림). 음수면 초과 일수. */
  daysRemaining: number | null;
  tone: RefundSlaTone;
  label: string;
};

/** request_type 이 SLA 추적 대상인지(멘토 중단 환불 우선). */
export function isSlaTrackedRequestType(requestType: string | null | undefined): boolean {
  return String(requestType ?? "") === "subscription_mentor_suspended";
}

export function refundSlaInfo(
  createdAtIso: string | null | undefined,
  status: string | null | undefined,
  now: Date = new Date()
): RefundSlaInfo {
  const st = String(status ?? "").toLowerCase();
  // 이미 처리된 건은 SLA 추적 의미 없음
  if (st && st !== "pending") {
    return { daysRemaining: null, tone: "ok", label: "처리됨" };
  }
  if (!createdAtIso) return { daysRemaining: null, tone: "ok", label: "—" };
  const created = new Date(createdAtIso);
  if (Number.isNaN(created.getTime())) return { daysRemaining: null, tone: "ok", label: "—" };

  const deadline = created.getTime() + REFUND_SLA_DAYS * DAY_MS;
  const remainingMs = deadline - now.getTime();
  const daysRemaining = Math.ceil(remainingMs / DAY_MS);

  if (daysRemaining < 0) {
    return { daysRemaining, tone: "over", label: `${Math.abs(daysRemaining)}일 초과` };
  }
  if (daysRemaining <= 2) {
    return { daysRemaining, tone: "soon", label: daysRemaining === 0 ? "오늘 마감" : `${daysRemaining}일 남음` };
  }
  return { daysRemaining, tone: "ok", label: `${daysRemaining}일 남음` };
}

export function refundSlaToneClass(tone: RefundSlaTone): string {
  switch (tone) {
    case "over":
      return "bg-red-50 text-red-700 border-red-200";
    case "soon":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}
