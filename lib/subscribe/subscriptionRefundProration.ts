/**
 * 구독 환불 추정 계산 — 학원법 시행령 별표4 분기형.
 *
 * 모드:
 *  - "student_voluntary" (default): 학원법 별표4 적용
 *    · 이용 개시 전(usageStarted=false): 전액
 *    · 경과율 < 1/3: 2/3 환불
 *    · 경과율 < 1/2: 1/2 환불
 *    · 경과율 ≥ 1/2: 환불 없음
 *  - "mentor_suspended" (제공자 사정 중단): 남은 기간 × 결제액 (잔여 100% 일할비례)
 *    학원법 "제공자 사정으로 교습 불가 시 남은 기간 환불" 조항 반영.
 *
 * 1개월 초과 결제(분기·연간) 대응은 현 monthly 모델 범위 밖이라 추후.
 */

export type RefundMode = "student_voluntary" | "mentor_suspended";

export type RefundBracketReason =
  | "before_usage" // 이용 개시 전 — 전액
  | "lt_1_3" // 학생자발: 경과율 < 1/3 → 2/3 환불
  | "lt_1_2" // 학생자발: 경과율 < 1/2 → 1/2 환불
  | "ge_1_2" // 학생자발: 경과율 ≥ 1/2 → 환불 없음
  | "mentor_remaining" // 멘토 사정: 남은 기간 일할비례
  | "invalid"; // 입력값 부족 — 계산 불가

export type ProratedRefundEstimate = {
  amountCents: number;
  remainingDays: number;
  totalDays: number;
  remainingRatio: number;
  bracketReason: RefundBracketReason;
  mode: RefundMode;
};

const DAY_MS = 24 * 60 * 60 * 1000;

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
  /** 학원법 "이용 개시" 판정 — 첫 질문 작성 여부. mode='student_voluntary' 에서만 사용. */
  usageStarted?: boolean;
  /** 환불 사유 모드. default = student_voluntary */
  mode?: RefundMode;
}): ProratedRefundEstimate {
  const amountCents = Math.max(0, Math.trunc(args.amountCents ?? 0));
  const start = validDate(args.periodStartIso);
  const end = validDate(args.periodEndIso);
  const now = args.now && !Number.isNaN(args.now.getTime()) ? args.now : new Date();
  const mode: RefundMode = args.mode ?? "student_voluntary";

  if (!amountCents || !start || !end || end.getTime() <= start.getTime()) {
    return {
      amountCents: 0,
      remainingDays: 0,
      totalDays: 0,
      remainingRatio: 0,
      bracketReason: "invalid",
      mode,
    };
  }

  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = Math.max(0, now.getTime() - start.getTime());
  const remainingMs = Math.max(0, end.getTime() - now.getTime());
  const remainingRatio = Math.min(1, remainingMs / totalMs);
  const elapsedRatio = Math.min(1, elapsedMs / totalMs);
  const totalDays = Math.max(1, Math.ceil(totalMs / DAY_MS));
  const remainingDays = Math.ceil(remainingMs / DAY_MS);

  // (1) 멘토 사정 중단 — 학원법 "남은 기간 환불" 그대로(잔여 일할비례 100%).
  //     "이용 개시" 구간 가산은 적용하지 않는다(과실이 제공자에 있으므로).
  if (mode === "mentor_suspended") {
    return {
      amountCents: Math.floor(amountCents * remainingRatio),
      remainingDays,
      totalDays,
      remainingRatio,
      bracketReason: "mentor_remaining",
      mode,
    };
  }

  // (2) 학생 자발 환불 — 학원법 별표4 분기형

  // 이용 개시 전: 전액 환불
  if (args.usageStarted === false) {
    return {
      amountCents,
      remainingDays,
      totalDays,
      remainingRatio,
      bracketReason: "before_usage",
      mode,
    };
  }

  // 경과율 < 1/3 → 결제액 × 2/3
  if (elapsedRatio < 1 / 3) {
    return {
      amountCents: Math.floor((amountCents * 2) / 3),
      remainingDays,
      totalDays,
      remainingRatio,
      bracketReason: "lt_1_3",
      mode,
    };
  }

  // 경과율 < 1/2 → 결제액 × 1/2
  if (elapsedRatio < 1 / 2) {
    return {
      amountCents: Math.floor(amountCents / 2),
      remainingDays,
      totalDays,
      remainingRatio,
      bracketReason: "lt_1_2",
      mode,
    };
  }

  // 경과율 ≥ 1/2 → 환불 없음
  return {
    amountCents: 0,
    remainingDays,
    totalDays,
    remainingRatio,
    bracketReason: "ge_1_2",
    mode,
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

/** 학원법 분기 결과를 사용자에게 보여줄 사유 문구. */
export function refundBracketLabelKo(reason: RefundBracketReason): string {
  switch (reason) {
    case "before_usage":
      return "이용 개시 전 — 전액 환불";
    case "lt_1_3":
      return "기간 1/3 미경과 — 결제액의 2/3 환불";
    case "lt_1_2":
      return "기간 1/2 미경과 — 결제액의 1/2 환불";
    case "ge_1_2":
      return "기간 1/2 경과 — 환불 가능 금액 없음";
    case "mentor_remaining":
      return "제공자 사정 — 남은 기간만큼 환불";
    case "invalid":
      return "환불 추정 불가";
    default:
      return "";
  }
}
