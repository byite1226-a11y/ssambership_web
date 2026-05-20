export const COMMUNITY_POST_CATEGORIES = [
  { slug: "all", label: "\uC804\uCCB4" },
  { slug: "study", label: "\uD559\uC2B5\uBC95" },
  { slug: "school", label: "\uB0B4\uC2E0" },
  { slug: "career", label: "\uC9C4\uB85C" },
  { slug: "college", label: "\uB300\uD559\uC0DD\uD65C" },
  { slug: "free", label: "\uC790\uC720" },
] as const;

export type CommunityPostCategorySlug = (typeof COMMUNITY_POST_CATEGORIES)[number]["slug"];

export const COMMUNITY_POST_PAGE_SIZE = 12;

export const COMMUNITY_IMAGE_MAX = 5;

export const COMMUNITY_HASHTAG_MAX = 5;

export const COMMUNITY_BODY_MIN = 10;
