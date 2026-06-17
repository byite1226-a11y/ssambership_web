/**
 * 쌤버십 Design System v1 — 프레젠테이션 컴포넌트
 *
 * 기존 화면은 아직 import하지 않습니다.
 * `@/components/design-system/*` 경로로만 사용하세요.
 *
 * 기존과 이름 충돌 주의:
 * - EmptyState → `@/components/common/EmptyState` (레거시)
 * - MentorPostStatusBadge → 도메인 전용 (빌드18)
 */

export { StatNumber, type StatNumberProps } from "@/components/design-system/StatNumber";
export { SurfaceCard, Card, type SurfaceCardProps, type SurfaceCardVariant } from "@/components/design-system/SurfaceCard";
export { ListCard, listCardClassName, type ListCardTone } from "@/components/design-system/ListCard";
export {
  StatusBadge,
  Badge,
  type StatusBadgeProps,
  type DsStatusTone,
  type DsStatusKind,
} from "@/components/design-system/StatusBadge";
export {
  Button,
  type ButtonProps,
  type DsButtonVariant,
  type DsButtonSize,
  type DsButtonAccent,
} from "@/components/design-system/Button";
export { ProgressTimeline, type ProgressTimelineProps } from "@/components/design-system/ProgressTimeline";
export { EmptyState, type DsEmptyStateProps } from "@/components/design-system/EmptyState";
export { LinkButton, StatRow, type LinkButtonProps, type StatRowProps } from "@/components/design-system/StatRow";

export {
  DS_SPACE,
  DS_LAYOUT,
  DS_ACCENT,
} from "@/lib/design-system/tokens";
export {
  DS_CUSTOM_ORDER_PROGRESS_STEPS,
  type DsProgressStep,
} from "@/lib/design-system/progressTimeline";
export {
  DS_STATUS_KIND_TO_TONE,
  DS_STATUS_TONE_CLASSES,
} from "@/lib/design-system/statusBadge";
export { DS_CARD_TONE_CLASSES, type DsCardTone } from "@/lib/design-system/cardTone";
