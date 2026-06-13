export type QuestionThreadWorkflowStatus = "pending" | "answered" | "confirmed";

const WORKFLOW_STATUSES: readonly QuestionThreadWorkflowStatus[] = ["pending", "answered", "confirmed"];

export function isQuestionThreadWorkflowStatus(v: unknown): v is QuestionThreadWorkflowStatus {
  return typeof v === "string" && (WORKFLOW_STATUSES as readonly string[]).includes(v);
}

/** DB status — 신규 3단계 우선, open/closed/archived 레거시 매핑 */
export function readQuestionThreadWorkflowStatus(
  row: Record<string, unknown> | null | undefined
): QuestionThreadWorkflowStatus {
  if (!row) return "pending";
  const s = String(row.status ?? "")
    .toLowerCase()
    .trim();
  if (s === "pending" || s === "answered" || s === "confirmed") return s;
  if (s === "closed" || s === "archived") return "confirmed";
  return "pending";
}

export function workflowStatusLabel(status: QuestionThreadWorkflowStatus): string {
  // v4 라벨: 멘토 답변 = 진행 중, 명시적 확정 = 답변 완료
  if (status === "pending") return "답변 대기";
  if (status === "answered") return "진행 중";
  return "답변 완료";
}

export function workflowStatusTone(
  status: QuestionThreadWorkflowStatus
): "amber" | "blue" | "emerald" {
  if (status === "pending") return "amber";
  if (status === "answered") return "blue";
  return "emerald";
}

export const WEEKLY_QUESTION_LIMIT_MESSAGE = "이번 주 질문 한도를 모두 사용했습니다";
