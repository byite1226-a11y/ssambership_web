import type { ReactNode } from "react";

/**
 * 공용 반응형 2단 스캐폴드 (모바일 B-1).
 *
 * - lg/xl+ : `desktopGrid`(호출부가 기존 페이지 값을 그대로 전달)로 다단 그리드.
 *            → 데스크탑은 기존과 픽셀 단위로 동일하게 보존된다.
 * - 그 미만 : 항상 `grid-cols-1` 단일 컬럼. 본문(main)이 먼저, 보조 패널(aside)은 본문 아래로 흐른다.
 *
 * 데이터·핸들러·가드에는 일절 관여하지 않는다(레이아웃 래핑 전용).
 *
 * 우측 사이드바(asideSide="right", 기본): main → aside DOM 순서가 곧 모바일 단일컬럼 순서이므로
 *   추가 래퍼 없이 기존 마크업과 동일한 출력을 낸다.
 * 좌측 사이드바(asideSide="left"): DOM은 main을 먼저 두어 모바일에서 본문이 위로 오게 하고,
 *   데스크탑 시각 위치만 CSS order로 좌측 복원한다(데스크탑 픽셀 동일, 모바일은 본문 우선).
 */
type Props = {
  /** 본문(주 컬럼). 모바일 단일컬럼에서 항상 위. */
  main: ReactNode;
  /** 보조 패널(사이드바). 모바일에서 본문 아래로 재배치. */
  aside: ReactNode;
  /**
   * 데스크탑 다단 그리드 클래스(브레이크포인트 포함). 기존 페이지 값 그대로 전달.
   * 예: "lg:grid-cols-[minmax(0,1fr)_320px]", "xl:grid-cols-[1fr_300px]"
   */
  desktopGrid: string;
  /** 데스크탑에서 사이드바를 어느 쪽에 둘지(시각). 기본 right. */
  asideSide?: "left" | "right";
  /** asideSide="left"일 때 order 복원에 쓰는 브레이크포인트. desktopGrid의 접두사와 맞춘다. */
  bp?: "lg" | "xl";
  /** 컬럼 간격. 기본 gap-6. (기존 페이지 값 그대로 전달해 동일 유지) */
  gap?: string;
  /** 래퍼에 더할 클래스(예: "mt-6"). */
  className?: string;
};

export function ResponsivePageColumns({
  main,
  aside,
  desktopGrid,
  asideSide = "right",
  bp = "lg",
  gap = "gap-6",
  className = "",
}: Props) {
  const base = `grid grid-cols-1 items-start ${gap} ${desktopGrid} ${className}`.trim();

  if (asideSide === "right") {
    // main → aside 순서가 모바일 단일컬럼 순서와 일치 → 기존 우측 사이드바 마크업과 동일 출력.
    return (
      <div className={base}>
        {main}
        {aside}
      </div>
    );
  }

  // 좌측 사이드바: 모바일은 본문 먼저, 데스크탑은 order로 사이드바를 좌측에 복원.
  const mainOrder = bp === "xl" ? "xl:order-2" : "lg:order-2";
  const asideOrder = bp === "xl" ? "xl:order-1" : "lg:order-1";
  return (
    <div className={base}>
      <div className={`min-w-0 ${mainOrder}`}>{main}</div>
      <div className={`min-w-0 ${asideOrder}`}>{aside}</div>
    </div>
  );
}
