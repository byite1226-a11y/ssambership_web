"use client";

import {
  CUSTOM_REQUEST_PLATFORM_FEE_LABEL,
  SUBSCRIPTION_PLATFORM_FEE_LABEL,
} from "@/lib/mentor/mentorPayoutsConstants";
import { formatCashKrw, momClass, momLabel } from "./payoutUi";

type Kpi = { amount: number; momPct: number | null };

export function MentorPayoutsKpiCards(props: {
  subscription: Kpi;
  customRequest: Kpi;
  total: Kpi;
  lifetimePaid: number;
}) {
  const cards = [
    {
      title: "구독 수익",
      kpi: props.subscription,
      highlight: false,
      feeNote: SUBSCRIPTION_PLATFORM_FEE_LABEL,
    },
    {
      title: "맞춤의뢰 수익",
      kpi: props.customRequest,
      highlight: false,
      feeNote: CUSTOM_REQUEST_PLATFORM_FEE_LABEL,
    },
    { title: "총 수익", kpi: props.total, highlight: true, feeNote: null as string | null },
    {
      title: "정산 완료",
      kpi: { amount: props.lifetimePaid, momPct: null as number | null },
      highlight: false,
      sub: "누적 정산 금액",
      feeNote: null as string | null,
    },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <article
          key={c.title}
          className={[
            "rounded-2xl border bg-white p-5 shadow-sm",
            c.highlight ? "border-blue-200 ring-1 ring-blue-100" : "border-slate-200",
          ].join(" ")}
        >
          <p className="text-xs font-bold text-slate-500">{c.title}</p>
          <p
            className={[
              "mt-2 text-2xl font-black tabular-nums",
              c.highlight ? "text-[#2563EB]" : "text-slate-900",
            ].join(" ")}
          >
            {formatCashKrw(c.kpi.amount)}
          </p>
          {"sub" in c && c.sub ? (
            <p className="mt-1 text-[11px] font-medium text-slate-500">{c.sub}</p>
          ) : c.feeNote ? (
            <p className="mt-1 text-[11px] font-semibold text-slate-500">{c.feeNote}</p>
          ) : (
            <p className={`mt-1 text-[11px] font-semibold ${momClass(c.kpi.momPct)}`}>{momLabel(c.kpi.momPct)}</p>
          )}
        </article>
      ))}
    </div>
  );
}
