import type { MentorHubDashboardData } from "@/lib/mentor/dashboard/mentorHubDashboardTypes";
import { formatMomPct, formatRatingDisplay } from "@/lib/mentor/dashboard/mentorHubDashboardDisplay";
import { formatCashKrw } from "@/lib/utils/formatDisplay";

export function MentorDashboardKpiCards(props: { kpis: MentorHubDashboardData["kpis"] }) {
  const { kpis } = props;
  const cards = [
    { label: "새 질문", value: `${kpis.newQuestions}건`, sub: "답변 대기 중", highlight: false },
    { label: "구독 학생", value: `${kpis.activeSubscribers}명`, sub: "활성 구독자", highlight: false },
    { label: "새 의뢰", value: `${kpis.newRequestsOpen}건`, sub: `오늘 +${kpis.newRequestsToday}건`, highlight: false },
    {
      label: "이번 달 수익",
      value: formatCashKrw(kpis.monthlyRevenue),
      sub: formatMomPct(kpis.monthlyRevenueMomPct),
      highlight: true,
    },
    {
      label: "평점",
      value: `${formatRatingDisplay(kpis.avgRating)} / 5.0`,
      sub: `리뷰 ${kpis.reviewCount}개`,
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((c) => (
        <article
          key={c.label}
          className={[
            "rounded-2xl border bg-white p-5 shadow-sm",
            c.highlight ? "border-emerald-200 ring-1 ring-emerald-100" : "border-slate-200",
          ].join(" ")}
        >
          <p className="text-xs font-bold text-slate-500">{c.label}</p>
          <p
            className={[
              "mt-2 text-2xl font-black tabular-nums",
              c.highlight ? "text-[#059669]" : "text-slate-900",
            ].join(" ")}
          >
            {c.value}
          </p>
          <p className="mt-2 text-[11px] font-semibold text-slate-500">{c.sub}</p>
        </article>
      ))}
    </div>
  );
}
