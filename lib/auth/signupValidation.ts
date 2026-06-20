import type { StudentSignupFormValues } from "@/components/auth/StudentSignupForm";
import type { MentorSignupFormValues } from "@/components/auth/MentorSignupForm";
import type { AppRole } from "@/lib/types/user";
import { isFutureBirthDate, parseBirthDateParts } from "@/lib/auth/minorAgeGate";

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

export type SignupFieldErrors = Partial<Record<string, string>>;

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function studentSignupFieldErrors(f: StudentSignupFields): SignupFieldErrors {
  const errors: SignupFieldErrors = {};
  if (!f.email.trim()) {
    errors.email = "이메일을 입력해 주세요.";
  } else if (!emailOk(f.email)) {
    errors.email = "이메일 형식을 확인해 주세요.";
  }
  if (f.password.length < 6) {
    errors.password = "비밀번호는 6자 이상이어야 합니다.";
  }
  if (f.password !== f.passwordConfirm) {
    errors.passwordConfirm = "비밀번호가 서로 일치하지 않습니다.";
  }
  if (!f.student.birthDate.trim()) {
    errors.birthDate = "생년월일을 입력해 주세요.";
  } else if (!parseBirthDateParts(f.student.birthDate)) {
    errors.birthDate = "생년월일 형식을 확인해 주세요.";
  } else if (isFutureBirthDate(f.student.birthDate)) {
    errors.birthDate = "생년월일은 오늘 이전이어야 합니다.";
  }
  if (!f.student.nickname.trim()) {
    errors.nickname = "닉네임을 입력해 주세요.";
  }
  if (!f.termsAgree || !f.privacyAgree) {
    errors.terms = "필수 약관(이용·개인정보)에 모두 동의해 주세요.";
  }
  return errors;
}

export function mentorSignupFieldErrors(f: MentorSignupFields): SignupFieldErrors {
  const errors: SignupFieldErrors = {};
  if (!f.email.trim()) {
    errors.email = "이메일을 입력해 주세요.";
  } else if (!emailOk(f.email)) {
    errors.email = "이메일 형식을 확인해 주세요.";
  }
  if (f.password.length < 6) {
    errors.password = "비밀번호는 6자 이상이어야 합니다.";
  }
  if (f.password !== f.passwordConfirm) {
    errors.passwordConfirm = "비밀번호가 서로 일치하지 않습니다.";
  }
  const m = f.mentor;
  if (!m.nickname.trim()) {
    errors.nickname = "닉네임을 입력해 주세요.";
  }
  if (!m.universityName.trim()) {
    errors.universityName = "대학교를 입력해 주세요.";
  }
  if (!m.departmentName.trim()) {
    errors.departmentName = "학과를 입력해 주세요.";
  }
  if (!m.teachingSubjectsCsv.trim()) {
    errors.teachingSubjectsCsv = "전공 과목을 한 개 이상 입력해 주세요.";
  }
  if (!m.highSchoolName.trim()) {
    errors.highSchoolName = "출신 고등학교를 입력해 주세요.";
  }
  if (!m.studentIdFile) {
    errors.studentIdFile = "학생증 또는 재학증명서 파일을 선택해 주세요.";
  }
  if (!f.termsAgree || !f.privacyAgree) {
    errors.terms = "필수 약관(이용·개인정보)에 모두 동의해 주세요.";
  }
  return errors;
}

function firstError(errors: SignupFieldErrors): string | null {
  const values = Object.values(errors);
  return values[0] ?? null;
}

/** 학생 가입: 계정 + 프로필 + 필수 약관 */
export function validateStudentSignup(f: StudentSignupFields): string | null {
  return firstError(studentSignupFieldErrors(f));
}

/** 멘토 가입: 계정 + 인증/프로필 + 필수 약관 */
export function validateMentorSignup(f: MentorSignupFields): string | null {
  return firstError(mentorSignupFieldErrors(f));
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

export function signupFieldErrorsByRole(
  role: Extract<AppRole, "student" | "mentor">,
  student: StudentSignupFields,
  mentor: MentorSignupFields
): SignupFieldErrors {
  if (role === "student") {
    return studentSignupFieldErrors(student);
  }
  return mentorSignupFieldErrors(mentor);
}
