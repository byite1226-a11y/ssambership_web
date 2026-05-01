import { MENTOR_PENDING_STATUS_SET } from "@/lib/admin/mentorApprovalConstants";

export function mentorApprovalStatusRaw(row: Record<string, unknown>, statusColumn: string | null | undefined): string {
  if (!statusColumn) return "";
  const v = row[statusColumn];
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

export function mentorApprovalStatusLabel(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!s) return "—";
  if (MENTOR_PENDING_STATUS_SET.has(s)) return "승인 대기";
  if (s === "approved" || s === "verified" || s === "active") return "승인 완료";
  if (s === "rejected" || s === "declined") return "반려";
  if (s === "suspended" || s === "inactive") return "비활성";
  return `${raw.trim()} (확인 필요)`;
}

export function mentorApprovalRowIsPending(row: Record<string, unknown>, statusColumn: string | null | undefined): boolean {
  const s = mentorApprovalStatusRaw(row, statusColumn);
  if (!s) return true;
  return MENTOR_PENDING_STATUS_SET.has(s);
}

