import Link from "next/link";
import type { CustomListResult } from "@/lib/customRequest/customRequestQueries";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

export function CustomRequestPostListTable(props: { list: CustomListResult; max?: number }) {
  const { list, max = 5 } = props;
  if (list.error && !list.rows.length) {
    return <p className="text-sm text-amber-800">최근 의뢰: {mapDataErrorMessage(String(list.error))}</p>;
  }
  if (!list.rows.length) {
    return <p className="text-sm text-slate-600">아직 등록된 맞춤의뢰가 없습니다.</p>;
  }
  return (
    <ul className="space-y-2 text-sm text-slate-800">
      {list.rows.slice(0, max).map((r, i) => {
        const rawId = r.id;
        const id = typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : null;
        const title = pickDisplayField(r, ["title", "subject", "id"]);
        return (
          <li key={(id ?? "row") + String(i)} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            {id ? (
              <Link href={`/custom-request/${id}`} className="font-bold text-blue-800 hover:underline">
                {title}
              </Link>
            ) : (
              <span className="font-bold">{title}</span>
            )}
            <span className="text-slate-500"> · {pickDisplayField(r, ["category", "subcategory", "state"])}</span>
          </li>
        );
      })}
    </ul>
  );
}
