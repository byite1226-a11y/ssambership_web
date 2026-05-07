import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { submitCustomOrderRoomMessageAction } from "@/lib/customRequest/orderMessageActions";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import {
  formatOrderRoomDateTime,
  normalizedPrimaryOrderStatus,
  orderEventKindLabelForUi,
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
  orderTerminal?: boolean;
};

function messageText(m: Row) {
  return pickDisplayField(m, ["body", "content", "message", "text"]);
}

function formatMessageGroupDate(dateStr: unknown) {
  if (!dateStr) return "";
  try {
    const d = new Date(String(dateStr));
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const day = days[d.getDay()];
    return `${yyyy}.${mm}.${dd} (${day})`;
  } catch {
    return "";
  }
}

function formatMessageTime(dateStr: unknown) {
  if (!dateStr) return "";
  try {
    const d = new Date(String(dateStr));
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

export function OrderProgressSection({
  detail,
  orderId: orderIdProp,
  view,
  actorRole,
  hasOrderPartyAccess,
  orderTerminal = false,
}: Props) {
  const o = detail.bundle.order.row;
  const msg = detail.messages;
  const msgErr = msg.error;

  const orderIdFromRow = o ? String((o as Row).id ?? "") : "";
  const orderId = (String(orderIdProp).trim() || orderIdFromRow).trim();
  const studentId = pickOrderStudentId(o as Row | null);
  const mentorId = pickOrderMentorIdFromRow(o as Row | null);

  const rawMsgRows = (msg.rows ?? []) as Row[];
  const sortedMsgRows = [...rawMsgRows].sort((a, b) => {
    const tA = a.created_at ? new Date(String(a.created_at)).getTime() : 0;
    const tB = b.created_at ? new Date(String(b.created_at)).getTime() : 0;
    return tA - tB;
  });

  const showComposer = !orderTerminal && hasOrderPartyAccess && Boolean(orderId);

  let lastDateStr = "";

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4 hover:border-blue-100 transition duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <span>주문방 채팅</span>
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </h3>
          <p className="mt-0.5 text-[10px] font-bold text-slate-400">대화 내용은 안전한 거래를 위해 저장됩니다.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-black text-blue-600">실시간 연동</span>
      </div>

      <div className="min-h-[300px] max-h-[500px] overflow-y-auto pr-1 space-y-3 scroll-smooth">
        {msgErr && (
          <p className="text-xs text-amber-800 text-center bg-amber-50 p-2 rounded-lg">채팅 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        )}
        {sortedMsgRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
            <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <p className="text-xs font-bold">주고받은 대화 메시지가 아직 없습니다.</p>
          </div>
        ) : (
          sortedMsgRows.map((m, idx) => {
            const role = orderPartyLabelForMessage(m, o as Row | null, studentId, mentorId);
            const isMe = (view === "student" && role === "학생") || (view === "mentor" && role === "멘토");
            const senderName = role === "학생" ? "의뢰 학생" : `${detail.header.mentorName || "배정"} 멘토`;
            const dateStr = formatMessageGroupDate(m.created_at);
            const timeStr = formatMessageTime(m.created_at);

            const showDateHeader = dateStr !== lastDateStr;
            if (showDateHeader) {
              lastDateStr = dateStr;
            }

            return (
              <div key={String(m.id || idx)} className="space-y-2">
                {showDateHeader && (
                  <div className="flex items-center my-3">
                    <div className="flex-1 border-t border-slate-100" />
                    <span className="mx-3 text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{dateStr}</span>
                    <div className="flex-1 border-t border-slate-100" />
                  </div>
                )}

                <div className={`flex items-start gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-500">
                      {role === "학생" ? "S" : "M"}
                    </div>
                  )}
                  <div className={`flex flex-col space-y-0.5 max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <span className="text-[10px] font-black text-slate-500">{senderName}</span>
                    )}
                    <div className="flex items-end gap-1.5">
                      {isMe && <span className="text-[9px] font-bold text-slate-400 tabular-nums">{timeStr}</span>}
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-xs font-bold leading-relaxed shadow-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-slate-100/85 text-slate-800 rounded-tl-none border border-slate-200/50"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{messageText(m)}</p>
                      </div>
                      {!isMe && <span className="text-[9px] font-bold text-slate-400 tabular-nums">{timeStr}</span>}
                    </div>
                  </div>
                  {isMe && (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-black text-blue-600">
                      {role === "학생" ? "S" : "M"}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showComposer && (
        <form action={submitCustomOrderRoomMessageAction} className="pt-3 border-t border-slate-100">
          <input type="hidden" name="orderId" value={orderId} />
          <div className="relative flex items-center">
            <textarea
              name="messageBody"
              rows={2}
              placeholder="메시지를 입력해 주세요..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-20 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner resize-none leading-normal"
              maxLength={4000}
              required
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-blue-700 transition"
              >
                전송
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
