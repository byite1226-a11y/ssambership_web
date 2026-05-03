import type { CustomCategoryRow } from "@/lib/customRequest/customRequestQueries";

const REFERENCE_CATEGORIES = [
  { label: "학습 계획 & 방법", desc: "학습 계획 수립, 시간 관리, 공부 방법 코칭", icon: "📋" },
  { label: "과목 개념 이해", desc: "개념 설명, 문제 풀이, 질문 & 오답 정리", icon: "📚" },
  { label: "과제 / 보고서", desc: "아이디어, 구성, 자료 정리, 초안 피드백", icon: "📄" },
  { label: "발표 준비 코칭", desc: "발표 구성, 스크립트, PPT 구성 피드백", icon: "📊" },
  { label: "글쓰기 / 논술 첨삭", desc: "글의 구조, 표현, 문장 피드백 및 개선", icon: "📝" },
  { label: "진로 / 진학 상담", desc: "진로 탐색, 과목 선택, 입시 전략 상담", icon: "🧭" },
  { label: "기타 학습상담", desc: "그 외 학습 관련 고민을 편하게 상담", icon: "💬" },
] as const;

type Props = {
  fromTable: { rows: CustomCategoryRow[]; table: string | null; error: string | null };
};

export function CustomRequestCategoryGrid(props: Props) {
  const { fromTable } = props;
  const categoryFallbackNote = fromTable.error
    ? fromTable.table
      ? "등록된 분류를 불러오지 못해 기본 예시를 표시합니다."
      : "분류 테이블이 없어 기본 예시를 표시합니다."
    : null;

  return (
    <section className="space-y-6" id="categories">
      <div className="border-b border-slate-200/80 pb-4">
        <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">어떤 도움을 받을 수 있나요?</h2>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
          아래 분야 중 가까운 것을 골라 의뢰에 적어 주세요.
        </p>
        {categoryFallbackNote ? <p className="mt-3 text-xs font-semibold text-amber-800">{categoryFallbackNote}</p> : null}
      </div>
      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {REFERENCE_CATEGORIES.map((c) => (
          <article
            key={c.label}
            tabIndex={0}
            className="group flex h-full min-h-[176px] flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] outline-none transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/80 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 select-none"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white text-2xl shadow-sm transition group-hover:border-sky-200">
              {c.icon}
            </div>
            <p className="mt-4 text-sm font-extrabold leading-snug text-slate-900">{c.label}</p>
            <p className="mt-2 flex-1 text-xs font-medium leading-relaxed text-slate-600">{c.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
