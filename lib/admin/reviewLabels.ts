type Row = Record<string, unknown>;

export type ReviewHideMode = "boolean_true" | "boolean_false_for_visible";

export type AdminReviewModerationPlan = {
  hide: { column: string; mode: ReviewHideMode } | null;
  blind: { column: string } | null;
  reviewDone: { column: string; kind: "timestamp" | "enum"; enumValue: string } | null;
};

function truthy(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

function falsyVisible(v: unknown): boolean {
  return v === false || v === "false" || v === 0 || v === "0";
}

function moderationStateRaw(row: Row): string {
  const v = row.moderation_state ?? row.moderation_status;
  return v != null ? String(v).trim().toLowerCase() : "";
}

function hiddenEffective(row: Row, plan: AdminReviewModerationPlan): boolean {
  if (!plan.hide) return false;
  const { column, mode } = plan.hide;
  const v = row[column];
  if (mode === "boolean_true") return truthy(v);
  return falsyVisible(v);
}

export function adminReviewRowIsBlinded(row: Row, plan: AdminReviewModerationPlan): boolean {
  const mod = moderationStateRaw(row);
  if (mod === "blinded") return true;
  const c = plan.blind?.column;
  return Boolean(c && truthy(row[c]));
}

function reviewedEffective(row: Row, plan: AdminReviewModerationPlan): boolean {
  const mod = moderationStateRaw(row);
  if (mod === "reviewed") return true;
  if (plan.reviewDone?.kind === "enum") {
    const raw = row[plan.reviewDone.column];
    const s = raw != null ? String(raw).trim().toLowerCase() : "";
    if (s === plan.reviewDone.enumValue.toLowerCase()) return true;
  }
  if (plan.reviewDone?.kind === "timestamp") {
    const raw = row[plan.reviewDone.column];
    return raw != null && String(raw).trim() !== "";
  }
  return false;
}

/**
 * 노출·검토 한 줄 라벨.
 * 우선순위: 블라인드(boolean 또는 moderation_state) > 숨김(boolean 또는 hidden) > 검토 완료 > 공개
 */
export function adminReviewRowIsHidden(row: Row, plan: AdminReviewModerationPlan): boolean {
  return hiddenEffective(row, plan) || moderationStateRaw(row) === "hidden";
}

export function adminReviewRowIsReviewed(row: Row, plan: AdminReviewModerationPlan): boolean {
  return reviewedEffective(row, plan);
}

/** 테이블 「노출·상태」 한 줄. 상세 의미는 리뷰 관리 페이지·버튼 도움말 참고. */
export function adminReviewExposureLabel(row: Row, plan: AdminReviewModerationPlan): string {
  if (adminReviewRowIsBlinded(row, plan)) {
    return "블라인드";
  }
  if (adminReviewRowIsHidden(row, plan)) {
    return "숨김";
  }
  if (adminReviewRowIsReviewed(row, plan)) {
    return "검토 완료";
  }
  return "공개";
}
