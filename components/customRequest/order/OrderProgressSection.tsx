import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { submitCustomOrderRoomMessageAction } from "@/lib/customRequest/orderMessageActions";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import {
  formatOrderRoomDateTime,
  normalizedPrimaryOrderStatus,
  orderEventKindLabelForUi,
  ORDER_ROOM_CARD_CLASS,
} from "@/lib/customRequest/orderLifecycleConstants";
import { OrderStatusBadge } from "@/components/customRequest/order/OrderStatusBadge";
import {
  orderPartyLabelForMessage,
  pickOrderMentorIdFromRow,
  pickOrderStudentId,
} from "@/lib/customRequest/orderRoomMutations";
import type { AppRole } from "@/lib/types/user";

type Row = Record<string, unknown>;
type Props = {
  detail: OrderDetailPageData;
  orderId: string;
  view: "student" | "mentor";
  actorRole: AppRole;
  hasOrderPartyAccess: boolean;
  /** 종료 주문: 새 메시지 작성만 숨김(이력·로그는 유지) */
  orderTerminal?: boolean;
};

function eventLine(r: Row) {
  const tRaw = pickDisplayField(r, ["type", "event", "event_type", "kind", "action", "label"]);
  const t = orderEventKindLabelForUi(tRaw === "—" ? "" : tRaw);
  const s = pickDisplayField(r, ["message", "note", "body", "status"]);
  const atSrc =
    (r as Row).created_at != null
      ? (r as Row).created_at
      : (() => {
          for (const k of ["at", "occurred_at"] as const) {
            const v = (r as Row)[k];
            if (v != null) {
              return v;
            }
          }
          return null;
        })();
  const at = formatOrderRoomDateTime(atSrc);
  return { t, s, at };
}

function messageText(m: Row) {
  return pickDisplayField(m, ["body", "content", "message", "text"]);
}

export function OrderProgressSection({
  detail,
  orderId: orderIdProp,
  view: _view,
  actorRole,
  hasOrderPartyAccess,
  orderTerminal = false,
}: Props) {
  void _view;
  const ev = detail.events;
  const o = detail.bundle.order.row;
  const postE = detail.post.error;
  const appE = detail.application.error;
  const evErr = ev.error;
  const msg = detail.messages;
  const msgErr = msg.error;

  const hasEvents = (ev.table && (ev.rows?.length ?? 0) > 0) ?? false;
  const hasMessages = (msg.table && (msg.rows?.length ?? 0) > 0) ?? false;
  const msgTableReady = !!msg.table && !msg.error;

  const orderIdFromRow = o ? String((o as Row).id ?? "") : "";
  const orderId = (String(orderIdProp).trim() || orderIdFromRow).trim();
  const studentId = pickOrderStudentId(o as Row | null);
  const mentorId = pickOrderMentorIdFromRow(o as Row | null);
  const msgRows = (msg.rows ?? []) as Row[];
  const studentMsgs = msgRows.filter(
    (m) => orderPartyLabelForMessage(m, o as Row | null, studentId, mentorId) === "학생"
  );
  const mentorMsgs = msgRows.filter(
    (m) => orderPartyLabelForMessage(m, o as Row | null, studentId, mentorId) === "멘토"
  );

  const showStudentComposer =
    !orderTerminal && actorRole === "student" && hasOrderPartyAccess && Boolean(orderId);
  const showMentorComposer = !orderTerminal && actorRole === "mentor" && hasOrderPartyAccess && Boolean(orderId);

  return (
    <div className={`${ORDER_ROOM_CARD_CLASS} space-y-4 text-sm text-slate-800`}>
      {postE ? (
        <p className="text-xs text-amber-800">의뢰 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      ) : null}
      {appE ? (
        <p className="text-xs text-amber-800">지원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      ) : null}
      {evErr && !hasEvents ? (
        <p className="text-xs text-amber-800">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      ) : null}
      {evErr && hasEvents ? <p className="text-xs text-amber-700/90">일부 기록을 불러오지 못했을 수 있습니다.</p> : null}
      {msgErr && !hasMessages && msg.table ? (
        <p className="text-xs text-amber-800">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      ) : null}

      <div>
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-950">진행 기록</h3>
          <p className="mt-0.5 text-xs text-slate-500">최근 단계 이벤트(요약)</p>
        </div>
        <div className="min-h-0 max-h-36 overflow-y-auto rounded-2xl border border-slate-100/80 bg-slate-50/60 px-3 py-2.5">
          {!o ? (
            <p className="text-xs text-slate-500">주문 정보가 없습니다.</p>
          ) : hasEvents ? (
            <ol className="space-y-1.5 border-l-2 border-blue-200/70 pl-2.5 text-xs text-slate-600">
              {((ev.rows ?? []) as Row[]).map((r) => {
                const { t, s, at } = eventLine(r);
                return (
                  <li key={String((r as Row).id ?? t + at)} className="leading-relaxed">
                    <span className="text-slate-400">{at}</span>{" "}
                    <span className="text-slate-800">{t}</span>
                    {s && s !== "—" ? <span className="text-slate-600"> — {s}</span> : null}
                </li>
                );
              })}
            </ol>
          ) : (
            <ol className="list-decimal space-y-0.5 pl-4 text-xs text-slate-600">
              <li className="pl-0">
                <span className="text-slate-500">상태 </span>
                <OrderStatusBadge norm={normalizedPrimaryOrderStatus(o as Row)} />
              </li>
              {o.created_at != null && <li>주문 등록 {formatOrderRoomDateTime((o as Row).created_at)}</li>}
              {o.updated_at != null && (o as Row).created_at !== (o as Row).updated_at && (
                <li>마지막 갱신 {formatOrderRoomDateTime((o as Row).updated_at)}</li>
              )}
            </ol>
          )}
        </div>
        {!o || hasEvents ? null : (
          <p className="mt-1.5 text-[11px] text-slate-400">이벤트가 없을 때는 위 항목으로 대체해 보여 드려요.</p>
        )}
      </div>

      <div>
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-950">의뢰·멘토 메시지</h3>
          <p className="mt-0.5 text-xs text-slate-500">이 주문에 한해 주고받은 대화</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
          <div className="flex min-h-[11rem] flex-col gap-3 rounded-2xl border border-slate-200/60 bg-slate-50/40 p-3 text-xs text-slate-600">
            <p className="shrink-0 text-sm font-semibold text-slate-800">의뢰(학생)</p>
            {showStudentComposer ? (
              <form action={submitCustomOrderRoomMessageAction} className="shrink-0 space-y-2">
                <input type="hidden" name="orderId" value={orderId} />
                <label className="sr-only" htmlFor="student-order-msg">
                  학생 메시지
                </label>
                <textarea
                  id="student-order-msg"
                  name="messageBody"
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 shadow-sm"
                  rows={3}
                  placeholder="멘토에게 전달할 메시지"
                  maxLength={4000}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  보내기
                </button>
              </form>
            ) : null}
            {hasMessages && studentMsgs.length > 0 ? (
              <ul className="mt-0 max-h-56 min-h-0 space-y-2 overflow-y-auto text-left">
                {studentMsgs.map((m, i) => (
                  <li
                    key={String(m.id ?? i)}
                    className="rounded-lg border border-white/60 bg-white px-2.5 py-2 text-slate-800 shadow-sm"
                  >
                    <p className="text-[11px] text-slate-400">
                      {m.created_at != null ? formatOrderRoomDateTime(m.created_at) : "—"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{messageText(m)}</p>
                  </li>
                ))}
              </ul>
            ) : msgTableReady && studentMsgs.length === 0 ? (
              <p className="text-sm text-slate-500">의뢰 측 메시지가 없습니다.</p>
            ) : !msgTableReady ? (
              <p className="text-sm text-slate-500">메시지를 불러올 수 없습니다.</p>
            ) : null}
          </div>
          <div className="flex min-h-[11rem] flex-col gap-3 rounded-2xl border border-slate-200/60 bg-slate-50/40 p-3 text-xs text-slate-600">
            <p className="shrink-0 text-sm font-semibold text-slate-800">멘토</p>
            {showMentorComposer ? (
              <form action={submitCustomOrderRoomMessageAction} className="shrink-0 space-y-2">
                <input type="hidden" name="orderId" value={orderId} />
                <label className="sr-only" htmlFor="mentor-order-msg">
                  멘토 메시지
                </label>
                <textarea
                  id="mentor-order-msg"
                  name="messageBody"
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 shadow-sm"
                  rows={3}
                  placeholder="학생에게 전달할 메시지"
                  maxLength={4000}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  보내기
                </button>
              </form>
            ) : null}
            {hasMessages && mentorMsgs.length > 0 ? (
              <ul className="mt-0 max-h-56 min-h-0 space-y-2 overflow-y-auto text-left">
                {mentorMsgs.map((m, i) => (
                  <li
                    key={String(m.id ?? i)}
                    className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-2 text-slate-800 shadow-sm"
                  >
                    <p className="text-[11px] text-slate-400">
                      {m.created_at != null ? formatOrderRoomDateTime(m.created_at) : "—"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{messageText(m)}</p>
                  </li>
                ))}
              </ul>
            ) : msgTableReady && mentorMsgs.length === 0 ? (
              <p className="text-sm text-slate-500">멘토 메시지가 없습니다.</p>
            ) : !msgTableReady ? (
              <p className="text-sm text-slate-500">메시지를 불러올 수 없습니다.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
