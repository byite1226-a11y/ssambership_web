import type { CustomListResult } from "@/lib/customRequest/customRequestQueries";

type Row = Record<string, unknown>;

function cell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function CustomRequestSimpleTable({ result, title }: { result: CustomListResult; title: string }) {
  if (result.error && !result.rows.length) {
    return <p className="text-sm text-amber-800">{title}: {result.error}</p>;
  }
  if (!result.rows.length) {
    return <p className="text-sm text-slate-600">{title}: 0건 — {result.sourceNote}</p>;
  }
  const keys = Object.keys(result.rows[0] as Row).slice(0, 6);
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <p className="border-b border-slate-100 px-2 py-1 text-xs text-slate-500">{result.table} · {result.sourceNote}</p>
      <table className="w-full min-w-[500px] text-left text-sm">
        <thead>
          <tr className="bg-slate-50">
            {keys.map((k) => (
              <th key={k} className="px-2 py-1.5 text-xs font-extrabold">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((raw, i) => (
            <tr key={i} className="border-t border-slate-100">
              {keys.map((k) => (
                <td key={k} className="max-w-[180px] truncate px-2 py-1.5 text-xs text-slate-800">
                  {cell((raw as Row)[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
