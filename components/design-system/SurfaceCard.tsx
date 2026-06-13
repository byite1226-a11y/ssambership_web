import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { DS_CARD_TONE_CLASSES, type DsCardTone } from "@/lib/design-system/cardTone";

export type SurfaceCardVariant = "default" | "emphasis";

export type SurfaceCardProps = {
  children: ReactNode;
  variant?: SurfaceCardVariant;
  title?: string;
  header?: ReactNode;
  headerAction?: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** 연한 배경·테두리 틴트(선택) */
  tone?: DsCardTone;
};

export function SurfaceCard(props: SurfaceCardProps) {
  const {
    children,
    variant = "default",
    title,
    header,
    headerAction,
    className,
    bodyClassName,
    tone = "neutral",
  } = props;

  const toneClasses = DS_CARD_TONE_CLASSES[tone];
  const borderClass =
    variant === "emphasis"
      ? "border-ds-border-emphasis"
      : tone !== "neutral"
        ? toneClasses.border
        : "border-ds-border-subtle";

  const showHeader = Boolean(header || title || headerAction);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border",
        tone !== "neutral" ? toneClasses.surface : "bg-ds-surface",
        borderClass,
        className,
      )}
    >
      {showHeader ? (
        <div
          className={cn(
            "flex items-start justify-between gap-3 border-b px-5 py-4",
            tone !== "neutral" ? `${toneClasses.border} bg-white/40` : "border-ds-border-subtle bg-ds-muted/40",
          )}
        >
          <div className="min-w-0 flex-1">
            {header ?? (title ? <h2 className="ds-text-h3">{title}</h2> : null)}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export const Card = SurfaceCard;

export type { DsCardTone };
