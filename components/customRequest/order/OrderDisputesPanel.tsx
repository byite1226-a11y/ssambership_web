import { submitCustomOrderDisputeAction } from "@/lib/customRequest/orderDisputeActions";
import { hasActiveDisputeForOrderRows } from "@/lib/customRequest/orderDisputeHelpers";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import {
  formatOrderRoomDateTime,
  orderStatusLabelForUi,
} from "@/lib/customRequest/orderLifecycleConstants";
import type { AppRole } from "@/lib/types/user";

type Row = Record<string, unknown>;

type Props = {
  detail: OrderDetailPageData;
  orderId: string;
  actorRole: AppRole;
  hasOrderPartyAccess: boolean;
  /** null이면 신청 폼 사용 가능(서버가 최종 검증) */
  openDisputeApplicationDisabledReason: string | null;
  /** 종료 주문: 분쟁 신청 폼·막힌 사유 박스 숨김(접수 내역만) */
  orderTerminal?: boolean;
  workspaceCompact?: boolean;
};

function disputeBody(r: Row) {
  return pickDisplayField(r, ["body", "reason", "description", "summary", "title", "message"]);
}

function statusLabel(r: Row) {
  const raw = pickDisplayField(r, ["status", "state", "label"]);
  if (raw === "—" || !String(raw).trim()) {
    return "—";
  }
  return orderStatusLabelForUi(String(raw));
}

export function OrderDisputesPanel({
  detail,
  orderId,
  actorRole,
  hasOrderPartyAccess,
  openDisputeApplicationDisabledReason,
  orderTerminal = false,
  workspaceCompact = false,
}: Props) {
  const u = detail.bundle.disputes;
  const rows = (u.rows ?? []) as Row[];
  const hasTable = Boolean(u.table) && !u.error;
  const canForm = (actorRole === "student" || actorRole === "mentor") && hasOrderPartyAccess && Boolean(String(orderId).trim());

  return (
    <section id="order-disputes" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-300 relative overflow-hidden text-sm text-slate-800">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">결제·납품 문제 해결</h3>
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500 leading-normal">
        {workspaceCompact
          ? "진행 중인 해결 요청이 있으면 납품·수락·수정·작업 등이 제한될 수 있습니다."
          : actorRole === "mentor"
            ? "결제, 납품, 수정 요청, 환불처럼 주문 처리와 관련된 문제가 있을 때 요청해 주세요. 접수된 요청은 운영에서 검토합니다."
            : "결제, 납품, 수정 요청, 환불처럼 주문 처리와 관련된 문제가 있을 때 의뢰자 혹은 멘토가 문제 해결을 요청할 수 있어요. 진행 중인 해결 요청이 있을 시 작업 단계가 일시 보류됩니다."}
      </p>

      {!orderTerminal && canForm && openDisputeApplicationDisabledReason == null ? (
        <form action={submitCustomOrderDisputeAction} className="mt-4 space-y-3">
          <input type="hidden" name="orderId" value={orderId} />
          <label className="sr-only" htmlFor="order-dispute-body">
            신청 내용
          </label>
          <textarea
            id="order-dispute-body"
            name="disputeBody"
            className="min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            maxLength={8000}
            placeholder="상황을 구체적으로 적어 주세요."
            required
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white hover:bg-amber-700 shadow-md shadow-amber-500/10 transition"
          >
            문제 해결 요청하기
          </button>
        </form>
      ) : !orderTerminal && canForm && openDisputeApplicationDisabledReason ? (
        <div className="mt-3 space-y-2" role="status">
          <p className="rounded-xl border border-amber-100 bg-amber-50/30 p-3 text-xs font-bold text-amber-800">
            {openDisputeApplicationDisabledReason}
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        {u.error ? (
          <p className="mt-2 text-xs font-bold text-amber-800">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : null}
        {workspaceCompact && hasTable && rows.length > 0 ? (
          <details className="group mt-1">
            <summary className="cursor-pointer list-none text-xs font-extrabold text-slate-500 marker:hidden [&::-webkit-details-marker]:hidden flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-slate-400 group-open:rotate-90 transition-transform">▸</span> 문제 해결 요청 내역 ({rows.length})
              </span>
            </summary>
            <ul className="mt-3 max-h-60 space-y-2.5 overflow-y-auto">
              {rows.map((r, i) => {
                const at = r.created_at != null ? formatOrderRoomDateTime(r.created_at) : "—";
                return (
                  <li
                    key={String(r.id ?? i)}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:border-amber-100 transition duration-200"
                  >
                    <p className="text-[10px] font-bold text-amber-500">
                      {at} · {statusLabel(r)}
                      {hasActiveDisputeForOrderRows([r]) ? (
                        <span className="ml-1 font-black text-amber-600">(진행 중)</span>
                      ) : null}
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-semibold">{disputeBody(r)}</p>
                  </li>
                );
              })}
            </ul>
          </details>
        ) : (
          <>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">접수 내역</h4>
            {hasTable && rows.length > 0 ? (
              <ul className="mt-2.5 max-h-80 space-y-3 overflow-y-auto">
                {rows.map((r, i) => {
                  const at = r.created_at != null ? formatOrderRoomDateTime(r.created_at) : "—";
                  return (
                    <li
                      key={String(r.id ?? i)}
                      className="rounded-xl border border-amber-100 bg-amber-50/20 px-3 py-3 transition duration-200 hover:shadow-sm hover:border-amber-300"
                    >
                      <p className="text-[10px] font-bold text-slate-400">
                        {at} · {statusLabel(r)}
                        {hasActiveDisputeForOrderRows([r]) ? (
                          <span className="ml-1 font-black text-amber-600">(진행 중)</span>
                        ) : null}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-semibold">{disputeBody(r)}</p>
                    </li>
                  );
                })}
              </ul>
            ) : hasTable && rows.length === 0 ? (
              <p className="mt-2 text-xs font-semibold text-slate-400 text-center py-4 bg-slate-50/30 rounded-xl">접수된 해결 요청이 없습니다.</p>
            ) : !hasTable ? (
              <p className="mt-2 text-xs font-semibold text-slate-400 text-center py-4 bg-slate-50/30 rounded-xl">해결 요청 내역을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.</p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
