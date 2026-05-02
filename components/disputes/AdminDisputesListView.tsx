import Link from "next/link";
import type { AdminDisputeListItem } from "@/lib/disputes/disputeListQueries";
import { adminDisputeStatusLabel } from "@/lib/admin/disputeLabels";
import { adminListFetchFailedCopy } from "@/lib/admin/adminDisplayError";

const badge = (s: string) => {
  const u = s.toLowerCase();
  if (/open|new|submitted|pend|ing|escalat/i.test(u)) return "bg-amber-100 text-amber-900";
  if (/under_review|review/i.test(u)) return "bg-indigo-100 text-indigo-900";
  if (/close|resolv|done|dismiss/i.test(u)) return "bg-slate-200 text-slate-800";
  return "bg-emerald-100 text-emerald-900";
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
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs text-amber-900/95">{description}</p>
      </div>
    );
  }
  if (!table) {
    const { title, description } = adminListFetchFailedCopy("disputes");
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs text-amber-900/95">{description}</p>
      </div>
    );
  }
  if (!items.length) {
    return <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">현재 표시할 분쟁이 없습니다.</p>;
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-3 py-2 font-extrabold text-slate-800">분쟁 ID</th>
              <th className="px-3 py-2 font-extrabold text-slate-800">주문·의뢰</th>
              <th className="px-3 py-2 font-extrabold text-slate-800">제출·당사자</th>
              <th className="px-3 py-2 font-extrabold text-slate-800">상태</th>
              <th className="px-3 py-2 font-extrabold text-slate-800">요약</th>
              <th className="px-3 py-2 font-extrabold text-slate-800">생성 / 수정</th>
              <th className="min-w-[100px] px-3 py-2 font-extrabold text-slate-800" />
            </tr>
          </thead>
          <tbody>
            {items
              .filter((it) => it.id && it.id !== "—")
              .map((it) => {
                const idPv = previewId(it.id);
                const st = adminDisputeStatusLabel(it.statusRaw || it.statusLabel);
                return (
                  <tr key={it.id} className="border-b border-slate-100 last:border-0">
                    <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs text-slate-800" title={idPv.title}>
                      {idPv.display}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-2 text-xs text-slate-700" title={it.orderRef !== "—" ? it.orderRef : undefined}>
                      {it.orderRef}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-xs text-slate-700" title={it.actorSummary}>
                      {it.actorSummary}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-extrabold ${badge(it.statusRaw || it.statusLabel)}`}>{st}</span>
                    </td>
                    <td className="max-w-[260px] truncate px-3 py-2 text-xs text-slate-700" title={it.summaryReason !== "—" ? it.summaryReason : undefined}>
                      {it.summaryReason}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                      <div>{it.createdAt}</div>
                      <div className="text-slate-400">{it.updatedAt}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-extrabold text-white hover:bg-slate-800"
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
