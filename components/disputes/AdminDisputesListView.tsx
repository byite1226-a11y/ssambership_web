import Link from "next/link";
import type { AdminDisputeListItem } from "@/lib/disputes/disputeListQueries";

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
 * 관리자 분쟁 목록 — 학생용 `DisputesListView`와 동일 배지·CTA 패턴, 컬럼만 확장
 */
export function AdminDisputesListView(props: Props) {
  const { items, listError, table, probe } = props;
  if (listError && !items.length) {
    return <p className="text-sm font-bold text-amber-900">조회: {listError}</p>;
  }
  if (!table) {
    return <p className="text-sm text-slate-600">disputes 계열 테이블을 읽을 수 없습니다. {listError}</p>;
  }
  if (!items.length) {
    return <p className="text-sm text-slate-600">분쟁 0건. {probe}</p>;
  }
  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-slate-500">
        {table} · {probe}
      </p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-2 py-2">사건 제목·유형</th>
              <th className="px-2 py-2">상태</th>
              <th className="px-2 py-2">신청·학생·멘토</th>
              <th className="px-2 py-2">주문·결제·구독(FK)</th>
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
