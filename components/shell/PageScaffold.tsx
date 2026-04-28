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
  emptyState: string;
  dataPoints: string[];
  /** UI 자리(실제 로딩 UX는 이후 도입) */
  loadingState?: string;
  errorState?: string;
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
  sections,
  emptyState,
  dataPoints,
  loadingState = "데이터를 불러오는 동안 스켈레톤/스피너 영역을 둡니다.",
  errorState = "조회 실패 시 재시도/고객센터 안내 영역을 둡니다.",
  children,
}: PageScaffoldProps) {
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

      {children}

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-extrabold text-slate-900">빈 상태 / 권한 상태 자리</h3>
          <p className="mt-2 text-sm text-slate-600">{emptyState}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-extrabold text-slate-900">로딩 상태 자리</h3>
          <p className="mt-2 text-sm text-slate-600">{loadingState}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-extrabold text-slate-900">에러 상태 자리</h3>
          <p className="mt-2 text-sm text-slate-600">{errorState}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-base font-extrabold text-slate-900">실데이터 연결 포인트</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {dataPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
