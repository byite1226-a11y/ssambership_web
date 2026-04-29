import type { CustomCategoryRow } from "@/lib/customRequest/customRequestQueries";
import { mapCategoryLoadError } from "@/lib/utils/mapDataError";

/** 공개 랜딩용 기본 7개(데이터가 없을 때·보강용) */
const REFERENCE_CATEGORIES = [
  "학습 계획 & 방법",
  "과목 개념 이해",
  "과제 / 보고서",
  "발표 준비 코칭",
  "글쓰기 / 논술 첨삭",
  "진로 / 진학 상담",
  "기타 학습상담",
] as const;

type Props = {
  fromTable: { rows: CustomCategoryRow[]; table: string | null; error: string | null };
};

export function CustomRequestCategoryGrid(props: Props) {
  const { fromTable } = props;
  const labels = [...REFERENCE_CATEGORIES];
  return (
    <section className="space-y-3" id="categories">
      <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">어떤 도움이 필요하신가요?</h2>
      {fromTable.error && !fromTable.table ? (
        <p className="text-sm text-amber-800">{mapCategoryLoadError()}</p>
      ) : null}
      {fromTable.table && fromTable.error ? <p className="text-sm text-amber-800">{mapCategoryLoadError()}</p> : null}
      <div className="grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {labels.map((c) => (
          <div
            key={c}
            className="rounded-2xl border border-slate-200/90 bg-white px-3.5 py-3 text-sm font-extrabold text-slate-800 shadow-sm sm:py-3.5"
          >
            {c}
          </div>
        ))}
      </div>
    </section>
  );
}
