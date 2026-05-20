export const SHORTFORM_CATEGORIES = [
  { slug: "all", label: "\uC804\uCCB4" },
  { slug: "study", label: "\uD559\uC2B5\uBC95" },
  { slug: "school", label: "\uB0B4\uC2E0" },
  { slug: "career", label: "\uC9C4\uB85C" },
  { slug: "college", label: "\uB300\uD559\uC0DD\uD65C" },
] as const;

export type ShortformCategorySlug = (typeof SHORTFORM_CATEGORIES)[number]["slug"];

export const SHORTFORM_TITLE_MAX = 100;
export const SHORTFORM_DESC_MAX = 500;
export const SHORTFORM_TAG_MAX = 5;
export const SHORTFORM_VIDEO_MAX_BYTES = 524288000;
export const SHORTFORM_VIDEO_MAX_SEC = 180;

export const SHORTFORM_VIDEO_BUCKET = "shortform-videos";
export const SHORTFORM_THUMB_BUCKET = "shortform-thumbnails";
