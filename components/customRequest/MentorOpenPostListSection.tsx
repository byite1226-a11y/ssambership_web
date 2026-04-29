import Link from "next/link";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { formatDateYMDOrDash } from "@/lib/customRequest/mentorCustomRequestDisplay";
import { MentorPostStatusBadge } from "@/components/customRequest/MentorPostStatusBadge";

type Row = Record<string, unknown>;

export function MentorOpenPostListSection(props: {
  rows: Row[];
  listStatus: "ok" | "empty" | "rpc_unavailable";
}) {
  if (props.listStatus === "rpc_unavailable") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm text-slate-700 sm:px-5 sm:py-5">
        <p className="font-extrabold text-slate-900">모집 목록을 잠시 불러올 수 없어요</p>
        <p className="mt-2 leading-relaxed text-slate-600">
          운영 환경에 맞춰 연결 중이에요. 잠시 후 다시 열어 보시거나, 아래「내가 지원한 의뢰」를 확인해 주세요.
        </p>
      </div>
    );
  }
  if (!props.rows.length) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-center text-sm font-bold text-slate-700 sm:px-6">
        모집 중인 맞춤의뢰가 아직 없어요
      </p>
    );
  }
  return (
    <ul className="space-y-3 text-sm text-slate-800">
      {props.rows.map((r, i) => {
        const d = mapPostRowToPublicDetail(r);
        const id = String(r.id ?? i);
        return (
          <li key={id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
            <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/mentor/custom-request/posts/${id}`}
                  className="text-base font-extrabold text-slate-900 hover:text-blue-700"
                >
                  {d.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {d.category} · {d.subject}
                </p>
                <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
                  <span className="font-extrabold text-slate-500">예산</span> {d.budgetLine} ·{" "}
                  <span className="font-extrabold text-slate-500">마감</span> {d.deadline}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5 min-[420px]:flex-col min-[420px]:items-end min-[420px]:border-0 min-[420px]:pt-0">
                <MentorPostStatusBadge row={r} />
                <span className="text-xs tabular-nums text-slate-500">등록 {formatDateYMDOrDash(r.created_at)}</span>
                <Link
                  className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 hover:bg-slate-100"
                  href={`/mentor/custom-request/posts/${id}`}
                >
                  열기
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
