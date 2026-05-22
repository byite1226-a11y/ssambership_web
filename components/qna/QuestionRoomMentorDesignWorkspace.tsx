"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, MessageCircle, Paperclip, Search, Send, User } from "lucide-react";
import { sendQuestionMessageAction } from "@/lib/qna/questionRoomActions";
import {
  formatMinutesAgo,
  formatQuestionRoomDateTime,
  threadInRoomPath,
} from "@/lib/qna/formatQuestionRoomDisplay";
import type { QuestionRoomListPreview } from "@/lib/qna/questionRoomQueries";
import { readQuestionThreadWorkflowStatus } from "@/lib/qna/questionThreadStatus";
import {
  studentLabelForRoom,
  type StudentDisplayById,
} from "@/lib/qna/questionRoomMentorContext";
import {
  threadPreviewText,
  threadStatusBadgeClass,
  threadStatusListLabel,
  threadSubjectChip,
  threadTitleFromRow,
  threadViewCount,
} from "@/lib/qna/questionRoomStudentDisplay";

type Row = Record<string, unknown>;
type SortKey = "newest" | "oldest";
type StatusFilter = "all" | "waiting" | "done";

function messageBody(m: Row): string {
  return (
    (typeof m.body === "string" && m.body) ||
    (typeof m.content === "string" && m.content) ||
    (typeof m.text === "string" && m.text) ||
    ""
  );
}

function messageAuthorId(m: Row): string | null {
  for (const k of ["author_id", "user_id", "sender_id"] as const) {
    const v = m[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function renderMessageContent(body: string) {
  const trimmed = body.trim();
  if (!trimmed) return null;
  const imgMatch = trimmed.match(/^(https?:\/\/\S+\.(png|jpe?g|gif|webp)(\?\S*)?)$/i);
  if (imgMatch) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={trimmed} alt="" className="max-h-48 rounded-lg object-contain" />
    );
  }
  return <span className="whitespace-pre-wrap break-words">{trimmed}</span>;
}

function threadMatchesFilter(t: Row, filter: StatusFilter): boolean {
  const w = readQuestionThreadWorkflowStatus(t);
  if (filter === "all") return true;
  if (filter === "waiting") return w === "pending";
  return w === "answered" || w === "confirmed";
}

function ChatSendButton(props: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={props.disabled || pending}
      aria-label="전송"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200"
    >
      <Send className="h-4 w-4" />
    </button>
  );
}

export function QuestionRoomMentorDesignWorkspace(props: {
  currentUserId: string;
  roomId: string;
  threadId: string | null;
  rooms: { rows: Row[]; error: string | null; loading: boolean };
  threads: { rows: Row[]; error: string | null; loading: boolean };
  messages: { rows: Row[]; error: string | null; loading: boolean };
  listPreviewsByRoomId: Record<string, QuestionRoomListPreview>;
  studentDisplays: StudentDisplayById;
  messageCountsByThreadId?: Record<string, number>;
  lastMessageByThreadId?: Record<string, Row>;
  unreadCountsByRoomId?: Record<string, number>;
  roomHrefBase?: string;
  draftMessageBody?: string;
  formRevision?: string;
  actionFeedback?: { ok: string | null; error: string | null };
}) {
  const rev = props.formRevision ?? "0";
  const roomBase = props.roomHrefBase ?? "/mentor/question-room";
  const [roomSearch, setRoomSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const currentRoom = useMemo(
    () => props.rooms.rows.find((r) => r && String(r.id) === String(props.roomId)) ?? null,
    [props.roomId, props.rooms.rows]
  );

  const studentName = currentRoom
    ? studentLabelForRoom(currentRoom, props.studentDisplays)
    : "학생";

  const filteredRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    return props.rooms.rows.filter((r) => {
      if (!r?.id) return false;
      if (!q) return true;
      return studentLabelForRoom(r, props.studentDisplays).toLowerCase().includes(q);
    });
  }, [props.rooms.rows, props.studentDisplays, roomSearch]);

  const filteredThreads = useMemo(
    () => props.threads.rows.filter((t) => threadMatchesFilter(t, statusFilter)),
    [props.threads.rows, statusFilter]
  );

  const sortedThreads = useMemo(() => {
    const list = [...filteredThreads];
    list.sort((a, b) => {
      const ta = new Date(String(a.created_at ?? 0)).getTime();
      const tb = new Date(String(b.created_at ?? 0)).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });
    return list;
  }, [filteredThreads, sort]);

  const subjectChipsRoom = useMemo(() => {
    const chips = new Set<string>();
    for (const t of props.threads.rows) {
      for (const c of threadSubjectChip(t, [])) chips.add(c);
    }
    return [...chips].slice(0, 6);
  }, [props.threads.rows]);

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-[640px] flex-col overflow-hidden border-t border-slate-200 bg-[#f8fafc] font-sans text-slate-900">
      {props.actionFeedback?.ok ? (
        <div className="shrink-0 border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-center text-[11px] font-bold text-emerald-900">
          {props.actionFeedback.ok}
        </div>
      ) : null}
      {props.actionFeedback?.error ? (
        <div className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-center text-[11px] font-bold text-red-900">
          {props.actionFeedback.error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="shrink-0 border-b border-slate-100 px-4 py-4">
            <h1 className="text-[15px] font-black text-slate-900">학생 질문방</h1>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="학생명 검색"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[11px] font-medium outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
            {props.rooms.loading ? (
              <p className="p-4 text-center text-[11px] font-bold text-slate-400">불러오는 중…</p>
            ) : filteredRooms.length === 0 ? (
              <p className="p-4 text-center text-[11px] font-bold text-slate-500">아직 연결된 학생 질문방이 없어요</p>
            ) : (
              filteredRooms.map((room) => {
                const rid = String(room.id);
                const selected = rid === props.roomId;
                const preview = props.listPreviewsByRoomId[rid];
                const unread = props.unreadCountsByRoomId?.[rid] ?? 0;
                const lastTitle =
                  preview?.latestThread && threadTitleFromRow(preview.latestThread as Row);
                return (
                  <Link
                    key={rid}
                    href={`${roomBase}/${encodeURIComponent(rid)}`}
                    className={`relative mb-2 block rounded-xl border p-3 pr-8 transition ${
                      selected
                        ? "border-l-[3px] border-l-blue-600 border-slate-200 bg-blue-50 shadow-sm"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    {unread > 0 ? (
                      <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-black text-white">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    ) : null}
                    <div className="flex gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-black text-slate-900">
                          {studentLabelForRoom(room, props.studentDisplays)}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-slate-500">
                          {lastTitle ?? "최근 질문 없음"}
                        </p>
                        <p className="mt-1 text-[9px] font-medium text-slate-400">
                          {formatMinutesAgo(
                            preview?.lastMessage?.created_at ??
                              preview?.latestThread?.updated_at ??
                              room.updated_at ??
                              room.created_at
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col border-r border-slate-200 bg-white">
          <header className="shrink-0 border-b border-slate-100 px-6 py-5">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-50 shadow-md ring-1 ring-slate-100">
                <User className="h-8 w-8 text-slate-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-[18px] font-black text-slate-900">{studentName} 학생</h1>
                <p className="mt-1 text-[12px] font-medium text-slate-500">질문방 관리</p>
                {subjectChipsRoom.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {subjectChipsRoom.map((c) => (
                      <span
                        key={c}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-50 px-6 py-3">
              <div className="flex rounded-lg bg-slate-100 p-0.5">
                {(
                  [
                    ["all", "전체"],
                    ["waiting", "답변대기"],
                    ["done", "완료"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(key)}
                    className={`rounded-md px-3 py-1 text-[11px] font-black transition ${
                      statusFilter === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 outline-none focus:border-blue-500"
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {props.threads.loading ? (
                <p className="py-12 text-center text-[12px] font-bold text-slate-400">질문을 불러오는 중…</p>
              ) : sortedThreads.length === 0 ? (
                <p className="py-12 text-center text-[12px] font-bold text-slate-400">표시할 질문이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {sortedThreads.map((t, idx) => {
                    const id = String(t.id);
                    const active = props.threadId === id || (!props.threadId && idx === 0);
                    const status = threadStatusListLabel(t);
                    const lastMsg = props.lastMessageByThreadId?.[id] ?? null;
                    const chip = threadSubjectChip(t, subjectChipsRoom);
                    const msgCount = props.messageCountsByThreadId?.[id] ?? 0;
                    const views = threadViewCount(t);
                    return (
                      <Link
                        key={id}
                        href={threadInRoomPath(roomBase, props.roomId, id)}
                        scroll={false}
                        className={`block rounded-xl border p-4 transition ${
                          active
                            ? "border-blue-400/40 bg-blue-50 shadow-sm ring-1 ring-blue-200/50"
                            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-black text-blue-700">
                            질문 {sortedThreads.length - idx}
                          </span>
                          {chip.map((c) => (
                            <span
                              key={c}
                              className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-600"
                            >
                              {c}
                            </span>
                          ))}
                          <span
                            className={`ml-auto rounded-full border px-2 py-0.5 text-[9px] font-black ${threadStatusBadgeClass(status.tone)}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <h3 className="mt-2 text-[14px] font-black text-slate-900">{threadTitleFromRow(t)}</h3>
                        <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-relaxed text-slate-500">
                          {threadPreviewText(t, lastMsg)}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {msgCount}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {views}
                          </span>
                          <span>{formatMinutesAgo(t.updated_at ?? t.created_at)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>

        <aside className="flex w-[320px] shrink-0 flex-col bg-[#f8fafc]">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <h2 className="text-[13px] font-black text-slate-900">실시간 질문방</h2>
            <span className="text-[10px] font-bold text-slate-500">{studentName}</span>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {props.messages.loading ? (
              <p className="py-8 text-center text-[11px] font-bold text-slate-400">대화 불러오는 중…</p>
            ) : !props.threadId ? (
              <p className="py-8 text-center text-[11px] font-bold text-slate-400">질문을 선택하면 대화가 표시됩니다.</p>
            ) : props.messages.rows.length === 0 ? (
              <p className="py-8 text-center text-[11px] font-bold text-slate-400">아직 메시지가 없습니다.</p>
            ) : (
              props.messages.rows.map((m) => {
                const body = messageBody(m);
                const author = messageAuthorId(m);
                const mine = author === props.currentUserId;
                return (
                  <div key={String(m.id)} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                      {!mine ? (
                        <span className="mb-1 text-[10px] font-bold text-slate-500">{studentName}</span>
                      ) : null}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-[12px] font-medium leading-relaxed shadow-sm ${
                          mine
                            ? "rounded-tr-sm bg-blue-600 text-white"
                            : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
                        }`}
                      >
                        {renderMessageContent(body)}
                      </div>
                      <span className="mt-1 px-1 text-[9px] font-bold text-slate-400">
                        {formatQuestionRoomDateTime(m.created_at) ?? formatMinutesAgo(m.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white p-3">
            <form key={`mentor-chat-${props.threadId ?? "x"}-${rev}`} action={sendQuestionMessageAction}>
              <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                <button type="button" disabled title="첨부는 준비 중입니다" className="shrink-0 p-2 text-slate-300">
                  <Paperclip className="h-5 w-5" />
                </button>
                <textarea
                  name="messageBody"
                  required
                  disabled={!props.threadId}
                  defaultValue={props.draftMessageBody ?? ""}
                  rows={3}
                  placeholder={props.threadId ? "답변을 입력하세요..." : "질문을 먼저 선택해 주세요"}
                  className="min-h-[52px] flex-1 resize-none bg-transparent text-[12px] font-medium outline-none disabled:opacity-50"
                />
                {props.threadId ? <input type="hidden" name="threadId" value={props.threadId} /> : null}
                <input type="hidden" name="roomId" value={props.roomId} />
                <input type="hidden" name="actor" value="mentor" />
                <input type="hidden" name="contextThreadId" value={props.threadId ?? ""} />
                <ChatSendButton disabled={!props.threadId} />
              </div>
            </form>
            <p className="mt-2 text-[10px] font-medium text-slate-500">
              답변 전송 시 학생에게 답변 완료 상태로 표시됩니다.
            </p>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
