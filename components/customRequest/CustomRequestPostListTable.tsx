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
  return "확인 중";
}

export function CustomRequestPostListTable(props: { list: CustomListResult; max?: number }) {
  const { list, max = 5 } = props;
  if (list.error && !list.rows.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm text-slate-700 sm:px-5 sm:py-5">
        <p className="font-bold text-slate-800">맞춤의뢰를 불러오지 못했어요</p>
        <p className="mt-1.5 text-slate-600">{mapDataErrorMessage(String(list.error))}</p>
      </div>
    );
  }
  if (!list.rows.length) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-center text-sm font-bold text-slate-700 sm:px-6">
        모집 중인 맞춤의뢰가 아직 없습니다
      </p>
    );
  }
  return (
    <ul className="space-y-3 text-sm text-slate-800">
      {list.rows.slice(0, max).map((r, i) => {
        const d = mapPostRowToPublicDetail(r as Row);
        const rawId = r.id;
        const id = typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : null;
        return (
          <li
            key={(id ?? "row") + String(i)}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex flex-col gap-2.5 min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between">
              <div className="min-w-0 flex-1">
                {id ? (
                  <Link
                    href={`/custom-request/${id}`}
                    className="text-base font-extrabold text-slate-900 hover:text-blue-700"
                  >
                    {d.title}
                  </Link>
                ) : (
                  <p className="text-base font-extrabold text-slate-900">{d.title}</p>
                )}
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  <span className="font-bold text-slate-700">과목</span> {d.subject}
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 sm:text-sm">
                  <li>
                    <span className="font-extrabold text-slate-500">예산</span> {d.budgetLine}
                  </li>
                  <li>
                    <span className="font-extrabold text-slate-500">마감</span> {d.deadline}
                  </li>
                </ul>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5 min-[480px]:flex-col min-[480px]:items-end min-[480px]:border-0 min-[480px]:pt-0">
                <MentorPostStatusBadge row={r as Row} />
                <p className="text-xs text-slate-500">
                  <span className="font-extrabold">지원</span> {applicationCountLabel(r as Row)}명
                </p>
                {id ? (
                  <Link
                    className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 hover:bg-slate-100"
                    href={`/custom-request/${id}`}
                  >
                    상세
                  </Link>
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">{d.category ? `${d.category}` : "분야·연결을 준비 중이에요."}</p>
          </li>
        );
      })}
    </ul>
  );
}
