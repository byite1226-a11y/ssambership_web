import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { createClient } from "@/lib/supabase/server";
import { loadAdminRefundsList } from "@/lib/admin/adminQueries";
import { approveAdminRefundAction, rejectAdminRefundAction } from "@/lib/admin/refundActions";

type Row = Record<string, unknown>;

function safeDecodeParam(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function pickStatus(row: Row): string {
  const v = row.status ?? row.refund_status ?? row.state;
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function refundStatusLabel(s: string): string {
  switch (s) {
    case "pending":
      return "대기";
    case "succeeded":
      return "승인 완료";
    case "rejected":
      return "거절";
    case "canceled":
    case "cancelled":
      return "취소";
    default:
      return s || "—";
  }
}

function isPendingRefund(row: Row): boolean {
  return pickStatus(row) === "pending";
}

function isTerminalRefund(row: Row): boolean {
  const s = pickStatus(row);
  return s === "succeeded" || s === "rejected" || s === "canceled" || s === "cancelled";
}

function firstString(row: Row, keys: readonly string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminRefundsPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const r = sp.refundId;
  const focusRefundId =
    typeof r === "string" && r
      ? r
      : Array.isArray(r) && r[0] && typeof r[0] === "string"
        ? r[0]
        : null;

  const okParam = sp.ok;
  const errParam = sp.error;
  const flashOk = typeof okParam === "string" ? okParam : Array.isArray(okParam) ? okParam[0] : null;
  const flashErr = typeof errParam === "string" ? errParam : Array.isArray(errParam) ? errParam[0] : null;

  const supabase = await createClient();
  const list = await loadAdminRefundsList(supabase, 50);
  const rows = (list.rows as Row[]) ?? [];

  return (
    <PageScaffold
      eyebrow="Admin / Refunds"
      title="환불 관리"
      description="환불 요청을 검토하고 승인 또는 거절할 수 있습니다."
      ctas={[
        { href: "/admin/disputes", label: "분쟁", tone: "blue" },
        { href: "/admin/settlements", label: "정산", tone: "slate" },
        { href: "/admin", label: "대시보드", tone: "slate" },
      ]}
      sections={[]}
      emptyState=""
      dataPoints={[]}
      hideFooterPlaceholderCards
    >
      <div className="space-y-4">
        {flashOk ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm font-semibold text-emerald-950">
            {safeDecodeParam(flashOk)}
          </p>
        ) : null}
        {flashErr ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 p-3 text-sm font-semibold text-red-950">
            {safeDecodeParam(flashErr)}
          </p>
        ) : null}

        {focusRefundId ? (
          <p className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-3 text-sm text-indigo-950">
            분쟁 연동에서 연 환불 ID <code className="font-mono text-indigo-900">{focusRefundId}</code> — 아래 목록의 id와 일치하는지 확인하세요.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">환불 요청 목록</span>
          <AdminStatusBadge result={list} />
        </div>

        {list.error && !rows.length ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm font-semibold text-amber-950">
            Supabase: {list.error}
          </div>
        ) : null}

        {!list.table ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">refunds 테이블을 읽을 수 없습니다.</p>
        ) : !rows.length ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">대기 중인 환불 요청이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <p className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">{list.sourceNote}</p>
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-2 py-2 font-extrabold text-slate-800">id</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">user_id</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">amount_cents</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">상태</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">payment_id</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">custom_request_order_id</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">created_at</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">처리</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const refundIdValue =
                    typeof row.id === "string" ? row.id : row.id != null ? String(row.id) : "";
                  const rowKey = refundIdValue || `row-${i}`;
                  const disputeHref = firstString(row, ["dispute_id", "case_id"]);
                  const pending = isPendingRefund(row);
                  const terminal = isTerminalRefund(row);
                  const st = pickStatus(row);
                  return (
                    <tr key={rowKey} className="border-b border-slate-100 last:border-0">
                      <td className="max-w-[200px] truncate px-2 py-1.5 font-mono text-xs text-slate-800">{cell(row.id)}</td>
                      <td className="max-w-[200px] truncate px-2 py-1.5 font-mono text-xs text-slate-800">{cell(row.user_id)}</td>
                      <td className="px-2 py-1.5 text-slate-800">{cell(row.amount_cents)}</td>
                      <td className="px-2 py-1.5 text-slate-800">{refundStatusLabel(st)}</td>
                      <td className="max-w-[180px] truncate px-2 py-1.5 font-mono text-xs text-slate-800">{cell(row.payment_id)}</td>
                      <td className="max-w-[180px] truncate px-2 py-1.5 font-mono text-xs text-slate-800">{cell(row.custom_request_order_id)}</td>
                      <td className="px-2 py-1.5 text-slate-800">{cell(row.created_at)}</td>
                      <td className="px-2 py-2 align-top">
                        {pending && refundIdValue ? (
                          <form className="flex min-w-[280px] flex-col gap-2">
                            <input type="hidden" name="refundId" value={refundIdValue} />
                            <input
                              type="text"
                              name="adminNote"
                              placeholder="메모(선택)"
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800"
                              autoComplete="off"
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="submit"
                                formAction={approveAdminRefundAction}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                              >
                                환불 승인
                              </button>
                              <button
                                type="submit"
                                formAction={rejectAdminRefundAction}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                              >
                                환불 거절
                              </button>
                            </div>
                          </form>
                        ) : terminal ? (
                          <span className="text-xs text-slate-500">{refundStatusLabel(st)}</span>
                        ) : (
                          <span className="text-xs text-amber-800">알 수 없는 상태: {cell(row.status)}</span>
                        )}
                        {disputeHref ? (
                          <p className="mt-1 text-xs">
                            <Link
                              className="font-bold text-indigo-800 underline"
                              href={`/admin/disputes/${encodeURIComponent(disputeHref)}`}
                              prefetch={false}
                            >
                              분쟁
                            </Link>
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageScaffold>
  );
}
