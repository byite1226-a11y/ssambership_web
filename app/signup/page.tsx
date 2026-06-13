"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { SignupStepBar } from "@/components/auth/SignupStepBar";
import { StudentSignupForm, type StudentSignupFormValues } from "@/components/auth/StudentSignupForm";
import { MentorSignupForm, type MentorSignupFormValues } from "@/components/auth/MentorSignupForm";
import { SignupTrustBlock } from "@/components/auth/SignupTrustBlock";
import { buildSignupUserMetadata } from "@/lib/auth/buildSignupUserMetadata";
import { syncAfterSignUpWithSession } from "@/lib/auth/syncAfterSignUpSession";
import { safeInternalNextPath } from "@/lib/auth/getPostLoginPath";
import { signupFieldErrorsByRole, type SignupFieldErrors } from "@/lib/auth/signupValidation";
import { mapSupabaseAuthError } from "@/lib/utils/mapSupabaseAuthError";
import type { AppRole } from "@/lib/types/user";

type SignupRole = Extract<AppRole, "student" | "mentor">;

const emptyStudent: StudentSignupFormValues = {
  fullName: "",
  nickname: "",
  gradeLevel: "",
  studentStatus: "",
  birthDate: "",
};

const emptyMentor: MentorSignupFormValues = {
  nickname: "",
  universityName: "",
  departmentName: "",
  teachingSubjectsCsv: "",
  highSchoolName: "",
  introLine: "",
  studentIdFile: null,
};

const inputClassStudent =
  "mt-2.5 w-full min-h-[3.4rem] rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none transition " +
  "placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200/55 " +
  "sm:min-h-[3.55rem] sm:rounded-3xl sm:px-5 sm:py-4 sm:text-lg md:text-[1.05rem]";
const inputClassMentor =
  "mt-2.5 w-full min-h-[3.4rem] rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none transition " +
  "placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/55 " +
  "sm:min-h-[3.55rem] sm:rounded-3xl sm:px-5 sm:py-4 sm:text-lg md:text-[1.05rem]";
const labelClass =
  "mb-0 block break-keep text-sm font-bold text-slate-800 sm:text-[0.95rem] md:text-base";
const subhelper = "mt-1.5 text-sm text-slate-500 sm:mt-2 sm:text-base";
const profileStudent =
  "relative overflow-hidden rounded-[1.75rem] border-2 border-sky-200/50 bg-gradient-to-b from-sky-50/70 via-white to-white " +
  "p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-8px_rgba(14,165,233,0.14),0_2px_0_0_rgba(255,255,255,0.9)_inset] " +
  "sm:rounded-[2rem] sm:p-8 md:p-10 md:px-10 md:py-9 xl:px-11 " +
  "before:pointer-events-none before:absolute before:left-0 before:top-0 before:h-1.5 before:w-full before:bg-gradient-to-r " +
  "before:from-sky-500/50 before:via-sky-400/40 before:to-sky-300/20";
const profileMentor =
  "relative overflow-hidden rounded-[1.75rem] border-2 border-emerald-200/55 bg-gradient-to-b from-emerald-50/50 via-white to-sky-50/20 " +
  "p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-8px_rgba(5,150,105,0.12),0_2px_0_0_rgba(255,255,255,0.85)_inset] " +
  "sm:rounded-[2rem] sm:p-8 md:p-10 md:px-10 md:py-9 xl:px-11 " +
  "before:pointer-events-none before:absolute before:left-0 before:top-0 before:h-1.5 before:w-full before:bg-gradient-to-r " +
  "before:from-emerald-600/45 before:via-emerald-500/30 before:to-emerald-300/15";
const accountSection = "rounded-2xl border border-slate-200/50 bg-sky-50/15 px-4 py-4 sm:rounded-3xl sm:px-5 sm:py-5";
const accountSectionMentor = "rounded-2xl border border-slate-200/50 bg-emerald-50/20 px-4 py-4 sm:rounded-3xl sm:px-5 sm:py-5";

const fieldErrorClass = "mt-1.5 text-sm text-red-600";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p className={fieldErrorClass} role="alert">
      {message}
    </p>
  );
}

function stepDescription(s: 1 | 2 | 3) {
  switch (s) {
    case 1:
      return "학생과 멘토는 역할에 맞는 혜택이 달라요. 먼저 가입 유형을 골라 주세요.";
    case 2:
      return "이메일·비밀번호를 정하고, 프로필과 약관 동의를 완료하면 가입이 끝나요.";
    case 3:
      return "이제 쌤버십의 여정이 시작돼요.";
    default:
      return "";
  }
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<SignupRole | null>(null);
  const [completedRole, setCompletedRole] = useState<SignupRole | null>(null);

  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentPasswordConfirm, setStudentPasswordConfirm] = useState("");

  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorPassword, setMentorPassword] = useState("");
  const [mentorPasswordConfirm, setMentorPasswordConfirm] = useState("");

  const [student, setStudent] = useState<StudentSignupFormValues>(emptyStudent);
  const [mentor, setMentor] = useState<MentorSignupFormValues>(emptyMentor);

  const [termsAgree, setTermsAgree] = useState(false);
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [marketingAgree, setMarketingAgree] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [loading, setLoading] = useState(false);

  const termsUrl = process.env.NEXT_PUBLIC_LEGAL_TERMS_URL;
  const privacyUrl = process.env.NEXT_PUBLIC_LEGAL_PRIVACY_URL;
  const formSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (step !== 2 || !role) {
      return;
    }
    const target = formSectionRef.current;
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.focus({ preventScroll: true });
  }, [role, step]);

  function goNext() {
    setError(null);
    setFieldErrors({});
    if (step === 1) {
      if (!role) {
        setError("학생 또는 멘토를 선택해 주세요.");
        return;
      }
      setStep(2);
    }
  }

  function goBackToRoleSelect() {
    setError(null);
    setFieldErrors({});
    setStep(1);
  }

  async function handleSignUp(forcedRole?: SignupRole) {
    if (loading) {
      return;
    }
    setError(null);
    setFieldErrors({});

    const currentRole = forcedRole ?? role;
    if (!currentRole) {
      setError("학생 또는 멘토를 선택해 주세요.");
      return;
    }
    const studentPayload = {
      email: studentEmail,
      password: studentPassword,
      passwordConfirm: studentPasswordConfirm,
      student,
      termsAgree,
      privacyAgree,
    };
    const mentorPayload = {
      email: mentorEmail,
      password: mentorPassword,
      passwordConfirm: mentorPasswordConfirm,
      mentor,
      termsAgree,
      privacyAgree,
    };
    const nextFieldErrors = signupFieldErrorsByRole(currentRole, studentPayload, mentorPayload);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(Object.values(nextFieldErrors)[0] ?? "입력 내용을 확인해 주세요.");
      return;
    }

    const email = currentRole === "student" ? studentEmail : mentorEmail;
    const password = currentRole === "student" ? studentPassword : mentorPassword;
    const nextRaw = searchParams.get("next");

    const displayName = currentRole === "student" ? student.nickname : mentor.nickname;

    setLoading(true);
    const supabase = createClient();
    const meta = buildSignupUserMetadata({
      role: currentRole,
      fullName: displayName.trim(),
      nickname: displayName.trim(),
      gradeLevel: currentRole === "student" ? student.gradeLevel : "",
      studentStatus: currentRole === "student" ? student.studentStatus : "",
      birthDate: currentRole === "student" ? student.birthDate : "",
      termsAgree,
      privacyAgree,
      marketingAgree,
      universityName: currentRole === "mentor" ? mentor.universityName : "",
      departmentName: currentRole === "mentor" ? mentor.departmentName : "",
      teachingSubjectsCsv: currentRole === "mentor" ? mentor.teachingSubjectsCsv : "",
      highSchoolName: currentRole === "mentor" ? mentor.highSchoolName : "",
      introLine: currentRole === "mentor" ? mentor.introLine : "",
    });

    let newUser: { id: string } | null = null;
    let newSession: boolean = false;
    let signUpErrorMessage: string | null = null;

    try {
      const { data, error: sErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: { data: meta, emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
      });
      if (sErr) {
        signUpErrorMessage = mapSupabaseAuthError(sErr.message);
        setLoading(false);
        setError(signUpErrorMessage);
        return;
      }
      if (!data.user) {
        setError("가입에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        setLoading(false);
        return;
      }
      newUser = { id: data.user.id };
      newSession = !!data.session;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(mapSupabaseAuthError(msg));
      setLoading(false);
      return;
    }

    if (newUser && newSession) {
      const w =
        currentRole === "student"
          ? await syncAfterSignUpWithSession({
              userId: newUser.id,
              email: email.trim(),
              role: "student",
              fullName: displayName,
              nickname: displayName,
              gradeLevel: student.gradeLevel,
              studentStatus: student.studentStatus,
              birthDate: student.birthDate,
              termsAgree,
              privacyAgree,
              marketingAgree,
              universityName: "",
              departmentName: "",
              teachingSubjectsCsv: "",
              highSchoolName: "",
              introLine: "",
              studentIdFile: null,
            })
          : await syncAfterSignUpWithSession({
              userId: newUser.id,
              email: email.trim(),
              role: "mentor",
              fullName: displayName,
              nickname: displayName,
              gradeLevel: "",
              studentStatus: "",
              birthDate: "",
              termsAgree,
              privacyAgree,
              marketingAgree,
              universityName: mentor.universityName,
              departmentName: mentor.departmentName,
              teachingSubjectsCsv: mentor.teachingSubjectsCsv,
              highSchoolName: mentor.highSchoolName,
              introLine: mentor.introLine,
              studentIdFile: mentor.studentIdFile,
            });
      const criticalSync = w.warningMessages.filter(
        (m) => m.includes("[프로필 저장]") || m.includes("[멘토 프로필]")
      );
      if (criticalSync.length > 0) {
        setError(criticalSync.join(" "));
        setLoading(false);
        return;
      }
      if (w.warningMessages.length > 0) {
        console.warn("[signup] post-signup sync warnings (비차단):", w.warningMessages);
      }
      setLoading(false);
      setCompletedRole(currentRole);
      setStep(3);
      return;
    }

    if (newUser) {
      const q = new URLSearchParams();
      q.set("message", "signup-check-email");
      const safeNext = safeInternalNextPath(nextRaw);
      if (safeNext) {
        q.set("next", safeNext);
      }
      const loginPath = currentRole === "mentor" ? "/login/mentor" : "/login/student";
      setLoading(false);
      router.replace(`${loginPath}?${q.toString()}`);
      router.refresh();
      return;
    }

    setLoading(false);
  }

  return (
    <AuthPageLayout
      title="회원가입"
      titleClassName="!text-[#0b2b6c] text-[1.6rem] sm:text-3xl sm:!text-4xl md:text-[2.4rem] md:!text-[#0b2b6c] xl:text-[2.5rem] tracking-tight"
      description={stepDescription(step)}
      signupLayout
      headerPrefix={
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 transition hover:text-slate-900 sm:text-base"
        >
          <span aria-hidden>←</span> 이전으로
        </Link>
      }
    >
      <div className="mb-6 w-full sm:mb-8">
        <SignupStepBar current={step} />
      </div>

      <>
        {error ? (
          <p
            className="mb-6 rounded-2xl border-2 border-red-200/90 bg-red-50 px-4 py-3.5 text-base text-red-900 shadow-sm"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {step === 3 && completedRole ? (
          <div
            className="mx-auto w-full max-w-lg rounded-3xl border-2 border-blue-200/80 bg-white p-8 text-center shadow-[0_8px_40px_-12px_rgba(37,99,235,0.2)] sm:p-10"
            role="status"
          >
            <p className="break-keep text-2xl font-extrabold text-[#0b2b6c] sm:text-3xl">가입을 환영합니다!</p>
            {completedRole === "student" ? (
              <>
                <p className="mt-3 break-keep text-base leading-relaxed text-slate-600 sm:mt-4 sm:text-lg">
                  이제 멘토를 찾아 질문·학습을 시작해 보세요.
                </p>
                <Link
                  href="/mentors"
                  className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-8 text-base font-extrabold text-white shadow-sm transition hover:bg-blue-700 sm:min-h-[3.25rem] sm:px-10 sm:text-lg"
                >
                  멘토 찾기
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 break-keep text-base leading-relaxed text-slate-600 sm:mt-4 sm:text-lg">
                  관리자 승인 전까지 멘토 활동은 대기 상태입니다. 프로필을 먼저 작성해 주세요.
                </p>
                <Link
                  href="/mentor/profile"
                  className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-700 px-8 text-base font-extrabold text-white shadow-sm transition hover:bg-emerald-800 sm:min-h-[3.25rem] sm:px-10 sm:text-lg"
                >
                  프로필 관리
                </Link>
              </>
            )}
          </div>
        ) : null}

        {step === 1 ? (
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
                어떤 계정으로 가입하시나요?
              </h2>
              <p className="mt-3 max-w-4xl text-base leading-relaxed text-slate-500 sm:mt-4 sm:text-lg md:text-xl">
                역할에 따라 혜택·입력 항목·이후 흐름(인증, 심사)이 달라요. 한 가지를 골라 주세요.
              </p>
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:mt-8 sm:p-6">
                <RoleSelector value={role} onChange={setRole} disabled={loading} />
              </div>
            </div>
        ) : null}

        {step === 2 ? (
            <div className="space-y-8 sm:space-y-10 md:space-y-12">
              {role ? (
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="min-w-0 rounded-2xl border border-slate-200/60 bg-white px-4 py-3.5 shadow-sm sm:rounded-3xl sm:px-6 sm:py-4">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">선택한 가입 유형</p>
                    <p className="mt-1 break-keep text-xl font-extrabold text-[#0b2b6c] sm:text-2xl">
                      {role === "student" ? "학생" : "멘토"}
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                    <p className="w-full min-w-0 break-keep text-sm text-slate-500 sm:w-auto sm:text-right">
                      다른 유형이면 1단계로 돌아가 주세요.
                    </p>
                    <button
                      type="button"
                      onClick={goBackToRoleSelect}
                      disabled={loading}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-slate-200/90 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50/50 disabled:opacity-50 sm:min-h-12 sm:px-6 sm:text-base"
                    >
                      ← 역할 다시 선택
                    </button>
                  </div>
                </div>
              ) : null}

              {!role ? (
                <div
                  className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 text-amber-950 sm:rounded-3xl sm:px-5 sm:py-5"
                  role="status"
                >
                  <p className="font-bold">1단계에서 가입 유형이 선택되지 않았어요.</p>
                  <button
                    type="button"
                    onClick={goBackToRoleSelect}
                    className="mt-3 min-h-11 w-full rounded-2xl bg-blue-600 py-2.5 text-sm font-extrabold text-white sm:text-base"
                  >
                    역할 선택으로
                  </button>
                </div>
              ) : null}

              {role === "student" ? (
                <section
                  ref={formSectionRef}
                  key="signup-student"
                  tabIndex={-1}
                  className={`${profileStudent} z-[1] ring-2 ring-sky-500/50 ring-offset-2 ring-offset-slate-100/50 outline-none mx-auto w-full max-w-2xl`}
                  aria-label="학생 회원가입 폼"
                >
                  <header className="border-b border-sky-200/35 pb-5 sm:pb-6">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-800/90 sm:text-xs md:text-sm">
                      Student signup
                    </p>
                    <h2 className="mt-1.5 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl md:text-[2.1rem]">
                      학생 회원가입
                    </h2>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600 sm:mt-3 sm:text-base md:text-[1.05rem]">
                      이메일·비밀번호와 프로필을 같이 완성하면 쌤버십에 바로 들어갈 수 있어요.
                    </p>
                  </header>

                  <div className="mt-6 space-y-1 sm:mt-7">
                    <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">로그인에 쓰는 계정</h3>
                    <p className="text-sm text-slate-500 sm:text-base">이메일과 비밀번호는 이후에도 그대로 사용돼요.</p>
                    <div className={`${accountSection} mt-3 space-y-4 sm:mt-4`}>
                    <div>
                      <label htmlFor="sg-email-student" className={labelClass}>
                        이메일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="sg-email-student"
                        name="email_student"
                        type="email"
                        className={inputClassStudent}
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        autoComplete="email"
                        aria-invalid={!!fieldErrors.email}
                      />
                      <FieldError message={fieldErrors.email} />
                    </div>
                    <div>
                      <label htmlFor="sg-pw-student" className={labelClass}>
                        비밀번호 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="sg-pw-student"
                        name="password_student"
                        type="password"
                        className={inputClassStudent}
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        autoComplete="new-password"
                        aria-invalid={!!fieldErrors.password}
                      />
                      <FieldError message={fieldErrors.password} />
                    </div>
                    <div>
                      <label htmlFor="sg-pw2-student" className={labelClass}>
                        비밀번호 확인 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="sg-pw2-student"
                        name="password2_student"
                        type="password"
                        className={inputClassStudent}
                        value={studentPasswordConfirm}
                        onChange={(e) => setStudentPasswordConfirm(e.target.value)}
                        autoComplete="new-password"
                        aria-invalid={!!fieldErrors.passwordConfirm}
                      />
                      {fieldErrors.passwordConfirm ? (
                        <FieldError message={fieldErrors.passwordConfirm} />
                      ) : (
                        <p className={subhelper}>6자 이상, 영문/숫자/특수문자 조합을 권장해요.</p>
                      )}
                    </div>
                    </div>
                  </div>

                  <div className="mt-7 border-t border-sky-200/30 pt-6 sm:mt-8 sm:pt-7">
                    <StudentSignupForm
                      value={student}
                      onChange={setStudent}
                      disabled={loading}
                      fieldErrors={{
                        nickname: fieldErrors.nickname,
                        gradeLevel: fieldErrors.gradeLevel,
                      }}
                    />
                  </div>

                  <div className="mt-7 sm:mt-8">
                    {termsBlock(
                      "sky",
                      termsAgree,
                      privacyAgree,
                      marketingAgree,
                      setTermsAgree,
                      setPrivacyAgree,
                      setMarketingAgree,
                      loading,
                      termsUrl,
                      privacyUrl
                    )}
                    <FieldError message={fieldErrors.terms} />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRole("student");
                      void handleSignUp("student");
                    }}
                    disabled={loading}
                    className="mt-7 w-full min-h-[3.65rem] rounded-2xl bg-sky-600 px-8 py-3.5 text-base font-extrabold text-white shadow-[0_4px_14px_-2px_rgba(2,132,199,0.4)] transition hover:bg-sky-700 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-8 sm:min-h-[3.85rem] sm:rounded-3xl sm:py-4 sm:text-lg"
                  >
                    {loading ? "처리 중…" : "학생으로 가입하기"}
                  </button>
                </section>
              ) : null}

              {role === "mentor" ? (
                <section
                  ref={formSectionRef}
                  key="signup-mentor"
                  tabIndex={-1}
                  className={`${profileMentor} z-[1] ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-slate-100/50 outline-none mx-auto w-full max-w-2xl`}
                  aria-label="멘토 회원가입 폼"
                >
                  <header className="border-b border-emerald-200/40 pb-5 sm:pb-6">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-emerald-900/90 sm:text-xs md:text-sm">
                      Mentor signup
                    </p>
                    <h2 className="mt-1.5 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl md:text-[2.1rem]">
                      멘토 회원가입
                    </h2>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600 sm:mt-3 sm:text-base md:text-[1.05rem]">
                      대학·전공·서류를 입력하면 인증·활동 준비까지 수월해요.
                    </p>
                  </header>

                  <div className="mt-6 space-y-1 sm:mt-7">
                    <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">로그인에 쓰는 계정</h3>
                    <p className="text-sm text-slate-500 sm:text-base">이메일과 비밀번호는 이후에도 그대로 사용돼요.</p>
                    <div className={`${accountSectionMentor} mt-3 space-y-4 sm:mt-4`}>
                    <div>
                      <label htmlFor="sg-email-mentor" className={labelClass}>
                        이메일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="sg-email-mentor"
                        name="email_mentor"
                        type="email"
                        className={inputClassMentor}
                        value={mentorEmail}
                        onChange={(e) => setMentorEmail(e.target.value)}
                        autoComplete="email"
                        aria-invalid={!!fieldErrors.email}
                      />
                      <FieldError message={fieldErrors.email} />
                    </div>
                    <div>
                      <label htmlFor="sg-pw-mentor" className={labelClass}>
                        비밀번호 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="sg-pw-mentor"
                        name="password_mentor"
                        type="password"
                        className={inputClassMentor}
                        value={mentorPassword}
                        onChange={(e) => setMentorPassword(e.target.value)}
                        autoComplete="new-password"
                        aria-invalid={!!fieldErrors.password}
                      />
                      <FieldError message={fieldErrors.password} />
                    </div>
                    <div>
                      <label htmlFor="sg-pw2-mentor" className={labelClass}>
                        비밀번호 확인 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="sg-pw2-mentor"
                        name="password2_mentor"
                        type="password"
                        className={inputClassMentor}
                        value={mentorPasswordConfirm}
                        onChange={(e) => setMentorPasswordConfirm(e.target.value)}
                        autoComplete="new-password"
                        aria-invalid={!!fieldErrors.passwordConfirm}
                      />
                      {fieldErrors.passwordConfirm ? (
                        <FieldError message={fieldErrors.passwordConfirm} />
                      ) : (
                        <p className={subhelper}>6자 이상, 영문/숫자/특수문자 조합을 권장해요.</p>
                      )}
                    </div>
                    </div>
                  </div>

                  <div className="mt-7 border-t border-emerald-200/30 pt-6 sm:mt-8 sm:pt-7">
                    <MentorSignupForm
                      value={mentor}
                      onChange={setMentor}
                      disabled={loading}
                      fieldErrors={{
                        nickname: fieldErrors.nickname,
                        universityName: fieldErrors.universityName,
                        departmentName: fieldErrors.departmentName,
                        teachingSubjectsCsv: fieldErrors.teachingSubjectsCsv,
                        highSchoolName: fieldErrors.highSchoolName,
                        studentIdFile: fieldErrors.studentIdFile,
                      }}
                    />
                  </div>

                  <div className="mt-7 sm:mt-8">
                    {termsBlock(
                      "emerald",
                      termsAgree,
                      privacyAgree,
                      marketingAgree,
                      setTermsAgree,
                      setPrivacyAgree,
                      setMarketingAgree,
                      loading,
                      termsUrl,
                      privacyUrl
                    )}
                    <FieldError message={fieldErrors.terms} />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRole("mentor");
                      void handleSignUp("mentor");
                    }}
                    disabled={loading}
                    className="mt-7 w-full min-h-[3.65rem] rounded-2xl bg-emerald-700 px-8 py-3.5 text-base font-extrabold text-white shadow-[0_4px_16px_-2px_rgba(4,120,87,0.4)] transition hover:bg-emerald-800 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-8 sm:min-h-[3.9rem] sm:rounded-3xl sm:py-4 sm:text-lg"
                  >
                    {loading ? "처리 중…" : "멘토로 가입하기"}
                  </button>
                </section>
              ) : null}
            </div>
        ) : null}

          {step === 1 ? (
            <div className="mt-8 flex flex-wrap items-center justify-end gap-3 sm:mt-10">
              <button
                type="button"
                onClick={goNext}
                disabled={loading || !role}
                className="min-h-[3.6rem] min-w-[11.5rem] rounded-2xl bg-[#2563eb] px-11 py-4 text-lg font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:min-w-[12.5rem]"
              >
                다음 — 정보 입력
              </button>
            </div>
          ) : null}

        {step !== 3 ? <SignupTrustBlock /> : null}
        </>

      {step !== 3 ? (
      <p className="mt-8 text-center text-sm text-slate-600 sm:mt-10 sm:text-base">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-bold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-800">
          로그인
        </Link>
      </p>
      ) : null}
    </AuthPageLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[40vh] max-w-lg items-center justify-center p-8 text-slate-600">
          불러오는 중…
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}

function termsBlock(
  tone: "sky" | "emerald",
  termsAgree: boolean,
  privacyAgree: boolean,
  marketingAgree: boolean,
  setTerms: (b: boolean) => void,
  setPrivacy: (b: boolean) => void,
  setMarketing: (b: boolean) => void,
  loading: boolean,
  termsUrl: string | undefined,
  privacyUrl: string | undefined
) {
  const setBoth = (b: boolean) => {
    setTerms(b);
    setPrivacy(b);
  };
  const allRequired = termsAgree && privacyAgree;
  const isSky = tone === "sky";
  const skin = isSky
    ? "border-sky-200/55 bg-sky-50/40 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_28px_-4px_rgba(14,165,233,0.08)]"
    : "border-emerald-200/55 bg-emerald-50/30 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_28px_-4px_rgba(5,150,105,0.1)]";
  const sub = isSky ? "text-sky-800/90" : "text-emerald-900/85";
  const headerBorder = isSky ? "border-sky-200/50" : "border-emerald-200/50";
  const kicker = isSky ? "text-sky-700" : "text-emerald-800";
  const link = isSky ? "text-sky-700 hover:text-sky-900" : "text-emerald-800 hover:text-emerald-950";
  const chk = isSky
    ? "text-sky-600 focus:ring-sky-500"
    : "text-emerald-600 focus:ring-emerald-500";

  return (
    <section
      className={`rounded-2xl border p-4 sm:rounded-3xl sm:p-5 md:px-6 md:py-5 ${skin}`}
      aria-label="약관 동의"
    >
      <header className={`border-b ${headerBorder} pb-4 sm:pb-4`}>
        <p className={`text-xs font-extrabold tracking-wide sm:text-sm ${kicker}`}>03 · 약관</p>
        <h2 className="mt-1.5 text-xl font-extrabold text-slate-900 sm:text-2xl md:text-[1.6rem]">필수·선택 동의</h2>
        <p className={`mt-1.5 text-sm leading-relaxed sm:mt-2 sm:text-base ${isSky ? "text-slate-600" : "text-slate-700"}`}>
          필수에 동의해야 가입이 완료돼요. 약관·개인정보 링크는 `NEXT_PUBLIC_*` 환경 변수로 붙일 수 있어요.
        </p>
        <p className={`mt-0.5 text-xs sm:text-sm ${sub}`}>
          {isSky ? "학생 가입 흐름" : "멘토 가입 흐름"}에 맞는 색 톤으로 정리했어요.
        </p>
      </header>
      <div className="mt-4 space-y-3.5 text-slate-800 sm:mt-5 sm:space-y-4 sm:text-base">
        <label className="flex items-start gap-3 sm:gap-3.5">
          <input
            type="checkbox"
            className={`mt-1.5 h-5 w-5 shrink-0 rounded border-slate-300 ${chk}`}
            checked={allRequired}
            onChange={(e) => setBoth(e.target.checked)}
            disabled={loading}
          />
          <span>
            <span className="font-bold text-slate-900">필수</span> — 서비스 이용약관 및 개인정보 수집·이용에 동의합니다.{" "}
            {termsUrl || privacyUrl ? (
              <span className="text-slate-600">
                {termsUrl ? (
                  <a
                    className={`font-medium underline underline-offset-2 ${link}`}
                    href={termsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    이용약관
                  </a>
                ) : null}
                {termsUrl && privacyUrl ? " · " : null}
                {privacyUrl ? (
                  <a
                    className={`font-medium underline underline-offset-2 ${link}`}
                    href={privacyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    개인정보처리방침
                  </a>
                ) : null}
              </span>
            ) : null}
          </span>
        </label>
        <label className="flex items-start gap-3 text-slate-700 sm:gap-3.5">
          <input
            type="checkbox"
            className={`mt-1.5 h-5 w-5 shrink-0 rounded border-slate-300 ${chk}`}
            checked={marketingAgree}
            onChange={(e) => setMarketing(e.target.checked)}
            disabled={loading}
          />
          <span>
            <span className="font-bold text-slate-900">선택</span> — 이벤트·혜택 알림 수신에 동의합니다.
          </span>
        </label>
        {!termsUrl && !privacyUrl && (
          <p className="text-sm text-slate-500">문서 URL은 `NEXT_PUBLIC_LEGAL_TERMS_URL` · `NEXT_PUBLIC_LEGAL_PRIVACY_URL`로 연결할 수 있어요.</p>
        )}
        <p className="text-xs leading-relaxed text-slate-600">
          만 14세 미만은 보호자 동의 절차가 필요할 수 있어요.{" "}
          <Link href="/legal/minor-consent" className={`font-bold underline underline-offset-2 ${link}`}>
            보호자 동의 안내(초안)
          </Link>
        </p>
      </div>
    </section>
  );
}
