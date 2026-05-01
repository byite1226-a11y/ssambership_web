/** 분쟁 status 값(004 스키마) 기준 운영자 표기 */
export function adminDisputeStatusLabel(raw: string | null | undefined): string {
  const s = (raw ?? "").trim().toLowerCase();
  const map: Record<string, string> = {
    open: "접수·진행",
    under_review: "검토 중",
    escalated: "에스컬레이션",
    resolved: "해결",
    dismissed: "종결",
  };
  return map[s] ?? (raw && String(raw).trim() ? `${String(raw).trim()} (확인 필요)` : "—");
}
