import Link from "next/link";
import type { ReactNode } from "react";

type Cta = { href: string; label: string; tone?: "blue" | "green" | "slate" };

type Section = {
  title: string;
  body: string;
  status?: "skeleton" | "connected";
};

type PageScaffoldProps = {
  eyebrow: string;
  title: string;
  description: string;
  ctas: Cta[];
  /** 기본 []. 항목이 없으면 요약 그리드 블록을 생략합니다. */
  sections?: Section[];
  /** 없거나 빈 문자열이면 ‘빈 상태’ 카드를 렌더링하지 않습니다. */
  emptyState?: string;
  /** 없거나 빈 배열이면 ‘실데이터 연결 포인트’ 블록을 렌더링하지 않습니다. */
  dataPoints?: string[];
  /** UI 자리(실제 로딩 UX는 이후 도입) */
  loadingState?: string;
  errorState?: string;
  /** true이면 하단 로딩/오류(및 빈 상태) 플레이스홀더 카드 섹션을 렌더하지 않음 */
  hideFooterPlaceholderCards?: boolean;
  /**
   * true: 얇은 컨텍스트 바(맞춤의뢰 주문방 등) — 히어로 패딩·제목 축소, CTA는 텍스트 링크.
   * 기본 false — 기존 흰 카드 히어로 유지.
   */
  compactHero?: boolean;
  hideHero?: boolean;
  children?: ReactNode;
};

const toneClass: Record<NonNullable<Cta["tone"]>, string> = {
  blue: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
  green: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
  slate: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
};

export function PageScaffold({
  eyebrow,
  title,
  description,
  ctas,
  sections = [],
  emptyState,
  dataPoints = [],
  loadingState = "정보를 불러오고 있습니다.",
  errorState = "정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  hideFooterPlaceholderCards = false,
  compactHero = false,
  hideHero = false,
  children,
}: PageScaffoldProps) {
  const showEmptyStateCard = emptyState != null && emptyState.length > 0;
  const showDataPoints = dataPoints.length > 0;
  const showFooterPlaceholders = !hideFooterPlaceholderCards;

  return (
    <div className={compactHero ? "space-y-0" : "space-y-6"}>
      {!hideHero ? (
        <section
          className={
            compactHero
              ? "border-0 border-b border-slate-200/50 bg-[#F3F7FF] px-3 py-3 sm:px-4 sm:py-3.5"
              : "rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          }
        >
          <p
            className={
              compactHero
                ? "text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                : "text-xs font-extrabold uppercase tracking-wider text-slate-500"
            }
          >
            {eyebrow}
          </p>
          <h1
            className={
              compactHero
                ? "mt-1 text-lg font-bold leading-tight tracking-tight text-slate-900 sm:text-xl"
                : "mt-2 text-3xl font-black tracking-tight text-slate-900"
            }
          >
            {title}
          </h1>
          <p
            className={
              compactHero ? "mt-1 text-xs leading-relaxed text-slate-600" : "mt-2 text-sm leading-6 text-slate-600"
            }
          >
            {description}
          </p>
          {ctas.length > 0 ? (
            compactHero ? (
              <nav className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="페이지 이동">
                {ctas.map((cta) => (
                  <Link
                    key={cta.href + cta.label}
                    href={cta.href}
                    className="font-medium text-slate-500 underline-offset-2 transition hover:text-slate-800 hover:underline"
                  >
                    {cta.label}
                  </Link>
                ))}
              </nav>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2.5">
                {ctas.map((cta) => (
                  <Link
                    key={cta.href + cta.label}
                    href={cta.href}
                    className={`rounded-lg px-3.5 py-2 text-sm font-bold ${toneClass[cta.tone ?? "blue"]}`}
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            )
          ) : null}
        </section>
      ) : null}

      {sections.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">{section.title}</h2>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    section.status === "connected" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {section.status === "connected" ? "표시 중" : "준비 중"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
            </article>
          ))}
        </section>
      ) : null}

      {children}

      {showFooterPlaceholders ? (
        <section className={`grid gap-4 ${showEmptyStateCard ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {showEmptyStateCard ? (
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <h3 className="text-base font-extrabold text-slate-900">안내</h3>
              <p className="mt-2 text-sm text-slate-600">{emptyState}</p>
            </article>
          ) : null}
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <h3 className="text-base font-extrabold text-slate-900">로딩</h3>
            <p className="mt-2 text-sm text-slate-600">{loadingState}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <h3 className="text-base font-extrabold text-slate-900">오류</h3>
            <p className="mt-2 text-sm text-slate-600">{errorState}</p>
          </article>
        </section>
      ) : null}

      {showDataPoints ? (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <h3 className="text-base font-extrabold text-slate-900">참고</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {dataPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
