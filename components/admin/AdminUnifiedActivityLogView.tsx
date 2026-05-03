import Link from "next/link";
import type { AdminActivityLogEntry } from "@/lib/admin/adminUnifiedActivityLog";

type Props = {
  entries: AdminActivityLogEntry[];
  loadWarning: string | null;
};

export function AdminUnifiedActivityLogView(props: Props) {
  const { entries, loadWarning } = props;

  return (
    <div className="max-w-6xl mx-auto space-y-4 text-sm">
      {loadWarning ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-950 animate-pulse">{loadWarning}</p>
      ) : null}
      {!entries.length ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-8 text-center text-sm text-slate-500 font-semibold">
          표시할 운영 로그가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">감사 로그 데이터</h2>
            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded">
              {entries.length}건
            </span>
          </div>
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40">
                <th className="px-5 py-3 text-xs font-bold text-slate-600">일시</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-600">유형</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-600">대상</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-600">처리·관련</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-600">상태</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-600">요약</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-600 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.key} className="hover:bg-slate-50/30 transition-colors align-top">
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500 leading-relaxed tabular-nums">{e.occurredAtLabel}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-bold text-slate-800 leading-relaxed">{e.categoryLabel}</td>
                  <td
                    className="max-w-[220px] px-5 py-4 text-xs font-medium text-slate-700 leading-relaxed"
                    title={e.targetTooltip ?? undefined}
                  >
                    {e.targetLine}
                  </td>
                  <td className="max-w-[160px] px-5 py-4 font-mono text-[11px] font-medium text-slate-600 leading-relaxed" title={e.actorLine}>
                    {e.actorLine}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-600 leading-relaxed" title={e.statusTooltip ?? undefined}>
                    {e.statusLine}
                  </td>
                  <td className="max-w-[320px] px-5 py-4 text-xs font-medium text-slate-600 leading-relaxed" title={e.summaryLine}>
                    {e.summaryLine}
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap align-middle">
                    {e.detailHref && e.detailLabel ? (
                      <Link
                        className="font-bold text-blue-600 hover:underline text-xs"
                        href={e.detailHref}
                        prefetch={false}
                      >
                        {e.detailLabel}
                      </Link>
                    ) : (
                      <span className="text-slate-400 font-medium">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
