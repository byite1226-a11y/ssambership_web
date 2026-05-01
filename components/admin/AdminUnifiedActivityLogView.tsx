import Link from "next/link";
import type { AdminActivityLogEntry } from "@/lib/admin/adminUnifiedActivityLog";

type Props = {
  entries: AdminActivityLogEntry[];
  loadWarning: string | null;
};

export function AdminUnifiedActivityLogView(props: Props) {
  const { entries, loadWarning } = props;

  return (
    <div className="space-y-3">
      {loadWarning ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">{loadWarning}</p>
      ) : null}
      {!entries.length ? (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">표시할 운영 로그가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="whitespace-nowrap px-3 py-2 font-extrabold text-slate-800">일시</th>
                <th className="whitespace-nowrap px-3 py-2 font-extrabold text-slate-800">유형</th>
                <th className="min-w-[140px] px-3 py-2 font-extrabold text-slate-800">대상</th>
                <th className="min-w-[120px] px-3 py-2 font-extrabold text-slate-800">처리·관련</th>
                <th className="whitespace-nowrap px-3 py-2 font-extrabold text-slate-800">상태</th>
                <th className="min-w-[200px] px-3 py-2 font-extrabold text-slate-800">요약</th>
                <th className="min-w-[100px] px-3 py-2 font-extrabold text-slate-800" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.key} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">{e.occurredAtLabel}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-slate-900">{e.categoryLabel}</td>
                  <td className="max-w-[220px] px-3 py-2 text-xs text-slate-800" title={e.targetLine}>
                    {e.targetLine}
                  </td>
                  <td className="max-w-[160px] px-3 py-2 font-mono text-[11px] text-slate-600" title={e.actorLine}>
                    {e.actorLine}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-700">{e.statusLine}</td>
                  <td className="max-w-[320px] px-3 py-2 text-xs text-slate-700" title={e.summaryLine}>
                    {e.summaryLine}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {e.detailHref && e.detailLabel ? (
                      <Link
                        className="font-extrabold text-indigo-800 underline"
                        href={e.detailHref}
                        prefetch={false}
                      >
                        {e.detailLabel}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
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
