import type { MentorPayoutsBundle } from "@/lib/mentor/mentorPayoutsQueries";

type Row = Record<string, unknown>;

function pickPayoutStatus(r: Row | undefined): string {
  if (!r) return "—";
  for (const k of ["payout_status", "settlement_state", "status", "state", "payment_state", "transfer_status"]) {
    if (k in r && r[k] !== null && r[k] !== undefined) {
      return String(r[k]);
    }
  }
  return "—";
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function MentorPayoutsBody({ bundle }: { bundle: MentorPayoutsBundle }) {
  const keys = bundle.tableRows[0] ? Object.keys(bundle.tableRows[0]).slice(0, 6) : [];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-500">이번 달 예상·정산(원본 단위: 스키마 가정, cents 흔적)</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {bundle.payoutError && !bundle.payoutTable ? "—" : bundle.monthExpectedCents}
            <span className="text-sm font-extrabold text-slate-500">(합계)</span>
          </p>
          <p className="text-xs text-slate-500">{new Date(bundle.periodStart).toLocaleDateString("ko")} – {new Date(bundle.periodEnd).toLocaleDateString("ko")}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-500">구독 수익(건만, 금액·정책 후속)</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{bundle.subSummary.n}</p>
          <p className="text-xs text-slate-500">{bundle.subSummary.amountHint}</p>
          {bundle.subSummary.error ? <p className="text-xs text-amber-800">{bundle.subSummary.error}</p> : null}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-500">맞춤의뢰(건만, 읽기·비변경)</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{bundle.customSummary.n}</p>
          <p className="text-xs text-slate-500">{bundle.customSummary.amountHint}</p>
          {bundle.customSummary.error ? <p className="text-xs text-amber-800">{bundle.customSummary.error}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-500">
        <input disabled className="rounded border border-slate-200 bg-white px-2 py-1" placeholder="기간(시작)" value={bundle.periodStart.slice(0, 10)} readOnly />
        <span>~</span>
        <input disabled className="rounded border border-slate-200 bg-white px-2 py-1" placeholder="기간(끝)" value={bundle.periodEnd.slice(0, 10)} readOnly />
        <span className="text-xs">쿼리·필터(후속)</span>
      </div>

      {bundle.tableRows[0] ? (
        <p className="text-sm text-slate-800">
          <span className="font-extrabold">지급 상태(최신 1행)</span> {pickPayoutStatus(bundle.tableRows[0] as Row)}
        </p>
      ) : null}

      <div>
        <h3 className="text-sm font-extrabold text-slate-800">수행/지급 내역</h3>
        <p className="text-xs text-slate-500">{bundle.tableHint}</p>
        {!bundle.tableRows.length ? (
          <p className="mt-1 text-sm text-slate-600">행 없음·RLS·또는 테이블 없음. {bundle.payoutError}</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {keys.map((k) => (
                    <th key={k} className="px-2 py-1.5 text-xs font-extrabold text-slate-800">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bundle.tableRows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {keys.map((k) => (
                      <td key={k} className="max-w-[160px] truncate px-2 py-1.5 text-xs text-slate-800">
                        {cell((r as Record<string, unknown>)[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
