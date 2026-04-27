import type { TrustMetric } from "@/lib/landing/landingPageQueries";

export function TrustMetricsSection(props: { metrics: TrustMetric[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-extrabold text-slate-900">신뢰 지표</h2>
      <p className="mt-1 text-xs text-slate-500">head count · RLS 시 0 또는 오류 메시지</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {props.metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-extrabold text-slate-500">{m.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{m.value}</p>
            <p className="mt-1 text-xs text-slate-500">{m.probe}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
