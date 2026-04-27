export const MENTOR_PROFILE_DATA_MODEL = [
  "mentor_profiles (user_id, intro_line, university_name, department_name, teaching_subjects, high_school_name, student_id_image_url, verification_status)",
  "mentor_media (대표·미디어 연결 — 읽기 probe)",
  "users (닉/이름과 동기화 — 본 턴은 읽기만)",
  "구독 가능: accepts_subscriptions 등 스키마 확정 후",
] as const;

/** 멘토 채널 — 타입/공개 컬럼 확정 시 분류 정확도↑ */
export const MENTOR_CHANNEL_DATA_MODEL = [
  "mentor_media | mentor_content_links | mentor_link_items (user/mentor FK + content_type? + is_public?)",
  "업로드/Storage/shortform_posts — 본 단계는 CTA 자리만",
] as const;

/** 공개 멘토 목록 /mentors */
export const PUBLIC_MENTORS_LIST_DATA_MODEL = [
  "users — role=mentor, 최신순 fetchLimit(기본 80)",
  "mentor_profiles — user_id in (…) 배치",
  "reviews_summary | mentor_review_stats | reviews… — in-batch 집계",
  "plans | mentor_plans | … — Standard 우선·아니면 최저가",
  "subjects taxonomy — 필터는 현재 문자열 부분일치(후속)",
] as const;

/** 공개 멘토 상세 */
export const PUBLIC_MENTOR_DATA_MODEL = [
  "users(id=mentorId, role=mentor)",
  "mentor_profiles — lib/mentor/mentorDisplayFields.ts와 편집 폼 동일 키 풀",
  "mentor_media 샘플 — 대표 콘텐츠",
  "reviews | mentor_reviews | subscription_reviews — 카운트·rating 컬럼 probe",
  "plans | mentor_plans | subscription_plans — 멘토 FK probe",
  "reviews_summary 뷰 — 스키마 추가 시 연결 예정",
] as const;

export const MENTOR_PAYOUTS_DATA_MODEL = [
  "payouts, mentor_payouts, settlement_lines (이름 후보) — 수익/지급 행",
  "subscriptions — 멘토-구독 수익 요약(컬럼·RLS 확정)",
  "custom_request_orders — 맞춤의뢰 수익(멘토 FK, 읽기만)",
] as const;
