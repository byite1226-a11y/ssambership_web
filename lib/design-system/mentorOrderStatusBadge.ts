import { classifyMentorOrderBrowseTab } from "@/lib/customRequest/mentorOrderBrowseTabClassify";
import type { DsStatusKind } from "@/lib/design-system/statusBadge";

type Row = Record<string, unknown>;

/** 맞춤의뢰 멘토 주문 목록·대시보드 공통 상태 → StatusBadge kind */
export function mentorCustomOrderBrowseStatus(
  row: Row,
  disputeSet: ReadonlySet<string>
): { label: string; kind: DsStatusKind } {
  const id = typeof row.id === "string" ? row.id.trim() : "";
  if (id && disputeSet.has(id)) return { label: "분쟁", kind: "error" };
  const tab = classifyMentorOrderBrowseTab(row, disputeSet);
  if (tab === "billing") return { label: "작업 대기", kind: "pending" };
  if (tab === "revision") return { label: "수정 요청", kind: "warning" };
  if (tab === "delivery") return { label: "납품 대기", kind: "delivery" };
  if (tab === "done") return { label: "종료됨", kind: "default" };
  return { label: "작업 중", kind: "active" };
}
