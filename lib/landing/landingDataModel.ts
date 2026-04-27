export const LANDING_DATA_MODEL = [
  "notices | site_notices | promotions — 상단 배너",
  "users + mentor_profiles — 추천 멘토(loadPublicMentorsList)",
  "shortform_posts / community_posts — 커뮤니티 미리보기(listShortformPosts / listBoardPosts)",
  "plans 계열 — 요금제 미리보기(글로벌 샘플 + 티어 매핑)",
  "trust — users·posts count(head) 또는 RLS 안내",
] as const;
