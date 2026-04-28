import type { CustomCategoryRow } from "@/lib/customRequest/customRequestQueries";
import { mapCategoryLoadError } from "@/lib/utils/mapDataError";

const STATIC_LABELS = ["수능·입시", "수행평가", "논술·면접", "논문·탐구", "기타"] as const;

type Props = {
  fromTable: { rows: CustomCategoryRow[]; table: string | null; error: string | null };
};

export function CustomRequestCategoryGrid(props: Props) {
  const { fromTable } = props;
  const fromDb = fromTable.rows
    .map((r) => (typeof r.name === "string" ? r.name : typeof r.label === "string" ? r.label : typeof r.title === "string" ? r.title : null))
    .filter((x): x is string => Boolean(x));
  const labels = fromDb.length ? fromDb : [...STATIC_LABELS];
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-extrabold text-slate-900">카테고리</h2>
      {fromTable.error && !fromTable.table ? <p className="text-xs text-amber-800">{mapCategoryLoadError()}</p> : null}
      {fromTable.table && fromTable.error ? <p className="text-xs text-amber-800">{mapCategoryLoadError()}</p> : null}
      {fromTable.table && !fromTable.error ? <p className="text-xs text-slate-500">등록된 카테고리를 표시합니다.</p> : null}
      {!fromTable.table && !fromTable.error ? <p className="text-xs text-slate-500">아래는 예시입니다. 양식에서도 동일한 구분을 사용할 수 있습니다.</p> : null}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {labels.map((c) => (
          <div key={c} className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-bold text-slate-800">
            {c}
          </div>
        ))}
      </div>
    </section>
  );
}
