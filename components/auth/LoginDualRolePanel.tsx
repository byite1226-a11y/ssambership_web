"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, GraduationCap } from "lucide-react";
import { RoleLoginForm } from "@/components/auth/RoleLoginForm";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { loginLandingCopy, type AuthLoginRole } from "@/components/auth/loginRoleContent";

const STUDENT_PRIMARY = "#1A56DB";
const MENTOR_PRIMARY = "#16A34A";

function benefitLines(role: AuthLoginRole): string[] {
  const items = loginLandingCopy[role].benefits;
  return items.map((b) => `${b.line1} ${b.line2}`.trim());
}

function LoginRoleCard(props: {
  role: AuthLoginRole;
  initialNext: string | null;
  active: boolean;
  onActivate: () => void;
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}) {
  const { role, initialNext, active, onActivate } = props;
  const copy = loginLandingCopy[role];
  const isStudent = role === "student";
  const emailId = isStudent ? "login-email-student" : "login-email-mentor";
  const passwordId = isStudent ? "login-pw-student" : "login-pw-mentor";
  const signupLabel = isStudent ? "학생 회원가입" : "멘토 회원가입";

  return (
    <article
      className={[
        "flex h-full min-h-[520px] flex-col rounded-2xl border-2 bg-white p-6 shadow-sm transition sm:p-7",
        isStudent
          ? active
            ? "border-[#1A56DB] shadow-[0_8px_32px_-12px_rgba(26,86,219,0.35)] ring-2 ring-[#1A56DB]/15"
            : "border-blue-100 hover:border-blue-300"
          : active
            ? "border-[#16A34A] shadow-[0_8px_32px_-12px_rgba(22,163,74,0.3)] ring-2 ring-[#16A34A]/15"
            : "border-emerald-100 hover:border-emerald-300",
      ].join(" ")}
      onFocusCapture={onActivate}
      onMouseEnter={onActivate}
    >
      <header className="text-center sm:text-left">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl sm:mx-0"
          style={{ backgroundColor: isStudent ? `${STUDENT_PRIMARY}14` : `${MENTOR_PRIMARY}14` }}
        >
          {isStudent ? (
            <BookOpen className="h-6 w-6" style={{ color: STUDENT_PRIMARY }} aria-hidden />
          ) : (
            <GraduationCap className="h-6 w-6" style={{ color: MENTOR_PRIMARY }} aria-hidden />
          )}
        </div>
        <h2 className="mt-3 text-xl font-black text-slate-900 sm:text-2xl">{copy.title}</h2>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-600">{copy.line1}</p>
      </header>

      <ul className="mt-5 space-y-2 border-y border-slate-100 py-4">
        {benefitLines(role).map((line) => (
          <li key={line} className="flex items-start gap-2 text-sm text-slate-700">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: isStudent ? STUDENT_PRIMARY : MENTOR_PRIMARY }}
              aria-hidden
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-1 flex-col pt-4">
        <Suspense fallback={<p className="text-center text-sm text-slate-500">로그인 폼 불러오는 중…</p>}>
          <RoleLoginForm
            role={role}
            emailId={emailId}
            passwordId={passwordId}
            submitLabel="로그인"
            initialNext={initialNext}
            hideRolePickerLink
            email={props.email}
            password={props.password}
            onEmailChange={props.onEmailChange}
            onPasswordChange={props.onPasswordChange}
          />
        </Suspense>

        <div className="mt-4">
          <SocialAuthButtons tone={role} disabled size="landing" />
        </div>

        <p className="mt-5 text-center text-sm text-slate-600">
          계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="font-extrabold underline underline-offset-2"
            style={{ color: isStudent ? STUDENT_PRIMARY : MENTOR_PRIMARY }}
          >
            {signupLabel}
          </Link>
        </p>
      </div>
    </article>
  );
}

export function LoginDualRolePanel(props: { initialNext: string | null }) {
  const [activeRole, setActiveRole] = useState<AuthLoginRole>("student");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorPassword, setMentorPassword] = useState("");

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
      <LoginRoleCard
        role="student"
        initialNext={props.initialNext}
        active={activeRole === "student"}
        onActivate={() => setActiveRole("student")}
        email={studentEmail}
        password={studentPassword}
        onEmailChange={setStudentEmail}
        onPasswordChange={setStudentPassword}
      />
      <LoginRoleCard
        role="mentor"
        initialNext={props.initialNext}
        active={activeRole === "mentor"}
        onActivate={() => setActiveRole("mentor")}
        email={mentorEmail}
        password={mentorPassword}
        onEmailChange={setMentorEmail}
        onPasswordChange={setMentorPassword}
      />
    </div>
  );
}
