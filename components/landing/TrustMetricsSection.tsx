import type { TrustMetric } from "@/lib/landing/landingPageQueries";

export function TrustMetricsSection(props: { metrics?: TrustMetric[] }) {
  // Use real data if provided, otherwise fallback to safe marketing propositions
  const displayMetrics = props.metrics?.length 
    ? props.metrics.map(m => ({
        label: m.label,
        value: m.value,
        color: "bg-blue-50 text-blue-600",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        )
      }))
    : [
        {
          label: "전문 멘토링",
          value: "전 과목 지원",
          color: "bg-blue-50 text-blue-600",
          icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
        },
        {
          label: "무제한 질문",
          value: "언제 어디서나",
          color: "bg-indigo-50 text-indigo-600",
          icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
        },
        {
          label: "학생 만족도",
          value: "최고의 파트너",
          color: "bg-purple-50 text-purple-600",
          icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path d="m12 3 1.912 5.885h6.19l-5.007 3.638L17.007 18.41 12 14.77l-5.007 3.64 1.912-5.887-5.007-3.638h6.19z" /></svg>
        },
        {
          label: "안전 결제",
          value: "에스크로 지원",
          color: "bg-slate-50 text-slate-600",
          icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
        }
      ];

  const gridCols = displayMetrics.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";

  return (
    <div className="py-12 border-y border-slate-100 bg-slate-50/30">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-8 lg:gap-12`}>
          {displayMetrics.map((m, i) => (
            <div key={i} className="flex items-center gap-6 justify-center sm:justify-start">
              <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl ${m.color} shadow-sm border border-white/50 transition-transform hover:scale-105`}>
                {m.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-slate-400 truncate uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-[24px] font-black text-slate-800 tracking-tight whitespace-nowrap">
                  {m.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
