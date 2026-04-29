import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import {
  formatOrderRoomDateTime,
  normalizedPrimaryOrderStatus,
  orderEventKindLabelForUi,
  ORDER_ROOM_CARD_CLASS,
} from "@/lib/customRequest/orderLifecycleConstants";
import { OrderStatusBadge } from "@/components/customRequest/order/OrderStatusBadge";

type Row = Record<string, unknown>;

function eventLine(row: Row) {
  const rawType = pickDisplayField(row, ["type", "event", "event_type", "kind", "action", "label"]);
  const eventLabel = orderEventKindLabelForUi(rawType === "—" ? "" : rawType);
  const message = pickDisplayField(row, ["message", "note", "body", "status"]);

  const atSource =
    row.created_at != null
      ? row.created_at
      : row.at != null
        ? row.at
        : row.occurred_at != null
          ? row.occurred_at
          : null;

  return {
    eventLabel,
    message,
    at: formatOrderRoomDateTime(atSource),
  };
}

export function OrderEventsLogPanel({ detail }: { detail: OrderDetailPageData }) {
  const events = detail.events;
  const order = detail.bundle.order.row as Row | null;
  const hasEvents = Boolean(events.table && (events.rows?.length ?? 0) > 0);

  return (
    <section className={ORDER_ROOM_CARD_CLASS} aria-label="주문 진행 로그">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-950">진행 로그</h3>
        <p className="mt-0.5 text-xs text-slate-500">주문 단계별 기록을 확인합니다.</p>
      </div>

      {events.error && !hasEvents ? (
        <p className="text-xs text-amber-800">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      ) : null}

      {events.error && hasEvents ? (
        <p className="mb-2 text-xs text-amber-700/90">일부 기록을 불러오지 못했을 수 있습니다.</p>
      ) : null}

      <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-100/90 bg-slate-50/60 px-3 py-2.5">
        {!order ? (
          <p className="text-xs text-slate-500">주문 정보를 확인할 수 없습니다.</p>
        ) : hasEvents ? (
          <ol className="space-y-1.5 border-l-2 border-blue-200/70 pl-2.5 text-xs text-slate-600">
            {((events.rows ?? []) as Row[]).map((row, index) => {
              const { eventLabel, message, at } = eventLine(row);
              return (
                <li key={String(row.id ?? `${eventLabel}-${at}-${index}`)} className="leading-relaxed">
                  <span className="text-slate-400">{at}</span>{" "}
                  <span className="font-medium text-slate-800">{eventLabel}</span>
                  {message && message !== "—" ? <span className="text-slate-600"> · {message}</span> : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <ol className="space-y-1.5 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <span className="text-slate-500">현재 상태</span>
              <OrderStatusBadge norm={normalizedPrimaryOrderStatus(order)} />
            </li>
            {order.created_at != null ? (
              <li>주문 등록 {formatOrderRoomDateTime(order.created_at)}</li>
            ) : null}
            {order.updated_at != null && order.created_at !== order.updated_at ? (
              <li>마지막 갱신 {formatOrderRoomDateTime(order.updated_at)}</li>
            ) : null}
          </ol>
        )}
      </div>

      {!order || hasEvents ? null : (
        <p className="mt-1.5 text-[11px] text-slate-400">기록이 없을 때는 현재 주문 상태를 기준으로 표시합니다.</p>
      )}
    </section>
  );
}
