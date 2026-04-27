import Link from "next/link";
import type { DisputeListItem } from "@/lib/disputes/disputeListQueries";

const badge = (s: string) => {
  const u = s.toLowerCase();
  if (/open|new|submitted|pend|ing/i.test(u)) return "bg-amber-100 text-amber-900";
  if (/close|resolv|done|approved|rejected|fail/i.test(u)) return "bg-slate-200 text-slate-800";
  return "bg-emerald-100 text-emerald-900";
};

type Props = {
  items: DisputeListItem[];
  detailHref: (id: string) => string;
  listError: string | null;
  usedColumn: string | null;
  table: string | null;
  probe: string;
};

export function DisputesListView(props: Props) {
  const { items, detailHref, listError, usedColumn, table, probe } = props;
  if (listError && !items.length) {
    return <p className="text-sm font-bold text-amber-900">조회: {listError}</p>;
  }
  if (!table) {
    return <p className="text-sm text-slate-600">disputes 계열 테이블을 읽을 수 없습니다. {listError}</p>;
  }
  if (!items.length) {
    return <p className="text-sm text-slate-600">내 분쟁·신청 0건. (필터: {usedColumn ?? "—"}) {probe}</p>;
  }
  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-slate-500">
        {table} · {usedColumn ? `user 필터: ${usedColumn}` : "—"} · {probe}
      </p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-2 py-2">유형</th>
              <th className="px-2 py-2">상태</th>
              <th className="px-2 py-2">주문/결제</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {items
              .filter((it) => it.id && it.id !== "—")
              .map((it) => (
                <tr key={it.id} className="border-b border-slate-100 last:border-0">
                  <td className="max-w-[160px] px-2 py-2 text-slate-800">{it.typeLabel}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-extrabold ${badge(it.statusLabel)}`}>
                      {it.statusLabel}
                    </span>
                  </td>
                  <td className="max-w-[280px] truncate px-2 py-1.5 text-xs text-slate-600">{it.orderSummary}</td>
                  <td className="px-2 py-2 text-right">
                    <Link
                      className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-extrabold text-white hover:bg-slate-800"
                      href={detailHref(it.id)}
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
