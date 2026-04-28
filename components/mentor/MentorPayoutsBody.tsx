import type { MentorPayoutsBundle } from "@/lib/mentor/mentorPayoutsQueries";
import { shortOrderIdForDisplay } from "@/lib/utils/formatOrderIdForDisplay";

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

/** 맞춤의뢰 정산 예정 테이블 `status` 한글 라벨 */
function settlementStatusLabelKo(raw: string): string {
  if (!raw || raw === "—") return raw;
  const s = raw.trim().toLowerCase();
  const map: Record<string, string> = {
    pending: "정산 검토 중",
    paid: "지급 완료",
    cancelled: "정산 취소",
    on_hold: "보류",
    payable: "지급 가능",
  };
  return map[s] ?? raw;
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

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
        <h3 className="text-sm font-extrabold text-slate-800">맞춤의뢰 · 정산 예정</h3>
        <p className="mt-1 text-xs text-slate-600">실제 지급·PG 연동 전까지는 &quot;예정&quot;·&quot;처리 예정&quot; 단계로 표시됩니다.</p>
        {bundle.customOrderSettlements.error ? (
          <p className="mt-2 text-xs text-amber-800">{bundle.customOrderSettlements.error}</p>
        ) : bundle.customOrderSettlements.rows.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">아직 정산 예정 내역이 없습니다.</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs">
                  <th className="px-2 py-1.5 font-extrabold text-slate-800">주문</th>
                  <th className="px-2 py-1.5 font-extrabold text-slate-800">총액</th>
                  <th className="px-2 py-1.5 font-extrabold text-slate-800">플랫폼</th>
                  <th className="px-2 py-1.5 font-extrabold text-slate-800">멘토(예정)</th>
                  <th className="px-2 py-1.5 font-extrabold text-slate-800">상태</th>
                  <th className="px-2 py-1.5 font-extrabold text-slate-800">생성</th>
                  <th className="px-2 py-1.5 font-extrabold text-slate-800">지급</th>
                </tr>
              </thead>
              <tbody>
                {bundle.customOrderSettlements.rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 text-xs">
                    <td className="px-2 py-1.5 font-mono text-slate-800">{shortOrderIdForDisplay(r.custom_request_order_id)}</td>
                    <td className="px-2 py-1.5">{r.gross_amount.toLocaleString("ko-KR")}</td>
                    <td className="px-2 py-1.5">{r.platform_fee_amount.toLocaleString("ko-KR")}</td>
                    <td className="px-2 py-1.5 font-semibold text-slate-900">{r.mentor_amount.toLocaleString("ko-KR")}</td>
                    <td className="px-2 py-1.5 align-top">
                      <span>{settlementStatusLabelKo(r.status)}</span>
                      {r.showUnpaidOrderWarning ? (
                        <p className="mt-0.5 max-w-[16rem] text-[10px] font-medium leading-snug text-amber-800">
                          결제 확인 전 테스트 주문입니다. 실제 지급은 결제 확인 후 진행됩니다.
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600">
                      {r.created_at ? new Date(r.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600">
                      {r.paid_at ? new Date(r.paid_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
