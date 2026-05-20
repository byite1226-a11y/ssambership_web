"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AdminDisputeListItem } from "@/lib/disputes/disputeListQueries";
import { adminDisputeStatusLabel } from "@/lib/admin/disputeLabels";
import { applyDisputeSanctionAction } from "@/lib/admin/adminDisputeSanctionActions";

type Props = {
  items: AdminDisputeListItem[];
  listError: string | null;
  table: string | null;
};

const TYPE_FILTERS = [
  { id: "all", label: "??" },
  { id: "report", label: "??" },
  { id: "dispute", label: "??" },
] as const;

const STATUS_FILTERS = [
  { id: "all", label: "??" },
  { id: "pending", label: "??" },
  { id: "processing", label: "???" },
  { id: "done", label: "??" },
] as const;

const SANCTIONS = [
  ["complete", "??"],
  ["hold", "??"],
  ["7d", "7?"],
  ["30d", "30?"],
  ["permanent", "??"],
] as const;

function badge(s: string) {
  const u = s.toLowerCase();
  if (/open|new|submitted|pend|ing|escalat|hold/i.test(u)) return "bg-amber-50 text-amber-700 border-amber-100";
  if (/under_review|review|process/i.test(u)) return "bg-indigo-50 text-indigo-700 border-indigo-100";
  if (/close|resolv|done|dismiss|complete/i.test(u)) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  return "bg-blue-50 text-blue-700 border-blue-100";
}

function matchType(it: AdminDisputeListItem, filter: string): boolean {
  if (filter === "all") return true;
  const t = `${it.typeLabel} ${it.titleLine}`.toLowerCase();
  if (filter === "report") return /report|abuse|content/i.test(t) || t.includes("??");
  if (filter === "dispute") return /dispute|order|custom/i.test(t) || t.includes("??");
  return true;
}

function matchStatus(it: AdminDisputeListItem, filter: string): boolean {
  if (filter === "all") return true;
  const s = (it.statusRaw || it.statusLabel).toLowerCase();
  if (filter === "pending") return /open|new|submitted|pend|await|hold/i.test(s);
  if (filter === "processing") return /review|process|escalat|progress/i.test(s);
  if (filter === "done") return /close|resolv|done|dismiss|complete|sanction/i.test(s);
  return true;
}

export function AdminDisputesWorkspace(props: Props) {
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]["id"]>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["id"]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return props.items.filter((it) => {
      if (!matchType(it, typeFilter)) return false;
      if (!matchStatus(it, statusFilter)) return false;
      if (dateFrom || dateTo) {
        const raw = it.createdAt !== "?" ? it.createdAt : "";
        const d = raw ? new Date(raw) : null;
        if (!d || Number.isNaN(d.getTime())) return false;
        if (dateFrom && d < new Date(`${dateFrom}T00:00:00`)) return false;
        if (dateTo && d > new Date(`${dateTo}T23:59:59`)) return false;
      }
      return true;
    });
  }, [props.items, typeFilter, statusFilter, dateFrom, dateTo]);

  if (props.listError && !props.items.length) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 text-sm text-red-950">
        <p className="font-bold">??? ???? ?????.</p>
        <p className="mt-1 text-xs">?? ? ?? ??? ???.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black text-slate-900">?????</h1>
        <p className="mt-1 text-sm text-slate-600">?? ? ?? ?? ???? ?????.</p>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <FilterGroup label="??" filters={TYPE_FILTERS} active={typeFilter} onSelect={setTypeFilter} />
        <FilterGroup label="??" filters={STATUS_FILTERS} active={statusFilter} onSelect={setStatusFilter} />
        <label className="text-xs font-semibold text-slate-600">
          ???
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 block rounded-lg border px-2 py-1.5" />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          ???
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 block rounded-lg border px-2 py-1.5" />
        </label>
      </div>

      {!props.table ? (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          ?? ???? ??? ? ????.
        </p>
      ) : !filtered.length ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          ??? ?? ?? ????.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
                <th className="px-4 py-3">??</th>
                <th className="px-4 py-3">?????</th>
                <th className="px-4 py-3">??</th>
                <th className="px-4 py-3">??</th>
                <th className="px-4 py-3">??</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((it) => {
                const st = adminDisputeStatusLabel(it.statusRaw || it.statusLabel);
                return (
                  <tr key={it.id} className="align-top hover:bg-slate-50/40">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{it.typeLabel}</td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="font-semibold text-slate-900">{it.titleLine}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500" title={it.summaryReason}>
                        {it.summaryReason}
                      </p>
                      <Link
                        href={`/admin/disputes/${encodeURIComponent(it.id)}`}
                        className="mt-1 inline-block text-xs font-bold text-[#1A56DB] hover:underline"
                      >
                        ??
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-lg border px-2 py-0.5 text-xs font-bold ${badge(it.statusRaw)}`}>
                        {st}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{it.createdAt}</td>
                    <td className="px-4 py-3">
                      <form action={applyDisputeSanctionAction} className="flex min-w-[200px] flex-col gap-1.5">
                        <input type="hidden" name="disputeId" value={it.id} />
                        <input name="note" placeholder="??(??)" className="rounded-lg border px-2 py-1 text-xs" />
                        <div className="flex flex-wrap gap-1">
                          {SANCTIONS.map(([sanction, label]) => (
                            <button
                              key={sanction}
                              type="submit"
                              name="sanction"
                              value={sanction}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterGroup<T extends string>(props: {
  label: string;
  filters: readonly { id: T; label: string }[];
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase text-slate-500">{props.label}</p>
      <div className="flex flex-wrap gap-1.5">
        {props.filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => props.onSelect(f.id)}
            className={[
              "rounded-full px-3 py-1 text-xs font-bold",
              props.active === f.id ? "bg-[#1A56DB] text-white" : "border border-slate-200 text-slate-700",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
