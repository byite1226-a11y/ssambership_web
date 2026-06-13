/** 무료 질문권 정책 — 멘토 상세·구독 등 UI 공통 문구 */
export const FREE_QUESTION_TOTAL_LIMIT = 7 as const;
export const FREE_QUESTION_PER_MENTOR_LIMIT = 3 as const;
/** 가입일(users.created_at) 기준 유효 기간 */
export const FREE_QUESTION_EXPIRY_DAYS = 7 as const;

export const FREE_QUESTION_POLICY_SHORT =
  `무료 질문권으로 멘토당 최대 ${FREE_QUESTION_PER_MENTOR_LIMIT}개 질문 가능 (가입 시 ${FREE_QUESTION_TOTAL_LIMIT}개 지급, ${FREE_QUESTION_EXPIRY_DAYS}일간 유효)`;
