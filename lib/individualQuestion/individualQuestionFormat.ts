export function formatIndividualQuestionPrice(amountCents: number | null | undefined): string {
  const value = typeof amountCents === "number" && Number.isFinite(amountCents) ? amountCents : 0;
  return `${Math.trunc(value).toLocaleString("ko-KR")}캐시`;
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

export function individualQuestionStatusLabel(status: string | null | undefined): string {
  switch ((status ?? "").toLowerCase()) {
    case "assigned":
      return "전달됨";
    case "answered":
      return "답변됨";
    case "released":
      return "완료";
    case "refunded":
      return "환불";
    case "expired":
      return "만료";
    case "canceled":
      return "취소";
    case "open":
      return "공개 대기";
    case "claimed":
      return "멘토 배정";
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
    case "assigned":
    case "claimed":
    case "open":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "refunded":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "expired":
    case "canceled":
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}
