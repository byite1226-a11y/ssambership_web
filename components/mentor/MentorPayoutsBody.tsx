import Link from "next/link";
import type { MentorPayoutsBundle } from "@/lib/mentor/mentorPayoutsQueries";
import { formatKrwWon } from "@/lib/mentor/mentorPayoutsQueries";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

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

function formatFeeRate(raw: unknown): string {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return "—";
  if (n >= 0 && n <= 1) {
    return `${(n * 100).toFixed(1)}%`;
  }
  return `${n}%`;
}

function formatTs(v: unknown): string {
  if (v == null || v === "") return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) {
    return String(v);
  }
  return d.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

function settlementStatusLabelKo(status: unknown): string {
  const s = String(status ?? "").trim().toLowerCase();
  const map: Record<string, string> = {
    pending: "정산 예정",
    on_hold: "보류",
    payable: "지급 가능",
    paid: "지급 완료",
    cancelled: "취소",
  };
  return map[s] ?? (s || "—");
}

function intCell(v: unknown): string {
  if (typeof v === "number" && Number.isFinite(v)) return formatKrwWon(Math.trunc(v));
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return formatKrwWon(Math.trunc(n));
  }
  return "—";
}

export function MentorPayoutsBody({ bundle }: { bundle: MentorPayoutsBundle }) {
  const keys = bundle.tableRows[0] ? Object.keys(bundle.tableRows[0]).slice(0, 6) : [];
  const sp = bundle.settlementPayouts;
  if (sp.error) {
    console.error("[MentorPayoutsBody] settlementPayouts.error", sp.error);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 text-sm text-slate-800">
      <section className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-1">맞춤의뢰 정산 현황</h2>
        {sp.loadedVia === "service_role" ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-950">
            일시적으로 대체 조회 경로로 불러왔습니다. 표시되는 금액과 링크는 본인에게 배정된 정산만 포함됩니다.
          </p>
        ) : null}
        {sp.error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900" role="alert">
            {USER_UI_LOAD_FAILED}
          </p>
        ) : null}

        {/* Dashboard Grid for payouts */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold text-slate-400">정산 예정</p>
            <p className="mt-2 text-2xl font-black text-blue-600 tabular-nums">{formatKrwWon(sp.totals.expectedMentorAmount)}</p>
            <p className="mt-1.5 text-xs text-slate-400">지급 전 · 보류 · 지급 가능 합계</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold text-blue-600">정산 완료</p>
            <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">{formatKrwWon(sp.totals.paidMentorAmount)}</p>
            <p className="mt-1.5 text-xs text-blue-600/80">지급이 완료된 금액 합계</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold text-slate-400">정산 건수</p>
            <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">{sp.totals.count}</p>
            <p className="mt-1.5 text-xs text-slate-400">표시 중인 전체 정산 건수</p>
          </div>
        </div>

        {!sp.error && sp.lines.length === 0 ? (
          <p className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-sm text-slate-500 text-center font-medium">
            정산 데이터가 아직 없습니다. 학생이 납품을 수락하면 정산 예정이 표시될 수 있어요.
          </p>
        ) : null}

        {sp.lines.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm mt-5">
            <p className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-xs font-bold text-slate-700">주문별 정산 상세 내역</p>
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-xs font-bold text-slate-600">정산 상태</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600">멘토 정산액</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600">주문 금액</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600">플랫폼 수수료</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600">수수료율</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600">생성일</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600">지급일</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600">주문 번호</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600">주문 상태</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600">결제</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sp.lines.map(({ settlement: r, workroomHref, orderStatusLabel, orderPaymentLabel }) => {
                  const oid = typeof r.custom_request_order_id === "string" ? r.custom_request_order_id : "";
                  const shortOid = oid.length > 20 ? `${oid.slice(0, 8)}…${oid.slice(-4)}` : oid || "—";
                  return (
                    <tr key={String(r.id ?? oid)} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-4 py-3 text-xs">
                        <span className="font-bold text-blue-700 bg-blue-50/60 px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                          {settlementStatusLabelKo(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-black text-slate-900">{intCell(r.mentor_amount)}</td>
                      <td className="px-4 py-3 text-xs tabular-nums">{intCell(r.gross_amount)}</td>
                      <td className="px-4 py-3 text-xs tabular-nums">{intCell(r.platform_fee_amount)}</td>
                      <td className="px-4 py-3 text-xs tabular-nums">{formatFeeRate(r.fee_rate)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatTs(r.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatTs(r.paid_at)}</td>
                      <td className="max-w-[140px] truncate px-4 py-3 font-mono text-[11px] text-slate-600" title={oid || undefined}>
                        {shortOid}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{orderStatusLabel}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{orderPaymentLabel}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {oid ? (
                          <Link
                            href={workroomHref}
                            className="inline-flex min-h-[36px] items-center text-xs font-bold text-blue-600 hover:underline"
                          >
                            주문방 열기
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {/* Additional references in Grid */}
      <section className="space-y-4 border-t border-slate-100 pt-6">
        <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-1">정산 참고 정보</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400">이번 달 예상 정산</p>
            <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
              {bundle.payoutError && !bundle.payoutTable ? "—" : bundle.monthExpectedCents}
              <span className="text-sm font-extrabold text-slate-500 ml-1">원</span>
            </p>
            <p className="mt-2 text-xs font-medium text-slate-400">
              {new Date(bundle.periodStart).toLocaleDateString("ko")} – {new Date(bundle.periodEnd).toLocaleDateString("ko")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400">구독·수익 요약</p>
            <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">{bundle.subSummary.n}건</p>
            <p className="mt-2 text-xs text-slate-500">{bundle.subSummary.amountHint}</p>
            {bundle.subSummary.error ? <p className="text-xs text-red-600 mt-1">{bundle.subSummary.error}</p> : null}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400">맞춤의뢰 주문 수</p>
            <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">{bundle.customSummary.n}건</p>
            <p className="mt-2 text-xs text-slate-500">{bundle.customSummary.amountHint}</p>
            {bundle.customSummary.error ? <p className="text-xs text-red-600 mt-1">{bundle.customSummary.error}</p> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs font-medium text-slate-600">
          <span className="font-bold text-slate-700 bg-slate-200/50 px-2.5 py-1 rounded-lg">정산 산정 기간</span>
          <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-semibold">{bundle.periodStart.slice(0, 10)}</span>
          <span>~</span>
          <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-semibold">{bundle.periodEnd.slice(0, 10)}</span>
        </div>

        {bundle.tableRows[0] ? (
          <p className="text-sm font-semibold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="font-extrabold text-slate-800">최근 지급 상태:</span> {pickPayoutStatus(bundle.tableRows[0] as Row)}
          </p>
        ) : null}

        <div>
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-2">기타 지급·정산 내역</h3>
          <p className="text-xs text-slate-500 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100 mb-3">{bundle.tableHint}</p>
          {!bundle.tableRows.length ? (
            <p className="mt-2 text-sm text-slate-400 bg-slate-50/40 p-4 rounded-xl border border-dashed border-slate-200 text-center">
              표시할 추가 지급 내역이 없습니다.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200">
                    {keys.map((k) => (
                      <th key={k} className="px-3 py-2 text-xs font-bold text-slate-700">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bundle.tableRows.map((r: Row, i) => (
                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                      {keys.map((k) => (
                        <td key={k} className="max-w-[160px] truncate px-3 py-2 text-xs font-medium text-slate-700">
                          {cell(r[k])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
