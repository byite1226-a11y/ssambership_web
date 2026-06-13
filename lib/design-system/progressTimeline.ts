/** 맞춤의뢰 주문 진행 단계 — ProgressTimeline 기본 스텝 */

export type DsProgressStep = {
  id: string;
  label: string;
};

export const DS_CUSTOM_ORDER_PROGRESS_STEPS: readonly DsProgressStep[] = [
  { id: "billing", label: "작업 대기" },
  { id: "work", label: "작업 중" },
  { id: "delivery", label: "납품 대기" },
  { id: "revision", label: "수정 요청" },
  { id: "done", label: "완료" },
] as const;
