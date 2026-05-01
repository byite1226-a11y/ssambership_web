import type { NoticeListRow } from "@/lib/admin/adminNoticesQueries";
import { ADMIN_LIST_ERROR_TITLE, adminNoticesSectionDescription } from "@/lib/admin/adminDisplayError";

const badge = (on: boolean) =>
  on ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-700";

export function AdminNoticesList(props: { label: string; table: string; rows: NoticeListRow[]; error: string | null }) {
  const { label, table: _table, rows, error } = props;
  void _table;
  if (error && !rows.length) {
    const kind = label === "프로모션" ? "promotion" : "notice";
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-950">
        <p className="font-semibold">{ADMIN_LIST_ERROR_TITLE}</p>
        <p className="mt-1 text-xs text-amber-900/95">{adminNoticesSectionDescription(kind)}</p>
      </div>
    );
  }
  if (!rows.length) {
    return (
      <p className="text-sm text-slate-600">
        {label === "프로모션" ? "등록된 프로모션이 없습니다." : "등록된 공지가 없습니다."}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <p className="border-b border-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">{label}</p>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90">
            <th className="px-2 py-2">제목</th>
            <th className="px-2 py-2">유형</th>
            <th className="px-2 py-2">노출 위치</th>
            <th className="px-2 py-2">노출 상태</th>
            <th className="px-2 py-2">노출 기간</th>
            <th className="px-2 py-2">생성일</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const key = r.id || `row-${i}`;
            return (
              <tr key={key} className="border-b border-slate-100 last:border-0">
                <td className="max-w-[220px] truncate px-2 py-1.5 font-semibold text-slate-900">{r.title}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-slate-800">{r.typeLabel}</td>
                <td className="max-w-[140px] truncate px-2 py-1.5 text-slate-700">{r.target}</td>
                <td className="px-2 py-1.5">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-extrabold ${badge(r.exposure.isOn)}`}>
                    {r.exposure.label}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-xs text-slate-700">{r.periodLabel}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-xs text-slate-600">{r.createdLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
