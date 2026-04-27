import Link from "next/link";
import type { AdminListResult } from "@/lib/admin/adminQueries";

type Row = Record<string, unknown>;

function pickColumns(row: Row, max: number): string[] {
  const keys = Object.keys(row);
  const priority = [
    "id",
    "status",
    "state",
    "created_at",
    "updated_at",
    "target_type",
    "subject_type",
    "resource_type",
    "report_status",
    "refund_status",
    "title",
    "user_id",
    "mentor_id",
    "payment_id",
  ];
  const head = priority.filter((k) => keys.includes(k));
  const rest = keys.filter((k) => !head.includes(k));
  return [...head, ...rest].slice(0, max);
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function AdminRecordTable(props: {
  result: AdminListResult;
  maxCol?: number;
  idLabel?: string;
  getDetailLink?: (row: Row) => { href: string; label: string } | null;
}) {
  const { result, maxCol = 6, idLabel = "행 id", getDetailLink } = props;
  if (result.error && !result.rows.length) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm font-semibold text-amber-950">
        Supabase: {result.error}
      </div>
    );
  }
  if (!result.rows.length) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        조회된 행이 없습니다. RLS/필터/빈 큐 — {result.sourceNote}
      </p>
    );
  }
  const cols = pickColumns(result.rows[0] as Row, maxCol);
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <p className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">{result.sourceNote}</p>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {cols.map((c) => (
              <th key={c} className="px-2 py-2 font-extrabold text-slate-800">
                {c}
              </th>
            ))}
            <th className="px-2 py-2 font-extrabold text-slate-400">상세</th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((r, i) => {
            const row = r as Row;
            const id = cell(row.id);
            return (
              <tr key={id + String(i)} className="border-b border-slate-100 last:border-0">
                {cols.map((c) => (
                  <td key={c} className="max-w-[200px] truncate px-2 py-1.5 text-slate-800">
                    {cell(row[c])}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-xs" title={`${idLabel}: ${id}`}>
                  {getDetailLink ? (
                    (() => {
                      const d = getDetailLink(row);
                      if (!d) {
                        return <span className="text-slate-400">—</span>;
                      }
                      return (
                        <Link className="font-bold text-indigo-800 underline" href={d.href} prefetch={false}>
                          {d.label}
                        </Link>
                      );
                    })()
                  ) : (
                    <span className="text-slate-400">(라우트 예정)</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
