import { cn } from "@/lib/utils/cn";
import {
  DS_STATUS_KIND_TO_TONE,
  DS_STATUS_TONE_CLASSES,
  type DsStatusKind,
  type DsStatusTone,
} from "@/lib/design-system/statusBadge";

export type StatusBadgeProps = {
  label: string;
  /** semantic tone 직접 지정 */
  tone?: DsStatusTone;
  /** 도메인 kind → tone 자동 매핑 (tone보다 우선하지 않음) */
  kind?: DsStatusKind;
  size?: "sm" | "md";
  className?: string;
};

/**
 * 상태 pill — 연한 배경 + 또렷한 글자, shadow 없음.
 * MentorPostStatusBadge(빌드18)와 동일한 visual 패턴, 범용 API.
 */
export function StatusBadge(props: StatusBadgeProps) {
  const { label, tone, kind = "default", size = "md", className } = props;
  const resolvedTone = tone ?? DS_STATUS_KIND_TO_TONE[kind];

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-ds-label",
        DS_STATUS_TONE_CLASSES[resolvedTone],
        className,
      )}
    >
      {label}
    </span>
  );
}

/** StatusBadge 별칭 */
export const Badge = StatusBadge;

export type { DsStatusTone, DsStatusKind };
