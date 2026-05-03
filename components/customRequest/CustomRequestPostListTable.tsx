import Link from "next/link";
import type { CustomListResult } from "@/lib/customRequest/customRequestQueries";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import { MentorPostStatusBadge } from "@/components/customRequest/MentorPostStatusBadge";

type Row = Record<string, unknown>;

function applicationCountLabel(r: Row): string {
  for (const k of ["application_count", "applications_count", "applicant_count", "bids_count"] as const) {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && /^\d+$/.test(v)) return v;
  }
  return "0";
}

export function CustomRequestPostListTable(props: { list: CustomListResult; max?: number }) {
  const { list, max = 5 } = props;

  if (list.error && !list.rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 px-5 py-5 text-sm text-slate-700">
        <p className="font-bold text-slate-800">맞춤의뢰를 불러오지 못했어요</p>
        <p className="mt-1.5 text-slate-600 font-medium">{mapDataErrorMessage(String(list.error))}</p>
      </div>
    );
  }

  if (!list.rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 px-5 py-8 text-center text-sm font-bold text-slate-500">
        모집 중인 맞춤의뢰가 아직 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2">
      <table className="w-full min-w-[600px] border-collapse text-left text-sm select-none">
        <thead>
          <tr className="border-b border-slate-100 text-xs text-slate-400 font-bold">
            <th className="p-4">카테고리</th>
            <th className="p-4">제목</th>
            <th className="p-4">예산</th>
            <th className="p-4">마감일</th>
            <th className="p-4">지원 현황</th>
            <th className="p-4">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {list.rows.slice(0, max).map((r, i) => {
            const d = mapPostRowToPublicDetail(r as Row);
            const rawId = r.id;
            const id = typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : null;
            const appCount = applicationCountLabel(r as Row);

            return (
              <tr
                key={(id ?? "row") + String(i)}
                className="hover:bg-slate-50/50 transition cursor-pointer"
              >
                <td className="p-4 whitespace-nowrap">
                  <span className="text-xs px-2.5 py-1 rounded bg-slate-100 font-bold text-slate-600 border border-slate-100">
                    {d.category || d.subject || "분야 미지정"}
                  </span>
                </td>
                <td className="p-4 min-w-0">
                  {id ? (
                    <Link
                      href={`/custom-request/${id}`}
                      className="text-sm font-extrabold text-slate-900 hover:text-blue-600 transition break-words line-clamp-1"
                    >
                      {d.title}
                    </Link>
                  ) : (
                    <span className="text-sm font-extrabold text-slate-900 break-words line-clamp-1">
                      {d.title}
                    </span>
                  )}
                </td>
                <td className="p-4 whitespace-nowrap font-bold text-slate-800">
                  {d.budgetLine || "확인 중"}
                </td>
                <td className="p-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                  {d.deadline || "—"}
                </td>
                <td className="p-4 whitespace-nowrap text-xs text-slate-600 font-semibold">
                  {appCount}명 지원
                </td>
                <td className="p-4 whitespace-nowrap">
                  <MentorPostStatusBadge row={r as Row} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
