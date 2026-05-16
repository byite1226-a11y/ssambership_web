import Link from "next/link";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";

type Row = Record<string, unknown>;

function timeAgo(dateStr: string): string {
  if (!dateStr || dateStr === "—") return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - d.getTime()) / (1000 * 60));
    if (diffMin < 1) return "방금 전";
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffMin < 60 * 24) return `${Math.round(diffMin / 60)}시간 전`;
    return `${Math.round(diffMin / (60 * 24))}일 전`;
  } catch {
    return "";
  }
}

export function MentorOpenPostListSection(props: {
  rows: Row[];
  listStatus: "ok" | "empty" | "rpc_unavailable";
}) {
  if (props.listStatus === "rpc_unavailable") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-5 py-5 text-[13px] text-slate-700">
        <p className="font-bold text-slate-900">모집 목록을 잠시 불러올 수 없어요</p>
        <p className="mt-2 leading-relaxed text-slate-600">
          운영 환경에 맞춰 연결 중이에요. 잠시 후 다시 열어 보시거나, 아래「내가 지원한 의뢰」를 확인해 주세요.
        </p>
      </div>
    );
  }
  if (!props.rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-[14px] font-bold text-slate-800">모집 중인 맞춤의뢰가 아직 없어요</p>
        <p className="mt-2 text-[12px] text-slate-500">새로운 의뢰가 등록되면 알림을 드릴게요.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {props.rows.map((r, i) => {
        const d = mapPostRowToPublicDetail(r);
        const id = String(r.id ?? i);
        const gradeRaw = pickDisplayField(r, ["grade", "학년", "school_level", "target_grade", "level"]);
        const periodRaw = pickDisplayField(r, ["expected_duration", "duration_weeks", "timeline", "period"]);
        const majorRaw = pickDisplayField(r, ["desired_major", "major", "희망전공", "target_major"]);
        const interestRaw = pickDisplayField(r, ["interests", "subject", "interest_area", "keyword"]);
        const showGrade = gradeRaw !== "—" && gradeRaw.trim().length > 0;
        const showPeriod = periodRaw !== "—" && periodRaw.trim().length > 0;
        const showMajor = majorRaw !== "—" && majorRaw.trim().length > 0;
        const showInterest = interestRaw !== "—" && interestRaw.trim().length > 0;
        const detailHref = `/mentor/custom-request/posts/${id}`;
        const applyHref = `/mentor/custom-request/posts/${id}/apply`;
        const createdAt = String(r.created_at ?? "");
        const timeLabel = timeAgo(createdAt);
        const categoryLabel = d.category !== "—" ? d.category : "";

        return (
          <li
            key={id}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-blue-200 hover:shadow-md"
          >
            {/* Top row: tags NEW time + bookmark */}
            <div className="flex items-start justify-between gap-3">
              {/* Left: category tag + grade tag */}
              <div className="flex flex-wrap items-center gap-1.5">
                {categoryLabel && (
                  <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                    {categoryLabel}
                  </span>
                )}
                {showGrade && (
                  <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                    {gradeRaw}
                  </span>
                )}
              </div>
              {/* Right: NEW + time + bookmark */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white tracking-wider">
                  NEW
                </span>
                {timeLabel && (
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeLabel}</span>
                )}
                <button
                  type="button"
                  aria-label="즐겨찾기 추가"
                  className="text-slate-300 hover:text-blue-400 transition"
                >
                  <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="mt-2.5">
              <Link
                href={detailHref}
                className="block text-[16px] font-black leading-snug text-slate-900 hover:text-blue-600 transition-colors"
              >
                {d.title}
              </Link>
            </div>

            {/* 희망 전공 + 관심 분야 - matching req_10 */}
            {(showMajor || showInterest) && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
                {showMajor && (
                  <span>희망 전공: <span className="font-medium text-slate-700">{majorRaw}</span></span>
                )}
                {showInterest && (
                  <span>관심 분야: <span className="font-medium text-slate-700">{interestRaw}</span></span>
                )}
              </div>
            )}

            {/* Meta row: budget, duration, deadline — matching req_10 icon+text style */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate-600">
              {/* Budget */}
              <div className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>예상 금액 <span className="font-semibold text-slate-800">{d.budgetLine}</span></span>
              </div>
              {/* Duration */}
              {showPeriod && (
                <div className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>예상 기간 <span className="font-semibold text-slate-800">{periodRaw}</span></span>
                </div>
              )}
              {/* Deadline */}
              <div className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>마감일 <span className="font-semibold text-slate-800">{d.deadline}</span></span>
              </div>
            </div>

            {/* Action buttons - matching req_10: [상세 보기] [제안하기] */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <Link
                href={detailHref}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                상세 보기
              </Link>
              <Link
                href={applyHref}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-5 text-[13px] font-bold text-white transition hover:bg-blue-700 shadow-sm"
              >
                제안하기
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
