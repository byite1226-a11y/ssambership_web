/** public.content_reports.status 표시용 */
export function contentReportStatusLabel(raw: string): string {
  const s = raw.trim().toLowerCase();
  switch (s) {
    case "pending":
      return "접수";
    case "reviewing":
      return "검토 중";
    case "resolved":
      return "처리 완료";
    case "rejected":
      return "반려";
    case "dismissed":
      return "종결";
    default:
      if (!s) return "—";
      return `${raw.trim()} (확인 필요)`;
  }
}

export function contentReportRowIsActionable(statusRaw: string): boolean {
  const s = statusRaw.trim().toLowerCase();
  return s === "pending" || s === "reviewing";
}
