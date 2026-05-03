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
    <section className="space-y-4" id="categories">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">어떤 도움을 받을 수 있나요?</h2>
          {categoryFallbackNote ? <p className="text-xs text-slate-600 mt-1">{categoryFallbackNote}</p> : null}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {REFERENCE_CATEGORIES.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center flex flex-col items-center justify-between min-h-[144px] transition hover:border-slate-300 hover:shadow-sm select-none"
          >
            <span className="text-3xl mb-2">{c.icon}</span>
            <div>
              <p className="text-xs font-bold text-slate-900 mb-1">{c.label}</p>
              <p className="text-[10px] text-slate-500 leading-normal break-words">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
