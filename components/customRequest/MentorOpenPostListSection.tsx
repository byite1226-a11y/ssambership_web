import Link from "next/link";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { formatDateYMDOrDash } from "@/lib/customRequest/mentorCustomRequestDisplay";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { MentorPostStatusBadge } from "@/components/customRequest/MentorPostStatusBadge";

type Row = Record<string, unknown>;

function chipClass(tone: "slate" | "violet") {
  return tone === "violet"
    ? "rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-violet-900"
    : "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-700";
}

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
        const gradeRaw = pickDisplayField(r, ["grade", "학년", "school_level", "target_grade", "level"]);
        const periodRaw = pickDisplayField(r, ["expected_duration", "duration_weeks", "timeline", "period"]);
        const showGrade = gradeRaw !== "—" && gradeRaw.trim().length > 0;
        const showPeriod = periodRaw !== "—" && periodRaw.trim().length > 0;
        const detailHref = `/mentor/custom-request/posts/${id}`;
        const applyHref = `/mentor/custom-request/posts/${id}/apply`;
        return (
          <li
            key={id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between lg:gap-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={chipClass("slate")}>{d.category !== "—" ? d.category : "분야 미정"}</span>
                  {showGrade ? <span className={chipClass("violet")}>{gradeRaw}</span> : null}
                  <MentorPostStatusBadge row={r} />
                </div>
                <Link href={detailHref} className="mt-2 block text-lg font-extrabold leading-snug text-slate-900 hover:text-blue-700">
                  {d.title}
                </Link>
                <p className="mt-1.5 text-sm text-slate-600">
                  <span className="font-extrabold text-slate-700">희망 전공·분야</span> {d.subject}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 sm:text-sm">
                  <span>
                    <span className="font-extrabold text-slate-500">예상 금액</span> {d.budgetLine}
                  </span>
                  {showPeriod ? (
                    <span>
                      <span className="font-extrabold text-slate-500">예상 기간</span> {periodRaw}
                    </span>
                  ) : null}
                  <span>
                    <span className="font-extrabold text-slate-500">마감</span> {d.deadline}
                  </span>
                </div>
                <p className="mt-1.5 text-xs tabular-nums text-slate-400">등록 {formatDateYMDOrDash(r.created_at)}</p>
              </div>
              <div className="flex w-full shrink-0 flex-col justify-start gap-3 border-t border-slate-100 pt-4 sm:w-auto sm:border-0 sm:pt-0 lg:w-44 lg:border-l lg:border-slate-100 lg:pl-5">
                <Link
                  href={applyHref}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-500 sm:w-auto"
                >
                  제안하기
                </Link>
                <Link href={detailHref} className="text-center text-xs font-semibold text-slate-600 underline-offset-2 hover:text-blue-800 hover:underline lg:text-right">
                  내용 확인하기
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
