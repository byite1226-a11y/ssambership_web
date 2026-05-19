import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";

export type MentorOpenPostCategoryId = "study" | "career" | "essay" | "other";

export const MENTOR_OPEN_POST_CATEGORY_LABELS: Record<MentorOpenPostCategoryId, string> = {
  study: "공부/과제",
  career: "진로/입시",
  essay: "자기소개서",
  other: "기타",
};

export const MENTOR_OPEN_POST_CATEGORY_COLORS: Record<MentorOpenPostCategoryId, string> = {
  study: "#3b82f6",
  career: "#a78bfa",
  essay: "#34d399",
  other: "#fbbf24",
};

export function getMentorOpenPostCategoryId(row: Record<string, unknown>): MentorOpenPostCategoryId {
  const cat = pickDisplayField(row, ["category_label", "category", "category_name", "subject_area"]);
  if (cat === "—") return "other";
  const lower = cat.toLowerCase();
  if (lower.includes("공부") || lower.includes("과제") || lower.includes("수학") || lower.includes("영어") || lower.includes("학습")) {
    return "study";
  }
  if (lower.includes("진로") || lower.includes("입시") || lower.includes("진학") || lower.includes("상담")) {
    return "career";
  }
  if (lower.includes("자기소개서") || lower.includes("자소서") || lower.includes("essay")) {
    return "essay";
  }
  return "other";
}

export function countOpenPostsByCategory(rows: Record<string, unknown>[]): Record<MentorOpenPostCategoryId, number> {
  const counts: Record<MentorOpenPostCategoryId, number> = { study: 0, career: 0, essay: 0, other: 0 };
  for (const row of rows) {
    counts[getMentorOpenPostCategoryId(row)] += 1;
  }
  return counts;
}
