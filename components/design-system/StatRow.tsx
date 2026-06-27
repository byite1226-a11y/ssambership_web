import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type LinkButtonProps = {
  href: string;
  children: ReactNode;
  /** "auto"(기본): 라우트 accent(var(--accent)) 따름. "mentor"/"student": 역할 고정 강제. */
  accent?: "auto" | "mentor" | "student";
  variant?: "primary" | "secondary";
  className?: string;
};

/** CTA 링크 — Button 톤과 동일, shadow 없음 */
export function LinkButton(props: LinkButtonProps) {
  const { href, children, accent = "auto", variant = "primary", className } = props;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-ds-label font-bold transition-colors",
        variant === "primary" &&
          (accent === "mentor"
            ? "bg-ds-accent-mentor text-white hover:bg-emerald-700"
            : accent === "student"
              ? "bg-ds-accent-student text-white hover:bg-blue-700"
              : "bg-accent text-white hover:bg-accent-hover"),
        variant === "secondary" &&
          "border border-ds-border-subtle bg-ds-surface text-ds-primary hover:bg-ds-muted",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export type StatRowProps = {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  className?: string;
};

/** 사이드바·요약용 label–value 행 */
export function StatRow(props: StatRowProps) {
  const { label, value, hint, href, className } = props;
  const row = (
    <div className={cn("flex items-center justify-between gap-3 py-2", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      </div>
      <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">{value}</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-lg transition hover:bg-slate-50">
        {row}
      </Link>
    );
  }

  return row;
}
