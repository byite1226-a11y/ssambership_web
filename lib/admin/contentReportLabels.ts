/** public.content_reports.status 표시용 */
export function contentReportStatusLabel(raw: string): string {
  const s = raw.trim().toLowerCase();
  switch (s) {
    case "pending":
      return "접수";
    case "reviewing":
      return "검토 중";
    case "resolved":
      return "해결";
    case "rejected":
      return "거절";
    case "dismissed":
      return "종결";
    default:
      if (!s) return "—";
      return "기타";
  }
}

export function contentReportRowIsActionable(statusRaw: string): boolean {
  const s = statusRaw.trim().toLowerCase();
  return s === "pending" || s === "reviewing";
}
