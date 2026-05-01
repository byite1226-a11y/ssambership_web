/**
 * 관리자 화면 표시용 — 내부 enum·영문 status를 운영자용 한국어로만 노출할 때 사용.
 * (DB 값·액션 파라미터는 변경하지 않음)
 */

const TARGET_TYPE_MAP: Record<string, string> = {
  community_post: "커뮤니티 게시글",
  mentor_review: "멘토 리뷰",
  comment: "댓글",
  shortform: "숏폼",
  user: "사용자",
};

/** 표시용 라벨과 툴팁용 원문(내부 값) */
export function adminContentTargetDisplay(raw: string | null | undefined): { label: string; tooltip: string | null } {
  const t = String(raw ?? "").trim();
  if (!t) return { label: "—", tooltip: null };
  const key = t.toLowerCase().replace(/-/g, "_");
  const label = TARGET_TYPE_MAP[key] ?? "기타";
  return { label, tooltip: t };
}

const STATUS_MAP: Record<string, string> = {
  resolved: "해결",
  pending: "접수",
  reviewing: "검토 중",
  approved: "승인 완료",
  succeeded: "처리 완료",
  rejected: "거절",
  dismissed: "종결",
  open: "접수",
  under_review: "검토 중",
  escalated: "에스컬레이션",
  canceled: "취소",
  cancelled: "취소",
  visible: "공개",
  hidden: "숨김",
  blinded: "블라인드",
  active: "활성",
  inactive: "비활성",
  reviewed: "검토됨",
  /** 멘토 인증 등 */
  submitted: "제출됨",
};

/**
 * 감사 로그 등 공통 status 표기. 알 수 없는 짧은 영문 토큰은 '기타'로만 표시하고 원문은 툴팁에 둔다.
 */
export function adminOperationalStatusLabel(raw: string | null | undefined): string {
  const t = String(raw ?? "").trim();
  if (!t) return "—";
  const key = t.toLowerCase();
  if (STATUS_MAP[key]) return STATUS_MAP[key];
  if (/^[a-z][a-z0-9_-]*$/i.test(t) && t.length <= 48) return "기타";
  return t.length > 32 ? `${t.slice(0, 31)}…` : t;
}

const NOTICE_TYPE_MAP: Record<string, string> = {
  notice: "공지",
  event: "이벤트",
  maintenance: "점검",
  update: "업데이트",
};

export function adminAppNoticeTypeLabel(raw: string | null | undefined): string {
  const t = String(raw ?? "").trim().toLowerCase();
  if (!t) return "—";
  return NOTICE_TYPE_MAP[t] ?? adminOperationalStatusLabel(raw);
}
