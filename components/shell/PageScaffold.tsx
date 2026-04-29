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
  children?: ReactNode;
};

const toneClass: Record<NonNullable<Cta["tone"]>, string> = {
  blue: "bg-blue-600 text-white",
  green: "bg-emerald-600 text-white",
  slate: "bg-slate-100 text-slate-800",
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
  children,
}: PageScaffoldProps) {
  const showEmptyStateCard = emptyState != null && emptyState.length > 0;
  const showDataPoints = dataPoints.length > 0;
  const showFooterPlaceholders = !hideFooterPlaceholderCards;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
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
      </section>

      {sections.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">{section.title}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    section.status === "connected" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {section.status === "connected" ? "정상" : "확인 필요"}
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
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-extrabold text-slate-900">안내</h3>
              <p className="mt-2 text-sm text-slate-600">{emptyState}</p>
            </article>
          ) : null}
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-extrabold text-slate-900">로딩</h3>
            <p className="mt-2 text-sm text-slate-600">{loadingState}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-extrabold text-slate-900">오류</h3>
            <p className="mt-2 text-sm text-slate-600">{errorState}</p>
          </article>
        </section>
      ) : null}

      {showDataPoints ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-extrabold text-slate-900">실데이터 연결 포인트</h3>
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
