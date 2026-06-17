// 저장값은 정규 단위 cents(=캐시×100). 표시는 ÷100 하여 캐시로 노출(구독·지갑과 동일 규약).
export function formatIndividualQuestionPrice(amountCents: number | null | undefined): string {
  const value = typeof amountCents === "number" && Number.isFinite(amountCents) ? amountCents : 0;
  const cash = Math.floor(Math.abs(value) / 100);
  return `${cash.toLocaleString("ko-KR")}캐시`;
}

export function formatIndividualQuestionDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export function individualQuestionTypeLabel(questionType: string | null | undefined): string {
  return (questionType ?? "").toLowerCase() === "open" ? "공개형" : "지정형";
}

export function individualQuestionStatusLabel(status: string | null | undefined): string {
  switch ((status ?? "").toLowerCase()) {
    case "escrowed":
      return "예치중";
    case "open":
      return "공개중";
    case "assigned":
    case "claimed":
      return "답변중";
    case "answered":
      return "답변완료";
    case "released":
      return "완료";
    case "refunded":
      return "환불";
    case "expired":
      return "만료";
    case "canceled":
      return "취소";
    default:
      return "진행 중";
  }
}

export function individualQuestionStatusBadgeClass(status: string | null | undefined): string {
  switch ((status ?? "").toLowerCase()) {
    case "released":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "answered":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "escrowed":
    case "assigned":
    case "claimed":
    case "open":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "refunded":
      return "border-slate-200 bg-slate-50 text-slate-600";
    case "expired":
    case "canceled":
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

/** 환불/지급 등으로 종료되지 않고 아직 답변을 기다리는 상태인지 */
export function isIndividualQuestionAwaitingAnswer(status: string | null | undefined): boolean {
  switch ((status ?? "").toLowerCase()) {
    case "escrowed":
    case "open":
    case "assigned":
    case "claimed":
      return true;
    default:
      return false;
  }
}

/** 멘토가 답변을 완료(지급 포함)한 상태인지 */
export function isIndividualQuestionAnswered(status: string | null | undefined): boolean {
  const value = (status ?? "").toLowerCase();
  return value === "answered" || value === "released";
}

const EXPIRY_SOON_THRESHOLD_MS = 12 * 60 * 60 * 1000;

/** 답변 대기 상태에서 만료가 임박(기본 12시간 이내)했는지 — now 기준 */
export function isIndividualQuestionExpiringSoon(
  expiresAt: string | null | undefined,
  status: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!isIndividualQuestionAwaitingAnswer(status)) return false;
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return false;
  const remaining = expiry.getTime() - now.getTime();
  return remaining > 0 && remaining <= EXPIRY_SOON_THRESHOLD_MS;
}

/** 답변 대기 상태에서 남은 마감 시간을 사람이 읽을 수 있게 — 만료됨/곧 마감/N시간 후/N일 후 */
export function formatIndividualQuestionExpiryRemaining(
  expiresAt: string | null | undefined,
  status: string | null | undefined,
  now: Date = new Date()
): string | null {
  if (!isIndividualQuestionAwaitingAnswer(status)) return null;
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return null;
  const remainingMs = expiry.getTime() - now.getTime();
  if (remainingMs <= 0) return "마감 지남";
  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  if (hours < 1) return "곧 마감";
  if (hours < 24) return `${hours}시간 후 마감`;
  const days = Math.floor(hours / 24);
  return `${days}일 후 마감`;
}
