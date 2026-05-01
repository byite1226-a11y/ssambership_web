/** UI 대기 표시와 승인/반려 update `.in(...)` 조건이 동일해야 함 (Claude H1). */
export const MENTOR_PENDING_STATUSES = [
  "pending",
  "submitted",
  "under_review",
  "awaiting",
  "review",
  "new",
  "PENDING",
] as const;

/** `verification_status` 등 컬럼 값이 DB에 그대로 올 수 있는 목록(`.in`용). */
export const MENTOR_PENDING_STATUS_VALUES_FOR_IN: readonly string[] = [...MENTOR_PENDING_STATUSES];

/** 행 값을 소문자로 맞춘 뒤 비교할 때 사용(표시·버튼 노출). */
export const MENTOR_PENDING_STATUS_SET: ReadonlySet<string> = new Set(
  MENTOR_PENDING_STATUSES.map((s) => s.toLowerCase())
);
