const DAY_MS = 24 * 60 * 60 * 1000;

export type ProratedRefundEstimate = {
  amountCents: number;
  remainingDays: number;
  totalDays: number;
  remainingRatio: number;
};

function validDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function computeProratedRefundEstimate(args: {
  amountCents: number | null | undefined;
  periodStartIso: string | null | undefined;
  periodEndIso: string | null | undefined;
  now?: Date;
}): ProratedRefundEstimate {
  const amountCents = Math.max(0, Math.trunc(args.amountCents ?? 0));
  const start = validDate(args.periodStartIso);
  const end = validDate(args.periodEndIso);
  const now = args.now && !Number.isNaN(args.now.getTime()) ? args.now : new Date();

  if (!amountCents || !start || !end || end.getTime() <= start.getTime()) {
    return { amountCents: 0, remainingDays: 0, totalDays: 0, remainingRatio: 0 };
  }

  const totalMs = end.getTime() - start.getTime();
  const remainingMs = Math.max(0, end.getTime() - now.getTime());
  const remainingRatio = Math.min(1, remainingMs / totalMs);

  return {
    amountCents: Math.floor(amountCents * remainingRatio),
    remainingDays: Math.ceil(remainingMs / DAY_MS),
    totalDays: Math.max(1, Math.ceil(totalMs / DAY_MS)),
    remainingRatio,
  };
}

export function formatCashFromCents(amountCents: number | null | undefined): string {
  const cash = Math.max(0, Math.round((amountCents ?? 0) / 100));
  return `${cash.toLocaleString("ko-KR")}캐시`;
}

export function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "일정 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "일정 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
