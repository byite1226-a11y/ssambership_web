/**
 * KPI·카드 surface용 소수 톤 팔레트 (카드당 1색)
 */

export type DsCardTone = "neutral" | "blue" | "indigo" | "green" | "teal" | "mentor" | "violet" | "amber";

export const DS_CARD_TONE_CLASSES: Record<
  DsCardTone,
  {
    surface: string;
    border: string;
    iconWrap: string;
    icon: string;
    value: string;
    hint: string;
    accentBar: string;
    /** 목록 카드 interactive hover 시 적용할 테두리 색(회색 배경 대신 tone 강조). */
    hoverBorder: string;
  }
> = {
  neutral: {
    surface: "bg-ds-surface",
    border: "border-ds-border-subtle",
    iconWrap: "bg-ds-neutral-bg",
    icon: "text-ds-neutral-fg",
    value: "text-ds-primary",
    hint: "text-ds-tertiary",
    accentBar: "border-l-slate-300",
    hoverBorder: "hover:border-blue-300",
  },
  blue: {
    surface: "bg-ds-accent-student-muted/60",
    border: "border-blue-100",
    iconWrap: "bg-blue-100/80",
    icon: "text-ds-accent-student",
    value: "text-ds-accent-student",
    hint: "text-blue-700/80",
    accentBar: "border-l-blue-600",
    hoverBorder: "hover:border-blue-400",
  },
  indigo: {
    surface: "bg-indigo-50/80",
    border: "border-indigo-100",
    iconWrap: "bg-indigo-100/70",
    icon: "text-indigo-600",
    value: "text-indigo-700",
    hint: "text-indigo-600/80",
    accentBar: "border-l-indigo-600",
    hoverBorder: "hover:border-indigo-400",
  },
  green: {
    surface: "bg-ds-accent-mentor-muted/50",
    border: "border-emerald-100",
    iconWrap: "bg-emerald-100/70",
    icon: "text-ds-accent-mentor",
    value: "text-ds-accent-mentor",
    hint: "text-emerald-700/80",
    accentBar: "border-l-emerald-500",
    hoverBorder: "hover:border-emerald-400",
  },
  teal: {
    surface: "bg-teal-50/80",
    border: "border-teal-100",
    iconWrap: "bg-teal-100/70",
    icon: "text-teal-600",
    value: "text-teal-700",
    hint: "text-teal-600/80",
    accentBar: "border-l-teal-600",
    hoverBorder: "hover:border-teal-400",
  },
  mentor: {
    surface: "bg-ds-accent-mentor-muted",
    border: "border-emerald-200/80",
    iconWrap: "bg-emerald-100",
    icon: "text-ds-accent-mentor",
    value: "text-ds-accent-mentor",
    hint: "text-emerald-700/80",
    accentBar: "border-l-emerald-500",
    hoverBorder: "hover:border-emerald-400",
  },
  violet: {
    surface: "bg-violet-50/80",
    border: "border-violet-100",
    iconWrap: "bg-violet-100/80",
    icon: "text-violet-600",
    value: "text-violet-700",
    hint: "text-violet-600/80",
    accentBar: "border-l-violet-600",
    hoverBorder: "hover:border-violet-400",
  },
  amber: {
    surface: "bg-amber-50/90",
    border: "border-amber-100",
    iconWrap: "bg-amber-100/90",
    icon: "text-amber-600",
    value: "text-amber-700",
    hint: "text-amber-700/80",
    accentBar: "border-l-amber-500",
    hoverBorder: "hover:border-amber-400",
  },
};
