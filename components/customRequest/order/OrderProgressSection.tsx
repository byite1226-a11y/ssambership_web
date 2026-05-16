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

export function OrderProgressSection(props: Props) {
  if (props.view === "mentor") {
    return <OrderProgressSectionMentor {...props} />;
  }
  const {
    detail,
    orderId: orderIdProp,
    view,
    actorRole,
    hasOrderPartyAccess,
    orderTerminal = false,
  } = props;
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
            const isMe = role === "학생";
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
                      M
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

/**
 * ========================================================
 * MENTOR ONLY VISUAL UPGRADES (SAFETY ENCAPSULATED)
 * ========================================================
 */

/** DB에 첨부 관련 열/메타가 있을 때만 표시(읽기 전용, 기존 select * 행 활용). */
function pickAttachmentFromMessage(m: Row): { href: string; label: string } | null {
  const urlKeys = ["file_url", "attachment_url", "file_uri", "download_url", "url"] as const;
  for (const k of urlKeys) {
    const v = m[k];
    if (typeof v === "string" && v.trim()) {
      const href = v.trim();
      if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("/")) {
        const labelRaw = pickDisplayField(m, [
          "original_filename",
          "file_name",
          "filename",
          "attachment_name",
          "name",
        ]);
        return { href, label: labelRaw !== "—" ? labelRaw : "첨부 파일" };
      }
    }
  }
  return null;
}

function MessageAttachmentChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex max-w-sm items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-blue-200 transition duration-200 group text-left"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500 font-black text-[10px]">
          FILE
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-800 truncate group-hover:text-blue-600 transition">
            {label}
          </p>
        </div>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
    </a>
  );
}

function OrderProgressSectionMentor({
  detail,
  orderId: orderIdProp,
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

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col h-[720px] lg:h-[780px]">
      {/* Header exactly matching reference */}
      <div className="border-b border-slate-100 bg-white px-5 py-3.5 flex items-center gap-2">
        <h3 className="text-[14px] font-black text-slate-800">
          주문방 채팅
        </h3>
        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <svg className="h-3 w-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>대화 내용은 안전한 거래를 위해 저장됩니다.</span>
        </div>
      </div>

      <div className="bg-[#FAFBFC] flex-1 flex flex-col overflow-hidden relative">
        {/* Chat stream area - pushes content down */}
        <div className="flex-1 overflow-y-auto scroll-smooth px-5 py-6 flex flex-col gap-4">
          {msgErr ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-[10px] font-medium text-amber-900">
              채팅 기록을 불러오지 못했습니다.
            </p>
          ) : null}

          {sortedMsgRows.length === 0 && !msgErr ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-90 mt-8">
              <div className="h-12 w-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 text-slate-300">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-[13px] font-bold text-slate-500">아직 주고받은 메시지가 없습니다.</p>
              <p className="mt-1 text-[11px] font-medium text-slate-400">상대방에게 먼저 인사를 건네보세요.</p>
            </div>
          ) : null}

          {sortedMsgRows.map((m, idx) => {
            const role = orderPartyLabelForMessage(m, o as Row | null, studentId, mentorId);
            const isMe = role === "멘토";
            const senderName = role === "학생" ? "의뢰 학생" : "나";
            const dateStr = formatMessageGroupDate(m.created_at);
            const prevDateStr = idx > 0 ? formatMessageGroupDate(sortedMsgRows[idx - 1]?.created_at) : "";
            const showDateHeader = Boolean(dateStr && dateStr !== prevDateStr);
            const timeStr = formatMessageTime(m.created_at);
            const bodyLine = messageText(m);
            const hasText = bodyLine !== "—" && bodyLine.trim().length > 0;
            const attachment = pickAttachmentFromMessage(m);

            return (
              <div key={String(m.id || idx)} className={showDateHeader ? "mt-8 first:mt-0" : "mt-0"}>
                {showDateHeader && dateStr ? (
                  <div className="flex items-center justify-center gap-3 py-4 mb-2">
                    <div className="h-px bg-slate-200 w-full max-w-[80px]"></div>
                    <span className="text-[11px] font-bold text-slate-400 tracking-tight whitespace-nowrap">{dateStr}</span>
                    <div className="h-px bg-slate-200 w-full max-w-[80px]"></div>
                  </div>
                ) : null}

                <div className={`flex items-start gap-3 mb-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className="shrink-0 mt-1">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-[12px] font-black shadow-sm ${
                      isMe ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-200 text-slate-600 border-slate-300"
                    }`} aria-hidden>
                      {isMe ? "나" : "학"}
                    </div>
                  </div>

                  <div className={`flex min-w-0 max-w-[70%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <span className="mb-1 text-[11px] font-bold text-slate-500 px-1">
                      {senderName}
                    </span>

                    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <div
                        className={`min-w-0 max-w-full px-4 py-2.5 text-[13px] font-medium leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.03)] border ${
                          isMe
                            ? "rounded-2xl rounded-tr-none bg-[#E1F0FF] text-slate-800 border-[#BEE3F8]"
                            : "rounded-2xl rounded-tl-none bg-white text-slate-800 border-slate-200"
                        }`}
                      >
                        {hasText ? (
                          <p className="whitespace-pre-wrap break-words">{bodyLine}</p>
                        ) : null}
                        {attachment ? (
                          <MessageAttachmentChip href={attachment.href} label={attachment.label} />
                        ) : null}
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 mb-0.5">
                        {timeStr}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Composer rigidly fixed at base */}
        {showComposer ? (
          <div className="bg-white border-t border-slate-200 p-4 shrink-0">
            <form
              action={submitCustomOrderRoomMessageAction}
              className="flex items-center gap-3 bg-[#F8F9FA] border border-slate-200 rounded-xl px-4 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all duration-200"
            >
              <input type="hidden" name="orderId" value={orderId} />
              <input
                type="text"
                name="messageBody"
                placeholder="메시지를 입력하세요..."
                className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium text-slate-800 placeholder:text-slate-400 py-1.5"
                maxLength={4000}
                required
                autoComplete="off"
              />
              <div className="flex items-center gap-3 shrink-0">
                <button type="button" className="text-slate-400 hover:text-slate-600 transition" title="파일 첨부">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <button
                  type="submit"
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-[#0066FF] px-5 text-[12px] font-bold text-white hover:bg-blue-700 shadow-sm transition-colors duration-200"
                >
                  전송
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-[#F8F9FA] border-t border-slate-200 px-4 py-3 text-center text-[11px] font-bold text-slate-400 shrink-0">
            이미 종료된 주문 대화방입니다.
          </div>
        )}
      </div>
    </div>
  );
}
