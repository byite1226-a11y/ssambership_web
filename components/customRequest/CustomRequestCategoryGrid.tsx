import type { CustomCategoryRow } from "@/lib/customRequest/customRequestQueries";

const REFERENCE_CATEGORIES = [
  {
    label: "학습 계획 & 방법",
    desc: "학습 계획 수립, 시간 관리, 공부 방법 코칭",
    icon: "📋",
    examplePill: "주간 학습표·루틴 짜기",
  },
  {
    label: "과목 개념 이해",
    desc: "개념 설명, 문제 풀이, 질문 & 오답 정리",
    icon: "📚",
    examplePill: "단원 개념 정리 도움",
  },
  {
    label: "과제 / 보고서",
    desc: "아이디어, 구성, 자료 정리, 초안 피드백",
    icon: "📄",
    examplePill: "보고서 구성·초안 방향",
  },
  {
    label: "발표 준비 코칭",
    desc: "발표 구성, 스크립트, PPT 구성 피드백",
    icon: "📊",
    examplePill: "발표 대본·슬라이드 코칭",
  },
  {
    label: "글쓰기 / 논술 첨삭",
    desc: "글의 구조, 표현, 문장 피드백 및 개선",
    icon: "📝",
    examplePill: "첨삭·문장 다듬기",
  },
  {
    label: "진로 / 진학 상담",
    desc: "진로 탐색, 과목 선택, 입시 전략 상담",
    icon: "🧭",
    examplePill: "과목·진로 방향 상담",
  },
  {
    label: "기타 학습상담",
    desc: "그 외 학습 관련 고민을 편하게 상담",
    icon: "💬",
    examplePill: "기타 학습 고민 상담",
  },
] as const;

const ROW_A = REFERENCE_CATEGORIES.slice(0, 4);
const ROW_B = REFERENCE_CATEGORIES.slice(4);

type Props = {
  fromTable: { rows: CustomCategoryRow[]; table: string | null; error: string | null };
};

function CategoryCard(props: (typeof REFERENCE_CATEGORIES)[number]) {
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
            의뢰 작성 시 아래에 가까운 분야를 골라 적어 주세요. 예시 문구는 참고용입니다.
          </p>
          {categoryFallbackNote ? <p className="mt-3 text-xs font-semibold text-amber-800">{categoryFallbackNote}</p> : null}
        </header>

        <div className="pt-8">
          {/* sm~lg: 균등 2열 / 3열 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:hidden">
            {REFERENCE_CATEGORIES.map((c) => (
              <CategoryCard key={c.label} {...c} />
            ))}
          </div>

          {/* xl: 4 + 3 (둘째 줄 가운데) */}
          <div className="hidden xl:block">
            <div className="grid grid-cols-4 gap-5">
              {ROW_A.map((c) => (
                <CategoryCard key={c.label} {...c} />
              ))}
            </div>
            <div className="mx-auto mt-5 grid max-w-[900px] grid-cols-3 gap-5">
              {ROW_B.map((c) => (
                <CategoryCard key={c.label} {...c} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
