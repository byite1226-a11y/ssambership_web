import Link from "next/link";
import type { AdminDisputeListItem } from "@/lib/disputes/disputeListQueries";
import { adminDisputeStatusLabel } from "@/lib/admin/disputeLabels";
import { adminListFetchFailedCopy } from "@/lib/admin/adminDisplayError";

const badge = (s: string) => {
  const u = s.toLowerCase();
  if (/open|new|submitted|pend|ing|escalat/i.test(u)) return "bg-amber-50 text-amber-700 border-amber-100";
  if (/under_review|review/i.test(u)) return "bg-indigo-50 text-indigo-700 border-indigo-100";
  if (/close|resolv|done|dismiss/i.test(u)) return "bg-slate-50 text-slate-600 border-slate-100";
  return "bg-blue-50 text-blue-700 border-blue-100";
};

function previewId(raw: string, max = 10): { display: string; title: string } {
  const s = raw.trim();
  if (!s) return { display: "—", title: "" };
  if (s.length <= max) return { display: s, title: s };
  return { display: `${s.slice(0, max)}…`, title: s };
}

type Props = {
  items: AdminDisputeListItem[];
  listError: string | null;
  table: string | null;
  probe: string;
};

export function AdminDisputesListView(props: Props) {
  const { items, listError, table, probe: _probe } = props;
  void _probe;

  if (listError && !items.length) {
    const { title, description } = adminListFetchFailedCopy("disputes");
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 text-sm text-red-950">
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-xs text-red-900/90">{description}</p>
      </div>
    );
  }
  if (!table) {
    const { title, description } = adminListFetchFailedCopy("disputes");
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-600">
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-8 text-center text-sm text-slate-500">
        현재 표시할 분쟁이 없습니다.
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-4 text-sm">
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">분쟁 목록</h2>
          <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded">
            {items.length}건
          </span>
        </div>
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/60 bg-slate-50/30">
              <th className="px-5 py-3 text-xs font-bold text-slate-600">분쟁 ID</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">주문·의뢰</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">제출·당사자</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">상태</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">요약</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">생성 / 수정</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items
              .filter((it) => it.id && it.id !== "—")
              .map((it) => {
                const idPv = previewId(it.id);
                const st = adminDisputeStatusLabel(it.statusRaw || it.statusLabel);
                return (
                  <tr key={it.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="max-w-[120px] truncate px-5 py-4 font-mono text-xs font-medium text-slate-800" title={idPv.title}>
                      {idPv.display}
                    </td>
                    <td className="max-w-[140px] truncate px-5 py-4 text-xs font-medium text-slate-600" title={it.orderRef !== "—" ? it.orderRef : undefined}>
                      {it.orderRef}
                    </td>
                    <td className="max-w-[220px] truncate px-5 py-4 text-xs font-medium text-slate-600" title={it.actorSummary}>
                      {it.actorSummary}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block border rounded-lg px-2.5 py-1 text-xs font-bold ${badge(it.statusRaw || it.statusLabel)}`}
                        title={st}
                      >
                        {st}
                      </span>
                    </td>
                    <td className="max-w-[260px] truncate px-5 py-4 text-xs font-medium text-slate-600" title={it.summaryReason !== "—" ? it.summaryReason : undefined}>
                      {it.summaryReason}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500 leading-relaxed">
                      <div>{it.createdAt}</div>
                      <div className="text-slate-400 text-[10px]">{it.updatedAt}</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        className="inline-flex min-h-[36px] items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
                        href={`/admin/disputes/${encodeURIComponent(it.id)}`}
                        title="분쟁 상세·처리 화면으로 이동합니다."
                      >
                        상세 보기
                      </Link>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
