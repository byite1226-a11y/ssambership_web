import type { AppRole } from "@/lib/types/user";

export type BuildSignupOptions = {
  role: Exclude<AppRole, "admin">;
  fullName: string;
  nickname: string;
  gradeLevel: string;
  studentStatus: string;
  birthDate: string;
  termsAgree: boolean;
  privacyAgree: boolean;
  marketingAgree: boolean;
  universityName: string;
  departmentName: string;
  teachingSubjectsCsv: string;
  highSchoolName: string;
  introLine: string;
};

/**
 * supabase.auth.signUp({ options: { data }}) 및 DB 트리거 handle_new_auth_user()와 키를 맞출 것
 */
export function buildSignupUserMetadata(o: BuildSignupOptions): Record<string, string> {
  return {
    app_role: o.role,
    full_name: o.fullName.trim(),
    nickname: o.nickname.trim(),
    grade_level: o.gradeLevel.trim(),
    student_status: o.studentStatus.trim(),
    birth_date: o.birthDate.trim(),
    terms_agreed: o.termsAgree ? "true" : "false",
    privacy_agreed: o.privacyAgree ? "true" : "false",
    marketing_agreed: o.marketingAgree ? "true" : "false",
    university_name: o.universityName.trim(),
    department_name: o.departmentName.trim(),
    teaching_subjects_csv: o.teachingSubjectsCsv.trim(),
    high_school_name: o.highSchoolName.trim(),
    intro_line: o.introLine.trim(),
  };
}
