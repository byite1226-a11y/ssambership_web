/**
 * Design System — StatusBadge tone 매핑
 * 빌드18 MentorPostStatusBadge(연한 배경+또렷한 글자 pill) 패턴 계승
 */

export type DsStatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "indigo";

/** UI 상태 enum — 도메인 상태는 이 중 하나로 매핑해 사용 */
export type DsStatusKind =
  | "default"
  | "pending"
  | "active"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "delivery";

export const DS_STATUS_KIND_TO_TONE: Record<DsStatusKind, DsStatusTone> = {
  default: "neutral",
  pending: "warning",
  active: "info",
  success: "success",
  warning: "warning",
  error: "danger",
  info: "info",
  delivery: "indigo",
};

export const DS_STATUS_TONE_CLASSES: Record<DsStatusTone, string> = {
  neutral: "border-slate-300 bg-slate-100 text-slate-700",
  info: "border-sky-300 bg-sky-100 text-sky-800",
  success: "border-emerald-300 bg-emerald-100 text-emerald-800",
  warning: "border-amber-300 bg-amber-100 text-amber-800",
  danger: "border-2 border-red-400 bg-red-50 font-bold text-red-800",
  indigo: "border-indigo-300 bg-indigo-100 text-indigo-800",
};
