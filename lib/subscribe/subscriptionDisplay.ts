import { subscriptionAnchorWeekBounds } from "@/lib/qna/weeklyQuestionUsage";

export type SubscriptionStatusTone = "active" | "scheduled" | "pastDue" | "expired" | "refunded" | "neutral";

export function subscriptionRenewalEnabled(): boolean {
  return process.env.SUBSCRIPTION_RENEWAL_ENABLED === "true";
}

export function formatSubscriptionDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatSubscriptionDateWithWeekday(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function formatSubscriptionPeriodLabel(start: string | null | undefined, end: string | null | undefined): string {
  const startLabel = formatSubscriptionDate(start);
  const endLabel = formatSubscriptionDate(end);
  if (startLabel === "—" && endLabel === "—") return "—";
  return `${startLabel} ~ ${endLabel}`;
}

export function subscriptionStatusTone(status: string, cancelAtPeriodEnd: boolean): SubscriptionStatusTone {
  const normalized = status.trim().toLowerCase();
  if (normalized === "cancel_scheduled") return "scheduled";
  if (cancelAtPeriodEnd && (normalized === "active" || normalized === "past_due")) return "scheduled";
  if (normalized === "active") return "active";
  if (normalized === "past_due") return "pastDue";
  if (normalized === "expired" || normalized === "canceled" || normalized === "cancelled") return "expired";
  if (normalized === "refunded") return "refunded";
  return "neutral";
}

export function subscriptionStatusDisplayLabel(args: {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  graceUntil?: string | null;
}): string {
  const normalized = args.status.trim().toLowerCase();
  const periodEnd = formatSubscriptionDate(args.currentPeriodEnd);
  if (normalized === "cancel_scheduled" || (args.cancelAtPeriodEnd && (normalized === "active" || normalized === "past_due"))) {
    return periodEnd === "—" ? "구독 만료 예정" : `구독 만료 예정 · ${periodEnd}까지 이용`;
  }
  if (normalized === "active") return "이용 중";
  if (normalized === "past_due") {
    const grace = formatSubscriptionDate(args.graceUntil);
    return grace === "—" ? "결제 실패 · 충전 필요" : `결제 실패 · ${grace}까지 충전 필요`;
  }
  if (normalized === "expired") return "만료됨 · 재구독 가능";
  if (normalized === "canceled" || normalized === "cancelled") return "해지됨";
  if (normalized === "refunded") return "환불됨";
  return normalized || "상태 확인 필요";
}

export function nextBillingDisplayLabel(args: {
  status: string;
  cancelAtPeriodEnd: boolean;
  nextBillingAt: string | null;
  amountLabel: string | null;
  renewalEnabled?: boolean;
}): string {
  const normalized = args.status.trim().toLowerCase();
  if (normalized === "cancel_scheduled" || (args.cancelAtPeriodEnd && (normalized === "active" || normalized === "past_due"))) {
    return "자동 갱신 중단됨";
  }
  if (normalized === "expired" || normalized === "canceled" || normalized === "cancelled") return "재구독 가능";
  if (normalized === "refunded") return "환불 완료";

  const date = formatSubscriptionDate(args.nextBillingAt);
  if (date === "—") return "—";
  const amount = args.amountLabel ?? "금액 확인 필요";
  if (args.renewalEnabled) return `다음 결제일 ${date}에 ${amount}`;
  return `자동 갱신 준비 중 · ${date} 예정 · ${amount}`;
}

export function weeklyQuestionResetLabel(anchorIso: string | null | undefined): string {
  const bounds = subscriptionAnchorWeekBounds(anchorIso);
  if (!bounds) return "구독 시작일 기준 7일마다 갱신";
  return `다음 갱신 ${formatSubscriptionDateWithWeekday(bounds.end.toISOString())}`;
}
