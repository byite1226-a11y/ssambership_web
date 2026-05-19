import Link from "next/link";
import type { MentorPayoutsBundle } from "@/lib/mentor/mentorPayoutsQueries";
import { formatKrwWon } from "@/lib/mentor/mentorPayoutsQueries";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";
import {
  Coins,
  CheckCircle2,
  AlertCircle,
  Calendar,
  TrendingUp,
  Briefcase,
  Info,
  Clock,
  ArrowUpRight
} from "lucide-react";

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
  if (typeof v === "object") {
    if (Array.isArray(v)) return v.length ? `${v.length}개 항목` : "—";
    return "[상세]";
  }
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

function rawAmount(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }
  return 0;
}

export function MentorPayoutsBody({ bundle }: { bundle: MentorPayoutsBundle }) {
  const keys = bundle.tableRows[0] ? Object.keys(bundle.tableRows[0]).slice(0, 6) : [];
  const sp = bundle.settlementPayouts;
  if (sp.error) {
    console.error("[MentorPayoutsBody] settlementPayouts.error", sp.error);
  }

  const holdLines = sp.lines.filter(({ settlement }) => String(settlement.status ?? "").toLowerCase() === "on_hold");
  const holdAmount = holdLines.reduce((sum, { settlement }) => sum + rawAmount(settlement.mentor_amount), 0);

  return (
    <div className="mx-auto max-w-6xl pb-12 text-sm text-slate-800">
      {sp.loadedVia === "service_role" ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-xs font-bold text-amber-950 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            일시적으로 보조 조회로 불러왔습니다. 표시되는 금액과 링크는 본인에게 배정된 정산만 포함됩니다.
          </p>
        </div>
      ) : null}

      {sp.error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900" role="alert">
          {USER_UI_LOAD_FAILED}
        </div>
      ) : null}

      {/* 2-Column Console Layout */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
        {/* LEFT COLUMN: Summary cards + Detailed table */}
        <div className="lg:col-span-8 min-w-0 space-y-6">
          
          {/* Payout Summary Card Group */}
          <div className="space-y-4">
            <h2 className="text-[16px] font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Coins className="h-4.5 w-4.5 text-[#142d61]" />
              정산 요약
            </h2>
            
            {/* Primary Metrics (Large key cards) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.015)] transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">정산 예정 금액</span>
                  <div className="rounded-lg bg-indigo-50/70 p-2 text-[#142d61]">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black tracking-tight text-[#142d61] tabular-nums">
                  {formatKrwWon(sp.totals.expectedMentorAmount)}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">학생의 납품 완료 후 정산 확정 예정 금액</p>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.015)] transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">정산 완료 금액</span>
                  <div className="rounded-lg bg-slate-50 p-2 text-slate-600 border border-slate-100">
                    <CheckCircle2 className="h-4 w-4 text-slate-600" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                  {formatKrwWon(sp.totals.paidMentorAmount)}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">멘토님 계좌로 지급 처리가 완료된 금액</p>
              </div>
            </div>

            {/* Auxiliary Metrics (Compact support cards) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">정산 건수</p>
                <p className="mt-1 text-lg font-black text-slate-800 tabular-nums">{sp.totals.count}건</p>
              </div>

              <div className={`rounded-xl border p-4 shadow-sm transition ${holdLines.length ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white'}`}>
                <p className={`text-[10px] font-bold tracking-wide uppercase ${holdLines.length ? 'text-amber-800' : 'text-slate-400'}`}>보류 금액</p>
                <p className={`mt-1 text-lg font-black tabular-nums ${holdLines.length ? 'text-amber-950' : 'text-slate-800'}`}>
                  {holdLines.length ? formatKrwWon(holdAmount) : "0원"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">맞춤의뢰 주문</p>
                <p className="mt-1 text-lg font-black text-slate-800 tabular-nums">{bundle.customSummary.n || 0}건</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">구독 수익 건수</p>
                <p className="mt-1 text-lg font-black text-slate-800 tabular-nums">{bundle.subSummary.n || 0}건</p>
              </div>
            </div>
          </div>

          {/* Detailed table list */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col">
              <h2 className="text-[16px] font-black text-slate-900 tracking-tight">주문별 정산 상세 내역</h2>
              <p className="mt-1 text-[13px] text-slate-400 font-medium">완료 및 수락된 주문 건들의 세부 정산서 목록입니다.</p>
            </div>

            {!sp.error && sp.lines.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <Clock className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                <p className="text-[14px] font-black text-slate-700">표시할 정산 내역이 없습니다</p>
                <p className="mt-1.5 text-[12px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                  학생이 맞춤의뢰 작업물의 최종 납품을 수락하고 거래가 확정되면 정산서가 자동으로 생성됩니다.
                </p>
              </div>
            ) : null}

            {sp.lines.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">주문 정보</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">정산 상태</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">멘토 정산액</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">주문 / 수수료 상세</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {sp.lines.map(({ settlement: r, workroomHref, orderStatusLabel, orderPaymentLabel }) => {
                      const oid = typeof r.custom_request_order_id === "string" ? r.custom_request_order_id : "";
                      const shortOid = oid.length > 12 ? `${oid.slice(0, 6)}…${oid.slice(-4)}` : oid || "—";
                      return (
                        <tr key={String(r.id ?? oid)} className="hover:bg-slate-50/40 transition-colors">
                          {/* 1. 주문 정보 (아이디 + 일시) */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-mono text-[11px] font-black text-slate-700" title={oid || undefined}>
                                {shortOid}
                              </span>
                              <span className="mt-1 text-[11px] font-semibold text-slate-400">
                                {formatTs(r.created_at)}
                              </span>
                            </div>
                          </td>
                          {/* 2. 정산 상태 (뱃지 + 결제정보) */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-black text-slate-700 whitespace-nowrap">
                                {settlementStatusLabelKo(r.status)}
                              </span>
                              <div className="flex flex-col text-[10px] font-semibold text-slate-400 leading-tight">
                                {orderStatusLabel && <span>주문: {orderStatusLabel}</span>}
                                {orderPaymentLabel && <span>결제: {orderPaymentLabel}</span>}
                              </div>
                            </div>
                          </td>
                          {/* 3. 멘토 정산액 */}
                          <td className="px-4 py-3.5 font-black text-slate-900 tabular-nums">
                            {intCell(r.mentor_amount)}
                          </td>
                          {/* 4. 주문 및 수수료 상세 */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col text-[11px] text-slate-500">
                              <span className="font-medium text-slate-700">주문가: {intCell(r.gross_amount)}</span>
                              <span className="mt-0.5 text-slate-400">
                                수수료: {intCell(r.platform_fee_amount)} ({formatFeeRate(r.fee_rate)})
                              </span>
                            </div>
                          </td>
                          {/* 5. 관리 (주문방 바로가기) */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            {oid ? (
                              <Link
                                href={workroomHref}
                                className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                              >
                                주문방 열기
                                <ArrowUpRight className="h-3 w-3 text-slate-400" />
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
          </div>
        </div>

        {/* RIGHT COLUMN: Period card, other payouts, guidelines */}
        <aside className="lg:col-span-4 min-w-0 space-y-4">
          
          {/* Payout Period Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-[#142d61]" />
              <h3 className="text-[13px] font-black text-slate-900">정산 및 산정 정보</h3>
            </div>
            
            <div className="space-y-3 pt-1">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">정산 산정 기간</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{bundle.periodStart.slice(0, 10)}</span>
                  <span>~</span>
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{bundle.periodEnd.slice(0, 10)}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">이번 달 예상 정산액</p>
                <p className="mt-1.5 text-xl font-black text-slate-900 tabular-nums">
                  {bundle.payoutError && !bundle.payoutTable ? "—" : bundle.monthExpectedCents}
                  <span className="ml-1 text-xs font-bold text-slate-500">원</span>
                </p>
              </div>
            </div>
          </div>

          {/* Other payout details */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Briefcase className="h-4.5 w-4.5 text-slate-500" />
              <h3 className="text-[13px] font-black text-slate-900">기타 지급·정산 내역</h3>
            </div>

            {bundle.tableRows[0] ? (
              <p className="text-[11px] font-semibold text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/70">
                <span className="font-extrabold text-slate-800">최근 지급 상태:</span> {pickPayoutStatus(bundle.tableRows[0] as Row)}
              </p>
            ) : null}

            {!bundle.tableRows.length ? (
              <div className="py-6 text-center">
                <p className="text-[12px] font-bold text-slate-700">지급 내역 없음</p>
                <p className="mt-1 text-[11px] text-slate-400 leading-normal">추가 지급 데이터가 연결되면<br />여기에 표시됩니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[280px] text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150">
                      {keys.map((k) => (
                        <th key={k} className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bundle.tableRows.map((r: Row, i) => (
                      <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                        {keys.map((k) => (
                          <td key={k} className="max-w-[100px] truncate px-2 py-1.5 text-[11px] font-semibold text-slate-600">
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

          {/* Guidelines Notice */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-[#142d61] shrink-0" />
              <h3 className="text-[12px] font-black text-slate-900">정산 안내 사항</h3>
            </div>
            <ul className="space-y-2 text-[11px] leading-relaxed text-slate-500 font-semibold">
              <li className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#142d61]" />
                <span>정산 예정 금액은 학생의 구매 확정 단계에서 보류 해제 및 지급 가능 상태로 자동 갱신됩니다.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#142d61]" />
                <span>지급 처리는 산정 기간 마감 및 정산 주기에 따라 영업일 기준 3일 이내에 송금 처리됩니다.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#142d61]" />
                <span>상세 매출 통계 및 소득세 정산 자료 출력이 필요한 경우 쌤버십 고객센터로 문의해 주시기 바랍니다.</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
