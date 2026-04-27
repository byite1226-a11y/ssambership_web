import type { StudentSignupFormValues } from "@/components/auth/StudentSignupForm";
import type { MentorSignupFormValues } from "@/components/auth/MentorSignupForm";
import type { AppRole } from "@/lib/types/user";

export type StudentSignupFields = {
  email: string;
  password: string;
  passwordConfirm: string;
  student: StudentSignupFormValues;
  termsAgree: boolean;
  privacyAgree: boolean;
};

export type MentorSignupFields = {
  email: string;
  password: string;
  passwordConfirm: string;
  mentor: MentorSignupFormValues;
  termsAgree: boolean;
  privacyAgree: boolean;
};

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** 학생 가입: 계정 + 프로필 + 필수 약관 */
export function validateStudentSignup(f: StudentSignupFields): string | null {
  if (!f.email.trim() || !emailOk(f.email)) {
    return "이메일 형식을 확인해 주세요.";
  }
  if (f.password.length < 6) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  if (f.password !== f.passwordConfirm) {
    return "비밀번호가 서로 일치하지 않습니다.";
  }
  if (!f.student.nickname.trim() || !f.student.gradeLevel.trim()) {
    return "닉네임과 학교(학년)를 모두 입력해 주세요.";
  }
  if (!f.termsAgree || !f.privacyAgree) {
    return "필수 약관(이용·개인정보)에 모두 동의해 주세요.";
  }
  return null;
}

/** 멘토 가입: 계정 + 인증/프로필 + 필수 약관 */
export function validateMentorSignup(f: MentorSignupFields): string | null {
  if (!f.email.trim() || !emailOk(f.email)) {
    return "이메일 형식을 확인해 주세요.";
  }
  if (f.password.length < 6) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  if (f.password !== f.passwordConfirm) {
    return "비밀번호가 서로 일치하지 않습니다.";
  }
  const m = f.mentor;
  if (!m.nickname.trim()) {
    return "닉네임을 입력해 주세요.";
  }
  if (!m.universityName.trim() || !m.departmentName.trim() || !m.highSchoolName.trim()) {
    return "대학교·학과·출신 고등학교는 필수입니다.";
  }
  if (!m.teachingSubjectsCsv.trim()) {
    return "전공 과목을 한 개 이상 입력해 주세요. (쉼표로 구분)";
  }
  if (!m.introLine.trim()) {
    return "멘토 소개 한 줄을 입력해 주세요.";
  }
  if (!m.studentIdFile) {
    return "학생증 또는 재학증명서 파일을 선택해 주세요.";
  }
  if (!f.termsAgree || !f.privacyAgree) {
    return "필수 약관(이용·개인정보)에 모두 동의해 주세요.";
  }
  return null;
}

export function validateSignupByRole(
  role: Extract<AppRole, "student" | "mentor">,
  student: StudentSignupFields,
  mentor: MentorSignupFields
): string | null {
  if (role === "student") {
    return validateStudentSignup(student);
  }
  return validateMentorSignup(mentor);
}
