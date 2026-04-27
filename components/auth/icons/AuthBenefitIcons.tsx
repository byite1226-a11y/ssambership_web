import type { ReactNode } from "react";

type IconBoxProps = { className?: string; children: ReactNode };

function IconBox({ className = "", children }: IconBoxProps) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${className}`}
      aria-hidden
    >
      {children}
    </span>
  );
}

/** 학생 혜택: Q&A, 탐색, 멤버십 */
export function StudentBenefitIcon1() {
  return (
    <IconBox className="bg-sky-100 text-sky-700">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 8h10M7 12h6M9 18l-2 3h4l-1-3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 5.2C4.5 4 5.3 3 6.4 3h11.1c1.1 0 1.9 1 1.9 2.2v7.1c0 1.2-.8 2.1-1.9 2.1H9l-3.3 2.4V5.2z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="17" cy="7" r="1.2" fill="currentColor" />
      </svg>
    </IconBox>
  );
}

export function StudentBenefitIcon2() {
  return (
    <IconBox className="bg-sky-100 text-sky-700">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 16l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8.5 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    </IconBox>
  );
}

export function StudentBenefitIcon3() {
  return (
    <IconBox className="bg-sky-100 text-sky-700">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 8h8M8 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M10 20l-2-3h8l-2 3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </IconBox>
  );
}

/** 멘토 혜택: 대시보드, 매칭, 정책 */
export function MentorBenefitIcon1() {
  return (
    <IconBox className="bg-emerald-100 text-emerald-800">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </IconBox>
  );
}

export function MentorBenefitIcon2() {
  return (
    <IconBox className="bg-emerald-100 text-emerald-800">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M4.5 18.5c.8-2.2 2.5-3.3 4.5-3.3s3.7 1.1 4.5 3.3"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <circle cx="16.5" cy="7.5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M14.5 18.5c.3-1.1 1-1.8 1.8-1.8h0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </IconBox>
  );
}

export function MentorBenefitIcon3() {
  return (
    <IconBox className="bg-emerald-100 text-emerald-800">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 4h2l2 4h4l1.5-3H19"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <rect x="5" y="8" width="14" height="10" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9.5 12h5M9.5 15h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </IconBox>
  );
}
