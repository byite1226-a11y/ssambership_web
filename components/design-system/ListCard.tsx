import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { DS_CARD_TONE_CLASSES, type DsCardTone } from "@/lib/design-system/cardTone";

export type ListCardTone = DsCardTone;

/**
 * 목록 카드 공용 껍데기 — 좌측 상태색 액센트 바 + 진한 테두리(slate-300) + 옅은 그림자.
 * SurfaceCard(상세/섹션용)와 별개로, 클릭 가능한 목록 아이템에 쓴다.
 * 내부 레이아웃은 children이 담당(껍데기만 통일).
 */
export function ListCard(props: {
  children: ReactNode;
  /** 상태색 tone — 좌측 액센트 바 색. 기본 neutral(slate). */
  tone?: ListCardTone;
  /** 클릭 가능한 목록이면 hover 강조. */
  interactive?: boolean;
  /** 렌더 태그(기본 div). 예: "article", "li". */
  as?: ElementType;
  className?: string;
}) {
  const { children, tone = "neutral", interactive = false, as, className } = props;
  const Comp = (as ?? "div") as ElementType;
  const t = DS_CARD_TONE_CLASSES[tone];

  return (
    <Comp
      className={cn(
        "min-w-0 rounded-2xl border border-l-[4px] border-ds-border-emphasis bg-ds-surface p-4",
        "shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition",
        t.accentBar,
        interactive && "hover:border-ds-border-emphasis hover:shadow-[0_3px_12px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
