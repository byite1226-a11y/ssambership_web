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
  sections: Section[];
  /** 하단 안내(선택). 개발용 ‘빈/로딩/에러 자리’ 블록은 제거됨 */
  emptyState?: string;
  /** @deprecated 렌더링하지 않음(호환용) */
  loadingState?: string;
  /** @deprecated 렌더링하지 않음(호환용) */
  errorState?: string;
  /** 비어 있으면 ‘연결 포인트’ 블록을 표시하지 않음 */
  dataPoints?: string[];
  children?: ReactNode;
};

const toneClass: Record<NonNullable<Cta["tone"]>, string> = {
  blue: "bg-blue-600 text-white",
  green: "bg-emerald-600 text-white",
  slate: "bg-slate-100 text-slate-800",
};

function sectionBadgeLabel(status: Section["status"]): string {
  return status === "connected" ? "표시" : "참고";
}

export function PageScaffold({
  eyebrow,
  title,
  description,
  ctas,
  sections,
  emptyState: _emptyState,
  loadingState: _loadingState,
  errorState: _errorState,
  dataPoints = [],
  children,
}: PageScaffoldProps) {
  void _emptyState;
  void _loadingState;
  void _errorState;
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
                    section.status === "connected" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {sectionBadgeLabel(section.status)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
            </article>
          ))}
        </section>
      ) : null}

      {children}

      {dataPoints.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-extrabold text-slate-900">관련 항목</h3>
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
