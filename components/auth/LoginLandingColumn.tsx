import type { ReactNode } from "react";
import Link from "next/link";
import {
  MentorBenefitIcon1,
  MentorBenefitIcon2,
  MentorBenefitIcon3,
  StudentBenefitIcon1,
  StudentBenefitIcon2,
  StudentBenefitIcon3,
} from "./icons/AuthBenefitIcons";
import { LoginStudentHeroIllustration } from "./illustrations/LoginStudentHeroIllustration";
import { LoginMentorHeroIllustration } from "./illustrations/LoginMentorHeroIllustration";
import { loginLandingCopy, type AuthLoginRole } from "./loginRoleContent";

const cardShell: Record<AuthLoginRole, string> = {
  student:
    "flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-sky-200/90 " +
    "bg-gradient-to-b from-sky-100/60 via-sky-50/50 to-white " +
    "shadow-[0_2px_4px_rgba(0,0,0,0.04),0_28px_64px_-28px_rgba(26,86,219,0.25),inset_0_1px_0_rgba(255,255,255,0.95)] " +
    "sm:rounded-[2rem] lg:rounded-[2.15rem]",
  mentor:
    "flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-emerald-200/90 " +
    "bg-gradient-to-b from-emerald-100/55 via-emerald-50/50 to-white " +
    "shadow-[0_2px_4px_rgba(0,0,0,0.04),0_28px_64px_-28px_rgba(4,120,87,0.2),inset_0_1px_0_rgba(255,255,255,0.92)] " +
    "sm:rounded-[2rem] lg:rounded-[2.15rem]",
};

const badgeClass: Record<AuthLoginRole, string> = {
  student:
    "inline-flex w-fit max-w-full rounded-full bg-sky-200/95 px-3.5 py-1.5 text-xs font-extrabold text-sky-950 sm:px-4 sm:py-2 sm:text-sm",
  mentor:
    "inline-flex w-fit max-w-full rounded-full bg-emerald-200/90 px-3.5 py-1.5 text-xs font-extrabold text-emerald-950 sm:px-4 sm:py-2 sm:text-sm",
};

const cta: Record<AuthLoginRole, string> = {
  student:
    "inline-flex w-full min-h-[3.5rem] items-center justify-center rounded-2xl bg-blue-600 text-base font-extrabold text-white shadow-[0_8px_28px_-4px_rgba(26,86,219,0.55)] transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:min-h-[3.75rem] sm:rounded-3xl sm:text-lg",
  mentor:
    "inline-flex w-full min-h-[3.5rem] items-center justify-center rounded-2xl bg-emerald-700 text-base font-extrabold text-white shadow-[0_8px_28px_-4px_rgba(4,120,87,0.5)] transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:min-h-[3.75rem] sm:rounded-3xl sm:text-lg",
};

const benefitStripShell: Record<AuthLoginRole, string> = {
  student: "rounded-2xl border border-sky-200/50 bg-sky-50/60 p-4 sm:rounded-3xl sm:p-5 md:p-6",
  mentor: "rounded-2xl border border-emerald-200/50 bg-emerald-50/55 p-4 sm:rounded-3xl sm:p-5 md:p-6",
};

const benefitCell: Record<AuthLoginRole, string> = {
  student:
    "flex min-h-0 flex-col items-center justify-center gap-3 rounded-2xl border border-white/90 bg-white/90 px-4 py-5 text-center sm:min-h-32 sm:rounded-3xl sm:px-3.5 sm:py-5 md:min-h-36",
  mentor:
    "flex min-h-0 flex-col items-center justify-center gap-3 rounded-2xl border border-white/90 bg-white/90 px-4 py-5 text-center sm:min-h-32 sm:rounded-3xl sm:px-3.5 sm:py-5 md:min-h-36",
};

const illustPanel: Record<AuthLoginRole, string> = {
  student: "bg-gradient-to-br from-sky-200/50 via-sky-100/40 to-white/90",
  mentor: "bg-gradient-to-br from-emerald-200/50 via-emerald-100/40 to-white/90",
};

const studentIllustClass =
  "h-[125%] w-full max-w-none min-w-0 object-contain object-bottom-right " +
  "origin-bottom-right [transform:translate(2%,6%)_scale(1.14)] " +
  "sm:[transform:translate(0%,4%)_scale(1.22)] " +
  "md:[transform:translate(-1%,2%)_scale(1.3)] " +
  "lg:[transform:translate(-2%,0%)_scale(1.38)] " +
  "xl:[transform:translate(-3%,-1%)_scale(1.46)]";

const mentorIllustClass =
  "h-[125%] w-full max-w-none min-w-0 object-contain object-bottom-right " +
  "origin-bottom-right [transform:translate(2%,6%)_scale(1.12)] " +
  "sm:[transform:translate(0%,4%)_scale(1.2)] " +
  "md:[transform:translate(-1%,2%)_scale(1.28)] " +
  "lg:[transform:translate(-2%,0%)_scale(1.35)] " +
  "xl:[transform:translate(-3%,-1%)_scale(1.42)]";

const studentIcons = [<StudentBenefitIcon1 key="s1" />, <StudentBenefitIcon2 key="s2" />, <StudentBenefitIcon3 key="s3" />];
const mentorIcons = [<MentorBenefitIcon1 key="m1" />, <MentorBenefitIcon2 key="m2" />, <MentorBenefitIcon3 key="m3" />];

function LoginBenefitStrip({ role, items }: { role: AuthLoginRole; items: { line1: string; line2: string }[] }) {
  const icons = role === "student" ? studentIcons : mentorIcons;
  return (
    <div className={benefitStripShell[role]}>
      <p className="mb-3 text-center text-[0.7rem] font-extrabold uppercase tracking-widest text-slate-500 sm:mb-3.5 sm:text-xs">
        혜택
      </p>
      <ul
        className="grid list-none grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4"
        role="list"
      >
        {items.map((b, i) => (
          <li
            key={`${b.line1}-${b.line2}`}
            className={benefitCell[role]}
            role="listitem"
          >
            <div className="shrink-0 [transform:scale(1.18)] sm:[transform:scale(1.22)]">
              {icons[i]}
            </div>
            <div className="w-full min-w-0 max-w-[14rem] sm:max-w-[15.5rem]">
              <p
                className="text-balance text-center text-sm font-extrabold leading-[1.45] text-slate-900 sm:text-[0.95rem] sm:leading-[1.5] md:text-base"
              >
                {b.line1}
              </p>
              <p
                className="mt-1.5 text-balance text-center text-xs font-semibold leading-[1.5] text-slate-600 sm:mt-2 sm:text-sm sm:leading-7"
              >
                {b.line2}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroVisual({ role, children }: { role: AuthLoginRole; children: ReactNode }) {
  return (
    <div
      className={
        "relative w-full min-w-0 min-h-64 overflow-hidden rounded-3xl " +
        illustPanel[role] +
        " sm:min-h-72 md:min-h-80 lg:min-h-[20rem] xl:min-h-[24rem]"
      }
    >
      <div className="absolute inset-0 flex items-end justify-end p-0">{children}</div>
    </div>
  );
}

export function LoginLandingColumn({ role }: { role: AuthLoginRole }) {
  const t = loginLandingCopy[role];
  const illust =
    role === "student" ? (
      <LoginStudentHeroIllustration className={studentIllustClass} />
    ) : (
      <LoginMentorHeroIllustration className={mentorIllustClass} />
    );

  return (
    <div className={cardShell[role]}>
      <div className="flex flex-1 flex-col p-6 sm:p-7 md:p-8 lg:p-9 xl:p-10">
        <div
          className="grid w-full grid-cols-1 items-stretch gap-6 sm:gap-7 md:gap-8
          lg:min-h-0 lg:grid-cols-2 lg:items-stretch lg:gap-x-8 lg:gap-y-0
          lg:min-h-[19rem] xl:min-h-[22rem] xl:gap-x-10"
        >
          <div className="flex min-w-0 flex-col justify-center lg:justify-start lg:py-1">
            <span className={badgeClass[role]}>{t.badge}</span>
            <h2 className="mt-3 text-[1.65rem] font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:mt-4 sm:text-3xl sm:leading-tight md:mt-5 md:text-4xl">
              {t.title}
            </h2>
            <p className="mt-3 text-base font-medium leading-[1.65] text-slate-600 sm:mt-4 sm:text-lg sm:leading-relaxed">
              {t.line1}
            </p>
            <p className="mt-2.5 text-base font-medium leading-[1.65] text-slate-500 sm:mt-3.5 sm:text-lg sm:leading-relaxed">
              {t.line2}
            </p>
          </div>
          <HeroVisual role={role}>
            {illust}
          </HeroVisual>
        </div>

        <div className="mt-7 flex flex-col gap-6 sm:mt-8 sm:gap-7 md:mt-9 md:gap-8">
          <LoginBenefitStrip role={role} items={t.benefits} />
          <Link href={t.loginPath} className={cta[role]}>
            {t.ctaLabel}
          </Link>
        </div>
      </div>

      <div className="mt-0 border-t border-slate-200/40 px-6 py-4 sm:px-7 sm:py-5 md:px-8 lg:px-9">
        <p className="text-center text-sm font-medium text-slate-600 sm:text-base">
          아직 계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className={
              role === "student"
                ? "font-extrabold text-blue-600 underline decoration-blue-200/90 underline-offset-4 hover:text-blue-800"
                : "font-extrabold text-emerald-800 underline decoration-emerald-200/90 underline-offset-4 hover:text-emerald-950"
            }
          >
            {t.signupCta}
          </Link>
        </p>
      </div>
    </div>
  );
}
