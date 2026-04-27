/** 분쟁 목록(학생/멘토 FK 필터) */
export const DISPUTE_LIST_DATA_MODEL = [
  "disputes(후보) — user_id|student_id|mentor_id 등에 따라 .eq(본인 id)",
  "읽기: refunds/payments/행 내 FK(목록 셀 요약)",
] as const;

/** W22 분쟁/환불·관리자 상세: 실제 컬럼·이름은 스키마/워드(마스터)에 맞춤 */
export const DISPUTE_W22_DATA_MODEL = [
  "disputes, order_disputes, refund_disputes(후보명) — id·사유·상태·user(s)",
  "refunds(연결) — 환불 요청·승인 상태",
  "payments(연결) — intent·금액·채널",
  "subscriptions / custom_request_orders — 관련 엔터티(선택, FK/조회)",
  "moderation_logs, admin_audit(후보) — 처리 히스토리",
] as const;
