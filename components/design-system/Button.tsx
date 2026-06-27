import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type DsButtonVariant = "primary" | "secondary" | "ghost";
export type DsButtonSize = "sm" | "md" | "lg";
/** primary variant일 때만 적용 — 한 화면에 primary 1곳 권장.
 * "auto"(기본): 라우트 accent(var(--accent)) 따름 — 멘토 라우트=초록, 그 외=파랑(C3).
 * "student"/"mentor": 역할 고정색, 라우트와 무관하게 강제할 때만 사용. */
export type DsButtonAccent = "auto" | "student" | "mentor" | "neutral";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: DsButtonVariant;
  size?: DsButtonSize;
  accent?: DsButtonAccent;
  /** Link 스타일 대용 — href는 사용하지 않고 부모 Link로 감쌈 */
  children: ReactNode;
  className?: string;
};

const SIZE_CLASSES: Record<DsButtonSize, string> = {
  sm: "min-h-9 px-3.5 text-ds-label",
  md: "min-h-10 px-4 text-ds-body font-bold",
  lg: "min-h-11 px-5 text-ds-body font-bold",
};

const ACCENT_PRIMARY: Record<DsButtonAccent, string> = {
  auto: "bg-accent text-white hover:bg-accent-hover disabled:bg-slate-300",
  student: "bg-ds-accent-student text-white hover:bg-blue-700 disabled:bg-slate-300",
  mentor: "bg-ds-accent-mentor text-white hover:bg-emerald-700 disabled:bg-slate-300",
  neutral: "bg-ds-primary text-white hover:bg-slate-800 disabled:bg-slate-300",
};

/**
 * DS Button — shadow 없음, rounded-xl.
 * primary는 화면당 1곳만 사용(강조 1곳 원칙). secondary/ghost로 나머지 액션 처리.
 */
export function Button({
  variant = "secondary",
  size = "md",
  accent = "auto",
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition-colors",
        "disabled:cursor-not-allowed",
        SIZE_CLASSES[size],
        variant === "primary" && ACCENT_PRIMARY[accent],
        variant === "secondary" &&
          "border border-ds-border-subtle bg-ds-surface text-ds-primary hover:bg-ds-muted",
        variant === "ghost" && "text-ds-secondary hover:bg-ds-muted hover:text-ds-primary",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
