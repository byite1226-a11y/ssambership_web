import Link from "next/link";
import type { DisputeListItem } from "@/lib/disputes/disputeListQueries";

const badge = (s: string) => {
  const u = (s || "").toLowerCase();
  if (/open|new|submitted|pend|ing|under_review|escalat/i.test(u)) return "bg-amber-100 text-amber-900";
  if (/close|resolv|done|dismiss|approved|rejected|fail/i.test(u)) return "bg-slate-200 text-slate-800";
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

const LIST_LOAD_FAIL =
  "분쟁 내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
const NO_TABLE_COPY = "분쟁·환불 현황을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.";
const EMPTY_LIST_COPY = "현재 확인할 분쟁이 없습니다.";

export function DisputesListView(props: Props) {
  const { items, detailHref, listError, table } = props;
  if (listError && !items.length) {
    return <p className="text-sm font-bold text-amber-900">{LIST_LOAD_FAIL}</p>;
  }
  if (!table) {
    void props.probe;
    void props.usedColumn;
    return <p className="text-sm text-slate-600">{NO_TABLE_COPY}</p>;
  }
  if (!items.length) {
    return <p className="text-sm text-slate-600">{EMPTY_LIST_COPY}</p>;
  }
  return (
    <div className="space-y-2 text-sm">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-2 py-2">유형</th>
              <th className="px-2 py-2">상태</th>
              <th className="px-2 py-2">관련 주문·결제</th>
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
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-extrabold ${badge(it.statusRaw)}`}>
                      {it.statusLabel}
                    </span>
                  </td>
                  <td className="max-w-[280px] truncate px-2 py-1.5 text-xs text-slate-600">{it.orderSummary}</td>
                  <td className="px-2 py-2 text-right">
                    <Link
                      className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-extrabold text-white hover:bg-slate-800"
                      href={detailHref(it.id)}
                    >
                      상세 보기
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
