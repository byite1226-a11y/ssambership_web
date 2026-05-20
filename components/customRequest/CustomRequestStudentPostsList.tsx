"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { MentorPostStatusBadge } from "@/components/customRequest/MentorPostStatusBadge";

type Row = Record<string, unknown>;
type Filter = "all" | "waiting" | "active" | "done";

function statusBucket(row: Row): Filter {
  const s = String(row.status ?? row.state ?? row.post_status ?? "open").toLowerCase();
  if (["completed", "closed", "done", "finished"].includes(s)) return "done";
  if (["in_progress", "active", "assigned", "matched"].includes(s)) return "active";
  return "waiting";
}

export function CustomRequestStudentPostsList(props: { rows: Row[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = useMemo(() => {
    if (filter === "all") return props.rows;
    return props.rows.filter((r) => statusBucket(r) === filter);
  }, [props.rows, filter]);

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "\uC804\uCCB4" },
    { id: "waiting", label: "\uC9C0\uC6D0\uB300\uAE30" },
    { id: "active", label: "\uC9C4\uD589\uC911" },
    { id: "done", label: "\uC644\uB8CC" },
  ];

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={[
              "rounded-full px-3.5 py-1.5 text-xs font-bold",
              filter === t.id ? "bg-[#1A56DB] text-white" : "border border-slate-200 bg-white text-slate-700",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
          {"\uD574\uB2F9 \uC0C1\uD0DC\uC758 \uC758\uB8B0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => {
            const d = mapPostRowToPublicDetail(r);
            const id = typeof r.id === "string" ? r.id : String(r.id ?? "");
            return (
              <li key={id}>
                <Link
                  href={`/custom-request/${id}/applications`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-500">{d.category || "\uAE30\uD0C0"}</p>
                      <h3 className="mt-1 text-base font-extrabold text-slate-900">{d.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {"\uB9C8\uAC10"} {d.deadline || "\u2014"} {"\u00B7"} {d.budgetLine}
                      </p>
                    </div>
                    <MentorPostStatusBadge row={r} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
