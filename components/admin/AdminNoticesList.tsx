import type { NoticeListRow } from "@/lib/admin/adminNoticesQueries";

const badge = (on: boolean) =>
  on ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-700";

export function AdminNoticesList(props: { label: string; table: string; rows: NoticeListRow[]; error: string | null }) {
  const { label, table, rows, error } = props;
  if (error && !rows.length) {
    return <p className="text-sm font-bold text-amber-900">{label} ({table}): {error}</p>;
  }
  if (!rows.length) {
    return <p className="text-sm text-slate-600">{label}: 0건 — {table}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <p className="border-b border-slate-100 px-3 py-1.5 text-xs text-slate-500">
        {label} · {table} (컬럼은 스키마 추정)
      </p>
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90">
            <th className="px-2 py-2">제목</th>
            <th className="px-2 py-2">유형</th>
            <th className="px-2 py-2">타겟/위치</th>
            <th className="px-2 py-2">시작</th>
            <th className="px-2 py-2">종료</th>
            <th className="px-2 py-2">상태</th>
            <th className="px-2 py-2">수정</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const key = r.id || `row-${i}`;
            return (
              <tr key={key} className="border-b border-slate-100">
                <td className="max-w-[200px] truncate px-2 py-1.5 font-semibold text-slate-900">{r.title}</td>
                <td className="px-2 py-1.5 text-slate-800">{r.type}</td>
                <td className="max-w-[180px] truncate px-2 py-1.5 text-slate-800">{r.target}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-xs text-slate-700">{r.start}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-xs text-slate-700">{r.end}</td>
                <td className="px-2 py-1.5">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-extrabold ${badge(r.active.isOn)}`}>
                    {r.active.label}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-xs text-slate-400" title="상세/편집(후속)">
                  (id: {r.id || "—"})
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
