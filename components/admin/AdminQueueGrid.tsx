import Link from "next/link";
import type { AdminQueueMetric } from "@/lib/admin/adminQueries";

const stateClass: Record<AdminQueueMetric["state"], string> = {
  connected: "border-slate-200 bg-white hover:border-blue-500/30",
  empty: "border-slate-200/80 bg-white hover:border-blue-500/30",
  skeleton: "border-slate-200/80 bg-white hover:border-blue-500/30",
};

export function AdminQueueGrid({ cards }: { cards: AdminQueueMetric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((c) => (
        <Link
          key={c.href + c.label}
          href={c.href}
          className={`block rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${stateClass[c.state]}`}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{c.label}</p>
          <p className="mt-2 text-3xl font-black text-slate-900 tabular-nums">{c.nText}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{c.detail}</p>
        </Link>
      ))}
    </div>
  );
}
