import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { submitCustomOrderRoomMessageAction } from "@/lib/customRequest/orderMessageActions";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import {
  orderPartyLabelForMessage,
  pickOrderMentorIdFromRow,
  pickOrderStudentId,
} from "@/lib/customRequest/orderRoomMutations";
import type { AppRole } from "@/lib/types/user";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

type Row = Record<string, unknown>;
type Props = {
  detail: OrderDetailPageData;
  orderId: string;
  view: "student" | "mentor";
  actorRole: AppRole;
  hasOrderPartyAccess: boolean;
};

function eventLine(r: Row) {
  const t = pickDisplayField(r, ["type", "event", "action", "label", "id"]);
  const s = pickDisplayField(r, ["message", "note", "body", "status"]);
  const at = r.created_at != null ? String(r.created_at) : pickDisplayField(r, ["at", "occurred_at"]);
  return { t, s, at };
}

function messageText(m: Row) {
  return pickDisplayField(m, ["body", "content", "message", "text"]);
}

export function OrderProgressSection({ detail, orderId: orderIdProp, view: _view, actorRole, hasOrderPartyAccess }: Props) {
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
  const studentMsgs = msgRows.filter((m) => orderPartyLabelForMessage(m, o as Row | null, studentId, mentorId) === "학생");
  const mentorMsgs = msgRows.filter((m) => orderPartyLabelForMessage(m, o as Row | null, studentId, mentorId) === "멘토");

  const showStudentComposer = actorRole === "student" && hasOrderPartyAccess && Boolean(orderId);
  const showMentorComposer = actorRole === "mentor" && hasOrderPartyAccess && Boolean(orderId);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm">
      <h3 className="text-base font-bold text-slate-900">진행 로그 / 메시지</h3>
      <p className="mt-1 text-xs text-slate-500">주문 이벤트와 의뢰·멘토 간 메시지를 확인할 수 있습니다.</p>

      {postE ? <p className="mt-3 text-xs text-amber-800">의뢰 정보: {mapDataErrorMessage(String(postE))}</p> : null}
      {appE ? <p className="mt-1 text-xs text-amber-800">지원 정보: {mapDataErrorMessage(String(appE))}</p> : null}
      {evErr && !hasEvents ? <p className="mt-1 text-xs text-amber-800">진행 이벤트: {mapDataErrorMessage(String(evErr))}</p> : null}
      {evErr && hasEvents ? <p className="mt-1 text-xs text-amber-700/90">진행 이벤트(일부): {mapDataErrorMessage(String(evErr))}</p> : null}
      {msgErr && !hasMessages && msg.table ? <p className="mt-1 text-xs text-amber-800">메시지: {mapDataErrorMessage(String(msgErr))}</p> : null}

      <div className="mt-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">상태·이벤트</h4>
        {!o ? (
          <p className="mt-1.5 text-xs text-slate-500">주문 정보가 없습니다.</p>
        ) : hasEvents ? (
          <ol className="mt-1.5 max-h-52 space-y-1.5 overflow-y-auto border-l border-slate-200 pl-3 text-xs text-slate-600">
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
          <ol className="mt-1.5 list-decimal pl-4 text-xs text-slate-600">
            <li>상태: {String(o.status ?? o.state ?? o.order_status ?? o.stage ?? "—")}</li>
            {o.created_at != null && <li>주문 등록: {String(o.created_at)}</li>}
            {o.updated_at != null && (o as Row).created_at !== (o as Row).updated_at && (
              <li>마지막 변경: {String(o.updated_at)}</li>
            )}
            <li className="list-none pl-0 text-slate-400">이벤트 기록이 없을 때는 위 정보로 대체 표시됩니다.</li>
          </ol>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="flex min-h-[120px] flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-600">
          <p className="shrink-0 text-sm font-semibold text-slate-800">학생 메시지</p>
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
                rows={2}
                placeholder="멘토에게 전달할 메시지를 입력하세요."
                maxLength={4000}
                autoComplete="off"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-500"
              >
                학생 메시지 보내기
              </button>
            </form>
          ) : null}
          {hasMessages && studentMsgs.length > 0 ? (
            <ul className="mt-0 max-h-48 space-y-2 overflow-y-auto text-left">
              {studentMsgs.map((m, i) => (
                <li
                  key={String(m.id ?? i)}
                  className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-2 text-slate-800"
                >
                  <p className="text-[11px] text-slate-400">
                    {m.created_at != null ? String(m.created_at).slice(0, 16).replace("T", " ") : "—"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{messageText(m)}</p>
                </li>
              ))}
            </ul>
          ) : msgTableReady && studentMsgs.length === 0 ? (
            <p className="text-sm text-slate-500">학생 메시지 없음</p>
          ) : !msgTableReady ? (
            <p className="text-sm text-slate-500">메시지를 불러올 수 없습니다.</p>
          ) : null}
        </div>
        <div className="flex min-h-[120px] flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-600">
          <p className="shrink-0 text-sm font-semibold text-slate-800">멘토 메시지</p>
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
                rows={2}
                placeholder="학생에게 전달할 메시지를 입력하세요."
                maxLength={4000}
                autoComplete="off"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                멘토 메시지 보내기
              </button>
            </form>
          ) : null}
          {hasMessages && mentorMsgs.length > 0 ? (
            <ul className="mt-0 max-h-48 space-y-2 overflow-y-auto text-left">
              {mentorMsgs.map((m, i) => (
                <li
                  key={String(m.id ?? i)}
                  className="rounded-lg border border-emerald-200/50 bg-white px-2.5 py-2 text-slate-800"
                >
                  <p className="text-[11px] text-slate-400">
                    {m.created_at != null ? String(m.created_at).slice(0, 16).replace("T", " ") : "—"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{messageText(m)}</p>
                </li>
              ))}
            </ul>
          ) : msgTableReady && mentorMsgs.length === 0 ? (
            <p className="text-sm text-slate-500">멘토 메시지 없음</p>
          ) : !msgTableReady ? (
            <p className="text-sm text-slate-500">메시지를 불러올 수 없습니다.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
