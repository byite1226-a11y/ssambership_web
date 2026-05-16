import type { UserRow } from "@/lib/types/user";
import {
  getProfileFieldBool,
  getProfileFieldString,
} from "@/lib/mentor/mentorProfileQueries";

type Row = Record<string, unknown>;

/** 편집 폼 initial / 공개 상세 상단에서 동일 키 풀로 읽기 */
export type MentorProfileDisplay = {
  displayName: string;
  intro: string;
  university: string;
  department: string;
  subjects: string;
  highSchool: string;
  tags: string;
  subOpen: boolean;
  photoUrl: string;
  verification: string;
  grade: string;
};

export function mentorDisplayNameFromUser(user: UserRow | null): string {
  if (!user) return "멘토";
  const n = (user.full_name ?? "").trim() || (user.nickname ?? "").trim();
  return n || "멘토";
}

export function buildMentorProfileDisplay(
  profileRow: Row | null,
  userRow: UserRow | null
): MentorProfileDisplay {
  return {
    displayName: mentorDisplayNameFromUser(userRow),
    intro: getProfileFieldString(profileRow, ["intro_line", "bio", "about"]),
    university: getProfileFieldString(profileRow, ["university_name"]),
    department: getProfileFieldString(profileRow, ["department_name", "major_name"]),
    subjects: getProfileFieldString(profileRow, ["teaching_subjects", "subjects", "subject_list"]),
    highSchool: getProfileFieldString(profileRow, ["high_school_name"]),
    tags: getProfileFieldString(profileRow, ["tags", "featured_tags", "label_list"]),
    subOpen:
      getProfileFieldBool(profileRow, [
        "accepts_subscriptions",
        "accept_subscriptions",
        "is_open_for_subscriptions",
      ]) ?? false,
    photoUrl: getProfileFieldString(profileRow, [
      "student_id_image_url",
      "profile_image_url",
      "avatar_url",
      "portrait_url",
    ]),
    verification: getProfileFieldString(profileRow, ["verification_status", "kyc_status"]),
    grade: getProfileFieldString(profileRow, ["grade", "grade_level", "academic_year"]),
  };
}

/** 멘토 인증 상태 — 사용자 화면용 */
export function mentorVerificationKo(raw: string | null | undefined): string {
  const t = String(raw ?? "").trim();
  if (!t || /^null$/i.test(t)) return "미등록";
  const s = t.toLowerCase();
  const map: Record<string, string> = {
    approved: "인증 완료",
    verified: "인증 완료",
    complete: "인증 완료",
    pending: "검토 중",
    in_review: "검토 중",
    reviewing: "검토 중",
    under_review: "검토 중",
    rejected: "반려",
    denied: "반려",
    none: "미등록",
    unset: "미등록",
  };
  return map[s] ?? (t.length > 28 ? `${t.slice(0, 24)}…` : t);
}
