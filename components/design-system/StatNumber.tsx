import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DS_CARD_TONE_CLASSES, type DsCardTone } from "@/lib/design-system/cardTone";

export type StatNumberProps = {
  value: string | number;
  label: string;
  unit?: string;
  hint?: string;
  className?: string;
  /** KPI 구분용 아이콘(선택) */
  icon?: LucideIcon;
  /** 카드별 1색 톤(선택) */
  tone?: DsCardTone;
};

export function StatNumber(props: StatNumberProps) {
  const { value, label, unit, hint, className, icon: Icon, tone = "neutral" } = props;
  const t = DS_CARD_TONE_CLASSES[tone];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2.5">
        {Icon ? (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent",
              t.iconWrap,
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", t.icon)} strokeWidth={2} aria-hidden />
          </span>
        ) : null}
        <p className={cn("ds-text-label font-semibold", tone === "neutral" ? "text-ds-secondary" : t.hint)}>{label}</p>
      </div>
      <p className={cn("ds-text-display tabular-nums tracking-tight", t.value)}>
        {value}
        {unit ? (
          <span className={cn("ml-1 text-ds-h2 font-bold opacity-80", t.hint)}>{unit}</span>
        ) : null}
      </p>
      {hint ? <p className={cn("ds-text-caption", t.hint)}>{hint}</p> : null}
    </div>
  );
}

export type { DsCardTone };
