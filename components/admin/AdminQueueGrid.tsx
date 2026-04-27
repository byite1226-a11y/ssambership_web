import Link from "next/link";
import type { AdminQueueMetric } from "@/lib/admin/adminQueries";

const stateClass: Record<AdminQueueMetric["state"], string> = {
  connected: "border-emerald-200 bg-emerald-50/60",
  empty: "border-slate-200 bg-slate-50/80",
  skeleton: "border-amber-200 bg-amber-50/50",
};

export function AdminQueueGrid({ cards }: { cards: AdminQueueMetric[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((c) => (
        <Link
          key={c.href + c.label}
          href={c.href}
          className={`block rounded-2xl border p-4 transition hover:opacity-95 ${stateClass[c.state]}`}
        >
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{c.label}</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{c.nText}</p>
          <p className="mt-1 text-xs text-slate-600">{c.detail}</p>
        </Link>
      ))}
    </div>
  );
}
