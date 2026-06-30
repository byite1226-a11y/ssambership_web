import Link from "next/link";
import type { MentorHubKeywordRow } from "@/lib/mentor/dashboard/mentorHubDashboardTypes";

export function MentorDashboardKeywordsList(props: { keywords: MentorHubKeywordRow[] }) {
  const { keywords } = props;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-slate-900">의뢰 분야별 인기 키워드</h3>
        <Link href="/mentor/custom-request/posts" className="text-[12px] font-bold text-[#059669] hover:underline">
          전체 보기 &gt;
        </Link>
      </div>

      {keywords.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-slate-400">집계된 키워드가 없습니다</p>
      ) : (
        <ol className="space-y-3">
          {keywords.map((row) => (
            <li key={`${row.rank}-${row.keyword}`} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ECFDF5] text-xs font-black text-[#059669]">
                {row.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{row.keyword}</p>
              </div>
              <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500">{row.count}건</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
