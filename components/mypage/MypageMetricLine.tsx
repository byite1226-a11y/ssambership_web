import type { MypageMetric } from "@/lib/mypage/mypageQueries";

const statusLabel: Record<MypageMetric["status"], string> = {
  connected: "connected",
  empty: "empty",
  skeleton: "skeleton",
};

const statusClass: Record<MypageMetric["status"], string> = {
  connected: "bg-emerald-50 text-emerald-800",
  empty: "bg-slate-100 text-slate-700",
  skeleton: "bg-amber-50 text-amber-800",
};

export function MypageMetricLine({ metric }: { metric: MypageMetric }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-slate-100 py-2 last:border-0">
      <div>
        <p className="text-sm font-extrabold text-slate-900">{metric.label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{metric.detail}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-900">{metric.valueText}</p>
        <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold ${statusClass[metric.status]}`}>
          {statusLabel[metric.status]}
        </span>
      </div>
    </div>
  );
}
