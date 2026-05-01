import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { createClient } from "@/lib/supabase/server";
import { loadAdminRefundsList } from "@/lib/admin/adminQueries";
import { approveAdminRefundAction, rejectAdminRefundAction } from "@/lib/admin/refundActions";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";

type Row = Record<string, unknown>;

const ID_PREVIEW_LEN = 10;

function cell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** UUID 등 긴 문자열: 화면은 짧게, 전체는 title */
function previewId(raw: unknown, maxLen = ID_PREVIEW_LEN): { display: string; title: string | undefined } {
  const s = raw == null ? "" : String(raw).trim();
  if (!s) return { display: "—", title: undefined };
  if (s.length <= maxLen) return { display: s, title: s };
  return { display: `${s.slice(0, maxLen)}…`, title: s };
}

function pickFirst(row: Row, keys: readonly string[]): unknown {
  for (const k of keys) {
    if (k in row) return row[k];
  }
  return undefined;
}

function pickStatus(row: Row): string {
  const v = pickFirst(row, ["status", "refund_status", "state"]);
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
      if (!s) return "—";
      return `${s} (확인 필요)`;
  }
}

function isPendingRefund(row: Row): boolean {
  return pickStatus(row) === "pending";
}

function firstString(row: Row, keys: readonly string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

function formatWonAmount(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number" && Number.isFinite(v)) {
    return `${new Intl.NumberFormat("ko-KR").format(Math.round(v))}원`;
  }
  const s = String(v).replace(/,/g, "").trim();
  const n = Number(s);
  if (!Number.isFinite(n)) return "—";
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(n))}원`;
}

function formatRequestedAt(v: unknown): string {
  const s = cell(v);
  if (s === "—") return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(d);
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
      eyebrow="관리자 / 환불"
      title="환불 관리"
      description="환불 요청을 검토하고 승인 또는 거절할 수 있습니다. 실제 PG·계좌 환불 반영은 결제 연동 상태에 따라 별도 확인이 필요할 수 있습니다."
      ctas={[
        { href: "/admin/disputes", label: "분쟁 관리", tone: "blue" },
        { href: "/admin/settlements", label: "정산 관리", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "slate" },
        { href: "/admin", label: "대시보드", tone: "slate" },
      ]}
      sections={[
        {
          title: "처리 방식",
          body: "승인·거절은 이 화면에서 기록합니다. 정산·주문 상태와 맞는지 필요 시 정산·분쟁 메뉴에서 함께 확인해 주세요.",
          status: "connected",
        },
      ]}
      emptyState=""
      dataPoints={[]}
      hideFooterPlaceholderCards
    >
      <div className="space-y-4">
        {flashOk ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm font-semibold text-emerald-950">
            {flashOk}
          </p>
        ) : null}
        {flashErr ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 p-3 text-sm font-semibold text-red-950">
            {toAdminDisplayError(flashErr, "default") ?? "처리에 실패했습니다. 잠시 후 다시 시도해 주세요."}
          </p>
        ) : null}

        {focusRefundId ? (
          <p className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-3 text-sm text-indigo-950">
            연결된 환불 ID <code className="font-mono text-indigo-900">{focusRefundId}</code>와 아래 목록의 환불 ID가 같은지 확인해 주세요.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">환불 요청 목록</span>
          <AdminStatusBadge result={list} hint="최근 요청부터 최대 50건" />
        </div>

        <p className="text-sm text-slate-600">환불 요청의 결제 정보와 처리 상태를 확인할 수 있습니다.</p>

        {list.error && !rows.length ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-950">
            <p className="font-semibold">목록을 불러오지 못했습니다.</p>
            <p className="mt-1 text-xs text-amber-900/90">
              {toAdminDisplayError(list.error, "default") ?? "잠시 후 다시 시도하거나 담당자에게 문의해 주세요."}
            </p>
          </div>
        ) : null}

        {!list.table ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            환불 목록을 불러올 수 없습니다. 연결과 권한을 확인해 주세요.
          </p>
        ) : !rows.length ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">현재 대기 중인 환불 요청이 없습니다.</p>
            <p className="mt-2">환불 요청이 생성되면 이곳에서 승인 또는 거절할 수 있습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-2 py-2 font-extrabold text-slate-800">환불 ID</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">사용자</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">환불 금액</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">상태</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">결제 ID</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">맞춤의뢰 ID</th>
                  <th className="px-2 py-2 font-extrabold text-slate-800">요청일</th>
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
                  const st = pickStatus(row);
                  const idPv = previewId(row.id);
                  const userPv = previewId(pickFirst(row, ["user_id"]));
                  const payPv = previewId(pickFirst(row, ["payment_id"]));
                  const orderPv = previewId(pickFirst(row, ["custom_request_order_id"]));
                  return (
                    <tr key={rowKey} className="border-b border-slate-100 last:border-0">
                      <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs text-slate-800" title={idPv.title}>
                        {idPv.display}
                      </td>
                      <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs text-slate-800" title={userPv.title}>
                        {userPv.display}
                      </td>
                      <td className="px-2 py-1.5 text-slate-800">{formatWonAmount(pickFirst(row, ["amount_cents", "amount"]))}</td>
                      <td className="px-2 py-1.5 text-slate-800">{refundStatusLabel(st)}</td>
                      <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs text-slate-800" title={payPv.title}>
                        {payPv.display}
                      </td>
                      <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs text-slate-800" title={orderPv.title}>
                        {orderPv.display}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-slate-800">{formatRequestedAt(pickFirst(row, ["created_at"]))}</td>
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
                        ) : (
                          <span className="text-xs font-medium text-slate-500">—</span>
                        )}
                        {disputeHref ? (
                          <p className="mt-1 text-xs">
                            <Link
                              className="font-bold text-indigo-800 underline"
                              href={`/admin/disputes/${encodeURIComponent(disputeHref)}`}
                              prefetch={false}
                            >
                              분쟁 보기
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
