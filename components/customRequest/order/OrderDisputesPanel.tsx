import { submitCustomOrderDisputeAction } from "@/lib/customRequest/orderDisputeActions";
import { hasActiveDisputeForOrderRows } from "@/lib/customRequest/orderDisputeHelpers";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import { formatOrderRoomDateTime, orderStatusLabelForUi } from "@/lib/customRequest/orderLifecycleConstants";
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
}: Props) {
  const u = detail.bundle.disputes;
  const rows = (u.rows ?? []) as Row[];
  const hasTable = Boolean(u.table) && !u.error;
  const canForm = (actorRole === "student" || actorRole === "mentor") && hasOrderPartyAccess && Boolean(String(orderId).trim());

  return (
    <section
      id="order-disputes"
      className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 text-sm text-slate-800 shadow-sm"
    >
      <h3 className="text-base font-bold text-slate-900">분쟁</h3>
      <p className="mt-1 text-xs text-slate-600">
        주문 진행 중 문제가 있을 때 의뢰자 또는 멘토가 분쟁을 신청합니다. 열린 분쟁이 있으면 납품·수락·수정 요청·작업 시작이 제한됩니다(메시지는 별도).
      </p>

      {!orderTerminal && canForm && openDisputeApplicationDisabledReason == null ? (
        <form action={submitCustomOrderDisputeAction} className="mt-4 space-y-2">
          <input type="hidden" name="orderId" value={orderId} />
          <label className="sr-only" htmlFor="order-dispute-body">
            분쟁 내용
          </label>
          <textarea
            id="order-dispute-body"
            name="disputeBody"
            className="min-h-[100px] w-full rounded-lg border border-amber-200/90 bg-white px-2.5 py-2 text-slate-900"
            maxLength={8000}
            placeholder="상황을 구체적으로 적어 주세요."
            required
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            분쟁 신청
          </button>
        </form>
      ) : !orderTerminal && canForm && openDisputeApplicationDisabledReason ? (
        <div className="mt-3 space-y-2" role="status">
          <p className="rounded-lg border border-amber-200 bg-white/80 px-3 py-2 text-sm text-slate-600">
            {openDisputeApplicationDisabledReason}
          </p>
        </div>
      ) : null}

      <div className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-900/70">접수 내역</h4>
        {u.error ? (
          <p className="mt-2 text-sm text-amber-800">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : null}
        {hasTable && rows.length > 0 ? (
          <ul className="mt-2 max-h-80 space-y-3 overflow-y-auto">
            {rows.map((r, i) => {
              const at = r.created_at != null ? formatOrderRoomDateTime(r.created_at) : "—";
              return (
                <li
                  key={String(r.id ?? i)}
                  className="rounded-lg border border-amber-200/60 bg-white/90 px-3 py-2.5 text-slate-800"
                >
                  <p className="text-xs text-slate-500">
                    {at} · {statusLabel(r)}
                    {hasActiveDisputeForOrderRows([r]) ? (
                      <span className="ml-1 font-medium text-amber-800">(진행 중)</span>
                    ) : null}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-slate-800">{disputeBody(r)}</p>
                </li>
              );
            })}
          </ul>
        ) : hasTable && rows.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">접수된 분쟁이 없습니다.</p>
        ) : !hasTable ? (
          <p className="mt-2 text-sm text-slate-500">분쟁 내역을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : null}
      </div>
    </section>
  );
}
