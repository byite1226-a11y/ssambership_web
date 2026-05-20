import type { CustomCategoryRow } from "@/lib/customRequest/customRequestQueries";

const SUBJECT_CATEGORIES = [
  { label: "수학", desc: "수학 개념·문제 코치", icon: "📐", examplePill: "개념 정리" },
  { label: "영어", desc: "영어 언어·작문 피드백", icon: "📖", examplePill: "언어 작문" },
  { label: "국어", desc: "국어 작문·비설 코치", icon: "📚", examplePill: "비설 첨삭" },
  { label: "과학", desc: "과학 실험·이론 정리", icon: "🔬", examplePill: "실험 보고" },
  { label: "사회", desc: "사회 내신·서술 코치", icon: "🌍", examplePill: "내신 자료" },
  { label: "기타", desc: "기타 학습 상담", icon: "💬", examplePill: "맞춤 상담" },
] as const;

type Props = {
  fromTable: { rows: CustomCategoryRow[]; table: string | null; error: string | null };
};

function CategoryCard(props: { label: string; desc: string; icon: string; examplePill: string }) {
  const c = props;
  return (
    <article
      tabIndex={0}
      className="flex min-h-[190px] w-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white p-4 shadow-sm outline-none transition hover:border-sky-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:min-h-[198px]"
    >
      <div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-white text-2xl shadow-sm">{c.icon}</div>
        <p className="mt-3 text-sm font-extrabold leading-snug text-slate-900">{c.label}</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{c.desc}</p>
      </div>
      <p className="mt-3 inline-flex max-w-full items-center rounded-full border border-blue-100 bg-blue-50/90 px-3 py-1.5 text-[11px] font-bold leading-snug text-blue-900">
        예: {c.examplePill}
      </p>
    </article>
  );
}

export function CustomRequestCategoryGrid(props: Props) {
  const { fromTable } = props;
  const categoryFallbackNote = fromTable.error
    ? fromTable.table
      ? "등록된 분류를 불러오지 못해 기본 예시를 표시합니다."
      : "분류 테이블이 없어 기본 예시를 표시합니다."
    : null;

  return (
    <section className="w-full scroll-mt-24" id="categories">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
        <header className="border-b border-slate-200/90 pb-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-700/90">분야 선택</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">어떤 도움이 필요하신가요?</h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
            수학·영어·국어·과학·사회·기타 중 가까운 분야를 골라 의뢰를 등록해 주세요.
          </p>
          {categoryFallbackNote ? <p className="mt-3 text-xs font-semibold text-amber-800">{categoryFallbackNote}</p> : null}
        </header>

        <div className="pt-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {SUBJECT_CATEGORIES.map((c) => (
              <CategoryCard key={c.label} {...c} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


