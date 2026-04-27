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
  };
}
