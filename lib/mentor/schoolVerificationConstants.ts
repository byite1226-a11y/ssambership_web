export const VERIFIED_MAJOR_CATEGORIES = [
  "메디컬",
  "교육",
  "인문",
  "사회상경",
  "자연",
  "공학",
  "예체능",
  "기타",
] as const;

export type VerifiedMajorCategory = (typeof VERIFIED_MAJOR_CATEGORIES)[number];

export const SCHOOL_TIERS = ["서연고", "서성한", "중경외시", "건동홍", "그외", "미분류"] as const;

export type SchoolTier = (typeof SCHOOL_TIERS)[number];

export const SCHOOL_VERIFICATION_REVIEW_STATUSES = ["pending", "resubmit_required"] as const;
