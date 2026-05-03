import type { MypageMetric } from "@/lib/mypage/mypageQueries";

const statusLabel: Record<MypageMetric["status"], string> = {
  connected: "연결됨",
  empty: "내역 없음",
  skeleton: "확인 중",
};

const statusClass: Record<MypageMetric["status"], string> = {
  connected: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  empty: "bg-slate-50 text-slate-500 border border-slate-100",
  skeleton: "bg-amber-50 text-amber-600 border border-amber-100",
};

export function MypageMetricLine({ metric }: { metric: MypageMetric }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-slate-100 py-3 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-bold text-slate-900">{metric.label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{metric.detail}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-900">{metric.valueText}</p>
        <span className={`mt-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusClass[metric.status]}`}>
          {statusLabel[metric.status]}
        </span>
      </div>
    </div>
  );
}
