import Link from "next/link";
import type { MentorHubDashboardData } from "@/lib/mentor/dashboard/mentorHubDashboardTypes";
import { formatRatingDisplay, starFillCount } from "@/lib/mentor/dashboard/mentorHubDashboardDisplay";
import { formatCashKrw } from "@/lib/utils/formatDisplay";

type Props = Pick<MentorHubDashboardData, "todaySchedule" | "revenuePanel" | "rating">;

function StarRow(props: { filled: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`별점 ${props.filled}점`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < props.filled ? "text-amber-400" : "text-slate-200"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function MentorDashboardRightPanel(props: Props) {
  const { todaySchedule, revenuePanel, rating } = props;
  const stars = starFillCount(rating.avg);

  return (
    <aside className="w-full shrink-0 space-y-4 xl:w-[280px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-900">오늘의 일정</h3>
          <Link href="/mentor/custom-request/orders" className="text-[11px] font-bold text-[#1A56DB] hover:underline">
            전체 보기 &gt;
          </Link>
        </div>
        {todaySchedule.length === 0 ? (
          <p className="mt-4 text-center text-[13px] text-slate-400">오늘 마감 일정이 없어요</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {todaySchedule.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded-xl border border-slate-100 p-3 transition hover:border-blue-100 hover:bg-blue-50/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[13px] font-bold ${item.urgent ? "text-red-600" : "text-slate-900"}`}>
                      {item.title}
                    </p>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${item.badgeClassName}`}
                    >
                      {item.badgeLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{item.meta}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">수익 현황 ({revenuePanel.monthLabel} 기준)</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold text-slate-500">총 예상 수익</dt>
            <dd className="mt-1 text-lg font-black tabular-nums text-slate-900">
              {formatCashKrw(revenuePanel.totalExpected)}
            </dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-slate-100 pt-3">
            <dt className="font-semibold text-slate-600">진행 중</dt>
            <dd className="font-bold tabular-nums text-slate-800">{formatCashKrw(revenuePanel.inProgress)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="font-semibold text-slate-600">완료(정산 예정)</dt>
            <dd className="font-bold tabular-nums text-[#1A56DB]">
              {formatCashKrw(revenuePanel.completedPending)}
            </dd>
          </div>
        </dl>
        <Link href="/mentor/payouts" className="mt-4 inline-flex text-xs font-bold text-[#1A56DB] hover:underline">
          정산/수익 관리 &gt;
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">나의 평점</h3>
        <p className="mt-3 text-2xl font-black text-slate-900">
          {formatRatingDisplay(rating.avg)} <span className="text-base font-bold text-slate-400">/ 5.0</span>
        </p>
        <div className="mt-2">
          <StarRow filled={stars} />
        </div>
        <Link href="/mentor/reviews" className="mt-4 inline-flex text-xs font-bold text-[#1A56DB] hover:underline">
          리뷰 {rating.count}개 보기 &gt;
        </Link>
      </section>
    </aside>
  );
}
