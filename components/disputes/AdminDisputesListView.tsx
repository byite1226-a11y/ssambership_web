import Link from "next/link";
import type { AdminDisputeListItem } from "@/lib/disputes/disputeListQueries";
import { adminListFetchFailedCopy } from "@/lib/admin/adminDisplayError";

const badge = (s: string) => {
  const u = s.toLowerCase();
  if (/open|new|submitted|pend|ing/i.test(u)) return "bg-amber-100 text-amber-900";
  if (/close|resolv|done|approved|rejected|fail/i.test(u)) return "bg-slate-200 text-slate-800";
  return "bg-emerald-100 text-emerald-900";
};

type Props = {
  items: AdminDisputeListItem[];
  listError: string | null;
  table: string | null;
  probe: string;
};

/**
 * 관리자 분쟁 목록 — 학생용 목록과 유사한 배지·상세 이동 패턴
 */
export function AdminDisputesListView(props: Props) {
  const { items, listError, table, probe: _probe } = props;
  void _probe;
  if (listError && !items.length) {
    const { title, description } = adminListFetchFailedCopy("default");
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-950">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs text-amber-900/95">{description}</p>
      </div>
    );
  }
  if (!table) {
    const { title, description } = adminListFetchFailedCopy("default");
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-950">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs text-amber-900/95">{description}</p>
      </div>
    );
  }
  if (!items.length) {
    return <p className="text-sm text-slate-600">진행 중인 분쟁이 없습니다.</p>;
  }
  return (
    <div className="space-y-2 text-sm">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-2 py-2">사건 제목·유형</th>
              <th className="px-2 py-2">상태</th>
              <th className="px-2 py-2">신청·학생·멘토</th>
              <th className="px-2 py-2">주문·결제·구독</th>
              <th className="px-2 py-2">생성 / 수정</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {items
              .filter((it) => it.id && it.id !== "—")
              .map((it) => (
                <tr key={it.id} className="border-b border-slate-100 last:border-0">
                  <td className="max-w-[200px] px-2 py-2 text-slate-800">
                    <span className="line-clamp-2 font-bold">{it.titleLine}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">유형: {it.typeLabel}</span>
                  </td>
                  <td className="px-2 py-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-extrabold ${badge(it.statusLabel)}`}>
                      {it.statusLabel}
                    </span>
                  </td>
                  <td className="max-w-[220px] truncate px-2 py-2 text-xs text-slate-700">{it.actorSummary}</td>
                  <td className="max-w-[260px] truncate px-2 py-2 text-xs text-slate-600">{it.orderSummary}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-xs text-slate-600">
                    <div>{it.createdAt}</div>
                    <div className="text-slate-400">{it.updatedAt}</div>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <Link
                      className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-extrabold text-white hover:bg-slate-800"
                      href={`/admin/disputes/${encodeURIComponent(it.id)}`}
                    >
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
