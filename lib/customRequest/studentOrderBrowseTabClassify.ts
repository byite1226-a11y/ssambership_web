import {
  normalizedPrimaryOrderStatus,
  orderStatusLabelForUi,
} from "@/lib/customRequest/orderLifecycleConstants";

export type StudentOrderBrowseTabId = "all" | "dispute" | "waiting" | "work" | "review" | "done";

/** 분쟁 우선 → 그 외는 orderStatusLabelForUi(=카드 배지 라벨)와 동일 그룹으로 매핑 */
export function classifyStudentOrderBrowseTab(
  row: Record<string, unknown>,
  disputeIds: ReadonlySet<string>
): Exclude<StudentOrderBrowseTabId, "all"> {
  const id = typeof row.id === "string" ? row.id.trim() : "";
  if (id && disputeIds.has(id)) return "dispute";
  const label = orderStatusLabelForUi(normalizedPrimaryOrderStatus(row));
  if (label === "완료" || label === "종료됨") return "done";
  if (label === "납품 대기") return "review";
  if (label === "작업 중" || label === "수정 요청") return "work";
  if (label === "작업 대기" || label === "수락됨") return "waiting";
  return "work";
}
