"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { QuestionRoomNewNoteModal } from "@/components/qna/QuestionRoomNewNoteModal";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Eye,
  MessageCircle,
  MessageCirclePlus,
  Notebook,
  Paperclip,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { QuestionRoomNewQuestionModal } from "@/components/qna/QuestionRoomNewQuestionModal";
import { QuestionThreadConfirmButton } from "@/components/qna/QuestionThreadConfirmButton";
import type { WeeklyUsageSnapshot } from "@/lib/qna/weeklyQuestionUsageDisplay";
import { weeklyQuestionQuotaLabel } from "@/lib/qna/weeklyQuestionUsageDisplay";
import { sendQuestionMessageAction } from "@/lib/qna/questionRoomActions";
import {
  formatMinutesAgo,
  formatQuestionRoomDateTime,
  threadInRoomPath,
} from "@/lib/qna/formatQuestionRoomDisplay";
import type { QuestionRoomSubscriptionContext } from "@/lib/qna/questionRoomStudentContext";
import type { QuestionRoomListPreview } from "@/lib/qna/questionRoomQueries";
import { partyUserIdFromRoomRow } from "@/lib/qna/questionRoomUiLabels";
import { readQuestionThreadWorkflowStatus } from "@/lib/qna/questionThreadStatus";
import {
  mentorDisplayForRoom,
  roomMentorLabel,
  roomSubjectChips,
  threadPreviewText,
  threadStatusBadgeClass,
  threadStatusListLabel,
  threadSubjectChip,
  threadTitleFromRow,
  threadViewCount,
  type MentorDisplayById,
} from "@/lib/qna/questionRoomStudentDisplay";
import { mentorSchoolLine, mentorSubjectChips } from "@/lib/mentor/mentorPublicProfileDisplay";

type Row = Record<string, unknown>;
type SortKey = "newest" | "oldest";
type NoteTab = "all" | "student" | "mentor";

/** "5월 22일 오후 5:07" 형식 (스펙). 잘못된 입력엔 빈 문자열. */
function formatNoteDateTime(iso: unknown): string {
  if (iso == null || iso === "") return "";
  const raw = typeof iso === "string" ? iso : String(iso);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const period = hours < 12 ? "오전" : "오후";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${month}월 ${day}일 ${period} ${displayHour}:${minutes}`;
}
type RightPanelTab = "chat" | "notes";

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

function ChatSendButton(props: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={props.disabled || pending}
      aria-label="전송"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1A56DB] text-white hover:bg-[#1648c0] disabled:bg-slate-200"
    >
      <Send className="h-4 w-4" />
    </button>
  );
}

export function QuestionRoomStudentDesignWorkspace(props: {
  currentUserId: string;
  roomId: string;
  threadId: string | null;
  rooms: { rows: Row[]; error: string | null; loading: boolean };
  threads: { rows: Row[]; error: string | null; loading: boolean };
  messages: { rows: Row[]; error: string | null; loading: boolean };
  notes: { rows: Row[]; error: string | null; loading: boolean };
  listPreviewsByRoomId: Record<string, QuestionRoomListPreview>;
  mentorDisplays: MentorDisplayById;
  initialUsageByMentorId?: Record<string, WeeklyUsageSnapshot>;
  messageCountsByThreadId?: Record<string, number>;
  lastMessageByThreadId?: Record<string, Row>;
  unreadCountsByRoomId?: Record<string, number>;
  subscriptionContext?: QuestionRoomSubscriptionContext;
  subjectOptions?: string[];
  actionFeedback?: { ok: string | null; error: string | null };
  draftMessageBody?: string;
  draftNoteBody?: string;
  formRevision?: string;
  /** false: 방 목록 화면(채팅 패널 숨김, 연결노트만) */
  showChatPanel?: boolean;
  backHref?: string | null;
  /** true: 중앙에 선택 질문 상세(목록 대신) */
  threadDetailMode?: boolean;
}) {
  const rev = props.formRevision ?? "0";

  const currentRoom = useMemo(
    () => props.rooms.rows.find((r) => r && String(r.id) === String(props.roomId)) ?? null,
    [props.roomId, props.rooms.rows]
  );

  const mentorId = currentRoom ? partyUserIdFromRoomRow(currentRoom, "mentor") : null;
  const mentorDisplay = mentorDisplayForRoom(currentRoom, props.mentorDisplays);
  const subCtx = props.subscriptionContext;

  const showChatPanel = props.showChatPanel !== false;
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [noteTab, setNoteTab] = useState<NoteTab>("all");
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>(showChatPanel ? "chat" : "notes");
  const [newQuestionOpen, setNewQuestionOpen] = useState(false);
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [weeklyUsage, setWeeklyUsage] = useState<WeeklyUsageSnapshot | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageByMentorId, setUsageByMentorId] = useState<Record<string, WeeklyUsageSnapshot>>(
    props.initialUsageByMentorId ?? {}
  );

  useEffect(() => {
    if (mentorId && props.initialUsageByMentorId?.[mentorId]) {
      setWeeklyUsage(props.initialUsageByMentorId[mentorId]);
    }
  }, [mentorId, props.initialUsageByMentorId]);

  const loadUsageForMentor = useCallback(async (mid: string) => {
    try {
      const res = await fetch(`/api/question-room/weekly-usage?mentorId=${encodeURIComponent(mid)}`, {
        credentials: "include",
      });
      const json = (await res.json()) as { ok?: boolean; usage?: WeeklyUsageSnapshot };
      if (res.ok && json.ok && json.usage) {
        const usage = json.usage;
        setUsageByMentorId((prev) => ({ ...prev, [mid]: usage }));
        if (mid === mentorId) setWeeklyUsage(json.usage);
      }
    } catch {
      /* ignore */
    }
  }, [mentorId]);

  useEffect(() => {
    if (!mentorId) return;
    setUsageLoading(true);
    void loadUsageForMentor(mentorId).finally(() => setUsageLoading(false));
  }, [mentorId, loadUsageForMentor]);

  useEffect(() => {
    const ids = new Set<string>();
    for (const r of props.rooms.rows) {
      const mid = partyUserIdFromRoomRow(r, "mentor");
      if (mid && mid !== mentorId) ids.add(mid);
    }
    for (const mid of ids) {
      void loadUsageForMentor(mid);
    }
  }, [props.rooms.rows, mentorId, loadUsageForMentor]);

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return props.rooms.rows;
    return props.rooms.rows.filter((r) => {
      const name = roomMentorLabel(r, props.mentorDisplays).toLowerCase();
      const chips = roomSubjectChips(r, props.mentorDisplays).join(" ").toLowerCase();
      return name.includes(q) || chips.includes(q);
    });
  }, [props.rooms.rows, props.mentorDisplays, search]);

  const sortedThreads = useMemo(() => {
    const rows = [...props.threads.rows];
    rows.sort((a, b) => {
      const ta = Date.parse(String(a.created_at ?? a.updated_at ?? 0));
      const tb = Date.parse(String(b.created_at ?? b.updated_at ?? 0));
      return sort === "newest" ? tb - ta : ta - tb;
    });
    return rows;
  }, [props.threads.rows, sort]);

  const selectedThread = useMemo(() => {
    if (!props.threadId) return sortedThreads[0] ?? null;
    return sortedThreads.find((t) => String(t.id) === String(props.threadId)) ?? null;
  }, [props.threadId, sortedThreads]);

  const threadWorkflow = selectedThread
    ? readQuestionThreadWorkflowStatus(selectedThread)
    : ("pending" as const);

  const subjectChipsRoom = roomSubjectChips(currentRoom ?? {}, props.mentorDisplays, 4);
  const remainingLabel =
    weeklyUsage && weeklyUsage.limit < 999
      ? `${weeklyUsage.remaining}회 더 질문 가능해요!`
      : weeklyUsage != null && weeklyUsage.limit >= 999
        ? "무제한 플랜으로 질문할 수 있어요!"
        : "플랜 확인 후 질문해 주세요.";

  const noteCards = useMemo(() => {
    type Card = {
      id: string;
      body: string;
      authorName: string;
      initial: string;
      byStudent: boolean;
      dateLabel: string;
    };
    const cards: Card[] = [];
    const mentorBaseLabel = currentRoom
      ? roomMentorLabel(currentRoom, props.mentorDisplays)
      : "";
    const mentorDisplayName = mentorBaseLabel ? `${mentorBaseLabel} 멘토` : "멘토";
    for (const n of props.notes.rows) {
      const body =
        (typeof n.body === "string" && n.body) ||
        (typeof n.content === "string" && n.content) ||
        (typeof n.note === "string" && n.note) ||
        "";
      if (!body.trim()) continue;
      const authorId = messageAuthorId(n);
      // 학생 화면에서 currentUser는 본인(학생). 본인이 작성하면 byStudent=true.
      const byStudent = authorId === props.currentUserId;
      const authorName = byStudent ? "학생" : mentorDisplayName;
      const initial = (authorName.trim().charAt(0) || (byStudent ? "학" : "멘")).toUpperCase();
      cards.push({
        id: String(n.id ?? `${authorId}-${body.slice(0, 8)}`),
        body: body.trim(),
        authorName,
        initial,
        byStudent,
        dateLabel: formatNoteDateTime(n.updated_at ?? n.created_at),
      });
    }
    return cards;
  }, [props.notes.rows, props.currentUserId, currentRoom, props.mentorDisplays, mentorDisplay]);

  const filteredNoteCards = noteCards.filter((c) => {
    if (noteTab === "all") return true;
    if (noteTab === "student") return c.byStudent;
    return !c.byStudent;
  });

  if (!props.rooms.loading && props.rooms.rows.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <MessageCirclePlus className="h-12 w-12 text-slate-400" strokeWidth={1.5} aria-hidden />
        <h2 className="mt-4 text-xl font-black text-slate-900">구독한 멘토에게 질문해보세요</h2>
        <p className="mt-2 max-w-md text-sm font-medium text-slate-600">
          멘토를 구독하면 이 곳에서 자유롭게 질문할 수 있어요.
        </p>
        <Link
          href="/mentors"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#1A56DB] px-5 text-sm font-extrabold text-white hover:bg-[#1648c0]"
        >
          멘토 찾기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc] font-sans text-slate-900 shadow-sm">
      {(props.actionFeedback?.ok || props.actionFeedback?.error) && (
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2">
          {props.actionFeedback.ok ? (
            <p className="text-center text-xs font-semibold text-emerald-800">{props.actionFeedback.ok}</p>
          ) : null}
          {props.actionFeedback.error ? (
            <p className="text-center text-xs font-semibold text-amber-900">{props.actionFeedback.error}</p>
          ) : null}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* 좌측 240px */}
        <aside className="flex w-[240px] shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="shrink-0 border-b border-slate-100 p-4">
            <h2 className="text-[15px] font-black text-slate-900">구독 질문방</h2>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="멘토 또는 질문방 검색"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-[12px] font-medium outline-none focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB]/30"
              />
            </div>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
            {props.rooms.loading ? (
              <p className="p-4 text-center text-[11px] font-bold text-slate-400">불러오는 중…</p>
            ) : filteredRooms.length === 0 ? (
              <p className="p-4 text-center text-[11px] font-bold leading-relaxed text-slate-400">
                구독한 멘토 질문방이 없습니다.
              </p>
            ) : (
              filteredRooms.map((room) => {
                const rid = String(room.id);
                const selected = rid === props.roomId;
                const mid = partyUserIdFromRoomRow(room, "mentor");
                const display = mentorDisplayForRoom(room, props.mentorDisplays);
                const preview = props.listPreviewsByRoomId[rid];
                const unread = props.unreadCountsByRoomId?.[rid] ?? 0;
                const usage = mid ? usageByMentorId[mid] : undefined;
                return (
                  <Link
                    key={rid}
                    href={`/question-room/${encodeURIComponent(rid)}`}
                    className={`relative mb-2 block rounded-xl border p-3 pr-8 transition ${
                      selected
                        ? "border-l-[3px] border-l-[#1A56DB] border-slate-200 bg-[#EEF4FF] shadow-sm"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    {unread > 0 ? (
                      <span className="absolute right-2 top-2 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1A56DB] px-1.5 text-[10px] font-black text-white">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    ) : null}
                    <div className="flex gap-2.5">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                        {display?.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={display.photoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[12px] font-black text-slate-400">
                            {roomMentorLabel(room, props.mentorDisplays).slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-black text-slate-900">
                          {roomMentorLabel(room, props.mentorDisplays)}
                        </p>
                        {roomSubjectChips(room, props.mentorDisplays, 3).length > 0 ? (
                          <p className="mt-1 text-[10px] font-medium text-slate-400">
                            {roomSubjectChips(room, props.mentorDisplays, 3).join(" · ")}
                          </p>
                        ) : (
                          <p className="mt-1 text-[10px] font-medium text-slate-400">과목 정보 없음</p>
                        )}
                        <p className="mt-1 text-[10px] font-bold text-[#1A56DB]">
                          {weeklyQuestionQuotaLabel(usage)}
                        </p>
                        <p className="mt-0.5 text-[9px] font-medium text-slate-400">
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

          <div className="shrink-0 border-t border-slate-100 p-3">
            <Link
              href="/mentors"
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#1A56DB]/40 bg-[#EEF4FF] text-[12px] font-black text-[#1A56DB] transition hover:bg-[#E0ECFF]"
            >
              <Plus className="h-4 w-4" />
              질문방 구독하기
            </Link>
          </div>
        </aside>

        {/* 중앙 */}
        <main className="flex min-w-0 flex-1 flex-col border-r border-slate-200 bg-white">
          <header className="shrink-0 border-b border-slate-100 px-6 py-5">
            <div className="flex gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white bg-slate-50 shadow-md ring-1 ring-slate-100">
                {mentorDisplay?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mentorDisplay.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl font-black text-slate-300">
                    {roomMentorLabel(currentRoom ?? {}, props.mentorDisplays).slice(0, 1)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[18px] font-black text-slate-900">
                    {roomMentorLabel(currentRoom ?? {}, props.mentorDisplays)}
                  </h1>
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-[#1A56DB] px-1.5 py-0.5 text-[10px] font-black text-white">
                    <BadgeCheck className="h-3 w-3" />
                    인증
                  </span>
                </div>
                <p className="mt-1 text-[12px] font-medium text-slate-500">
                  {mentorDisplay ? mentorSchoolLine(mentorDisplay) : "학교·학과 정보 준비 중"}
                </p>
                {subjectChipsRoom.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {subjectChipsRoom.map((c) => (
                      <span
                        key={c}
                        className="rounded-md border border-[#1A56DB]/40 bg-white px-2 py-0.5 text-[10px] font-bold text-[#1A56DB]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 max-w-md">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>{weeklyQuestionQuotaLabel(weeklyUsage)}</span>
                    <span className="text-slate-400">
                      {weeklyUsage?.planTier ? String(weeklyUsage.planTier).toUpperCase() : "플랜"}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#1A56DB] transition-all"
                      style={{
                        width:
                          weeklyUsage && weeklyUsage.limit > 0 && weeklyUsage.limit < 999
                            ? `${Math.min(100, Math.round((weeklyUsage.used / weeklyUsage.limit) * 100))}%`
                            : weeklyUsage && weeklyUsage.limit >= 999
                              ? "12%"
                              : "0%",
                      }}
                    />
                  </div>
                  <p className="mt-1.5 space-y-0.5 text-[10px] text-slate-500">
                    <span className="block">갱신: {subCtx?.weekRenewalLabel ?? "매주 월요일 00:00"}</span>
                    <span className="block">구독 플랜: {subCtx?.planLabel ?? "—"}</span>
                    <span className="block">다음 갱신: {subCtx?.nextRenewalLabel ?? "—"}</span>
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            {props.threadDetailMode && selectedThread ? (
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="flex flex-wrap items-center gap-2">
                  {threadSubjectChip(selectedThread, subjectChipsRoom).map((c) => (
                    <span
                      key={c}
                      className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-600"
                    >
                      {c}
                    </span>
                  ))}
                  <span
                    className={`ml-auto rounded-full border px-2 py-0.5 text-[9px] font-black ${threadStatusBadgeClass(threadStatusListLabel(selectedThread).tone)}`}
                  >
                    {threadStatusListLabel(selectedThread).label}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-black text-slate-900">{threadTitleFromRow(selectedThread)}</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">
                  {threadPreviewText(selectedThread, props.lastMessageByThreadId?.[String(selectedThread.id)] ?? null)}
                </p>
                <p className="mt-4 text-[11px] font-bold text-slate-400">
                  등록 {formatMinutesAgo(selectedThread.created_at ?? selectedThread.updated_at)}
                </p>

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <h3 className="text-[13px] font-black text-slate-900">답변</h3>
                  {props.messages.loading ? (
                    <p className="mt-4 py-6 text-center text-[12px] font-bold text-slate-400">답변을 불러오는 중…</p>
                  ) : props.messages.rows.length === 0 ? (
                    <p className="mt-4 py-6 text-center text-[12px] font-bold text-slate-400">아직 답변 메시지가 없습니다.</p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {props.messages.rows.map((m) => {
                        const body = messageBody(m);
                        const author = messageAuthorId(m);
                        const mine = author === props.currentUserId;
                        const mentorName = roomMentorLabel(currentRoom ?? {}, props.mentorDisplays);

                        return (
                          <div key={String(m.id)} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[92%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                              {!mine ? (
                                <span className="mb-1 text-[10px] font-bold text-slate-500">{mentorName}</span>
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
                      })}
                    </div>
                  )}
                </div>

                {threadWorkflow === "answered" && props.threadId ? (
                  <div className="mt-6">
                    <QuestionThreadConfirmButton roomId={props.roomId} threadId={props.threadId} />
                  </div>
                ) : null}
              </div>
            ) : (
            <>
            <div className="flex shrink-0 items-center justify-between border-b border-slate-50 px-6 py-3">
              <h2 className="text-[14px] font-black text-slate-900">질문 목록</h2>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 outline-none focus:border-[#1A56DB]"
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {props.threads.loading ? (
                <p className="py-12 text-center text-[12px] font-bold text-slate-400">질문을 불러오는 중…</p>
              ) : sortedThreads.length === 0 ? (
                <p className="py-12 text-center text-[12px] font-bold leading-relaxed text-slate-400">
                  아직 등록된 질문이 없습니다.
                  <br />
                  아래 버튼으로 첫 질문을 시작해 보세요.
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedThreads.map((t, idx) => {
                    const id = String(t.id);
                    const active = props.threadId === id;
                    const status = threadStatusListLabel(t);
                    const workflow = readQuestionThreadWorkflowStatus(t);
                    const questionNo = idx + 1;
                    const lastMsg = props.lastMessageByThreadId?.[id] ?? null;
                    const chip = threadSubjectChip(t, subjectChipsRoom);
                    const msgCount = props.messageCountsByThreadId?.[id] ?? 0;
                    const views = threadViewCount(t);

                    return (
                      <article
                        key={id}
                        className={`rounded-xl border p-4 transition ${
                          active
                            ? "border-[#1A56DB]/40 bg-[#EEF4FF] shadow-sm ring-1 ring-[#1A56DB]/20"
                            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                        }`}
                      >
                        <Link
                          href={threadInRoomPath("/question-room", props.roomId, id)}
                          scroll={false}
                          className="block"
                        >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-black text-[#1A56DB]">질문 {questionNo}</span>
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
                        {workflow === "answered" ? (
                          <QuestionThreadConfirmButton
                            roomId={props.roomId}
                            threadId={id}
                            compact
                          />
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {!props.threadDetailMode ? (
              <div className="shrink-0 border-t border-slate-100 px-6 py-5">
                <button
                  type="button"
                  disabled={weeklyUsage != null && !weeklyUsage.canAsk}
                  onClick={() => setNewQuestionOpen(true)}
                  className="mx-auto flex h-11 items-center justify-center gap-2 rounded-full border border-[#1A56DB]/20 bg-[#EEF4FF] px-6 text-[13px] font-black text-[#1A56DB] transition hover:bg-[#E0ECFF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                  새로운 질문하기
                </button>
              </div>
            ) : null}
            </>
            )}
          </div>
        </main>

        {/* 우측 패널: 실시간 채팅 / 연결 노트 */}
        <aside className="flex w-[320px] shrink-0 flex-col bg-[#f8fafc]">
          {props.backHref ? (
            <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2.5">
              <Link
                href={props.backHref}
                className="inline-flex items-center gap-1.5 text-[12px] font-black text-[#1A56DB] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                질문 목록으로
              </Link>
            </div>
          ) : null}

          <div className="flex shrink-0 border-b border-slate-200 bg-white">
            {showChatPanel ? (
              <button
                type="button"
                onClick={() => setRightPanelTab("chat")}
                className={`flex-1 px-3 py-2.5 text-[12px] font-black transition ${
                  rightPanelTab === "chat"
                    ? "border-b-2 border-[#1A56DB] text-[#1A56DB]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                실시간 채팅
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setRightPanelTab("notes")}
              className={`flex-1 px-3 py-2.5 text-[12px] font-black transition ${
                rightPanelTab === "notes"
                  ? "border-b-2 border-[#1A56DB] text-[#1A56DB]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              연결 노트
            </button>
          </div>

          {rightPanelTab === "chat" && showChatPanel ? (
            <>
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  온라인
                </span>
              </div>

              {threadWorkflow === "answered" && props.threadId ? (
                <div className="shrink-0 border-b border-blue-100 bg-white px-4 py-3">
                  <QuestionThreadConfirmButton roomId={props.roomId} threadId={props.threadId} />
                </div>
              ) : null}

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
                    const mentorName = roomMentorLabel(currentRoom ?? {}, props.mentorDisplays);

                    return (
                      <div key={String(m.id)} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[88%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                          {!mine ? (
                            <span className="mb-1 text-[10px] font-bold text-slate-500">{mentorName}</span>
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

              <div className="relative shrink-0 border-t border-slate-200 bg-white p-3">
                <form key={`chat-${props.threadId ?? "x"}-${rev}`} action={sendQuestionMessageAction}>
                  <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                    <button
                      type="button"
                      disabled
                      title="첨부는 준비 중입니다"
                      className="shrink-0 p-2 text-slate-300"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <textarea
                      name="messageBody"
                      required
                      disabled={!props.threadId}
                      defaultValue={props.draftMessageBody ?? ""}
                      rows={2}
                      placeholder={props.threadId ? "질문을 입력하세요..." : "질문을 먼저 선택해 주세요"}
                      className="min-h-[44px] flex-1 resize-none bg-transparent text-[12px] font-medium outline-none disabled:opacity-50"
                    />
                    {props.threadId ? <input type="hidden" name="threadId" value={props.threadId} /> : null}
                    <input type="hidden" name="roomId" value={props.roomId} />
                    <input type="hidden" name="actor" value="student" />
                    <input type="hidden" name="contextThreadId" value={props.threadId ?? ""} />
                    <ChatSendButton disabled={!props.threadId} />
                  </div>
                </form>

                <div className="mt-3 rounded-xl border border-[#1A56DB]/20 bg-[#EEF4FF] p-3">
                  <p className="text-[11px] font-black text-[#1A56DB]">질문 전 확인해보세요!</p>
                  <ul className="mt-2 space-y-1.5 text-[10px] font-medium text-slate-600">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#1A56DB]" />
                      단원·문항 번호를 함께 적어 주세요
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#1A56DB]" />
                      시도한 풀이 과정을 포함해 주세요
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#1A56DB]" />
                      사진·수식은 메시지에 붙여 넣을 수 있어요
                    </li>
                  </ul>
                  <p className="mt-2 text-[10px] font-bold text-slate-700">
                    {weeklyQuestionQuotaLabel(weeklyUsage)}
                  </p>
                  <p className="text-[10px] font-black text-[#1A56DB]">{remainingLabel}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
              {/* 헤더 */}
              <div className="border-b border-[#f2f3f5] px-5 pt-[18px] pb-[15px]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-semibold text-[#16181d]">연결 노트</p>
                  <button
                    type="button"
                    onClick={() => setNewNoteOpen(true)}
                    className="inline-flex items-center gap-1 text-[13px] text-[#666b76] hover:text-[#16181d]"
                  >
                    <Plus className="h-[15px] w-[15px]" />새 노트
                  </button>
                </div>
                <p className="mt-1 text-[12px] text-[#9aa0ab]">학생과 함께 쌓아가는 학습 기록</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(
                    [
                      ["all", "전체"],
                      ["student", "학생"],
                      ["mentor", "멘토"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNoteTab(key)}
                      className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition ${
                        noteTab === key
                          ? "bg-[#16181d] text-white"
                          : "bg-[#f4f5f7] text-[#666b76] hover:bg-[#eaeaee]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 본문 */}
              <div className="flex flex-col gap-3 p-4">
                {filteredNoteCards.length === 0 ? (
                  <div className="py-9 text-center">
                    <Notebook className="mx-auto h-7 w-7 text-[#d3d6dc]" aria-hidden />
                    <p className="mt-2 text-[14px] font-medium text-[#5b616b]">아직 연결 노트가 없어요</p>
                    <p className="mt-1 text-[13px] text-[#a7acb5]">학생과 함께 학습 기록을 시작해 보세요</p>
                  </div>
                ) : (
                  filteredNoteCards.map((card) => (
                    <article
                      key={card.id}
                      className="rounded-[13px] border border-[#edeef1] px-4 py-[15px]"
                    >
                      <div className="mb-[9px] flex items-center gap-[7px]">
                        <span
                          className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-semibold text-white ${
                            card.byStudent ? "bg-[#3b7de0]" : "bg-[#16181d]"
                          }`}
                          aria-hidden
                        >
                          {card.initial}
                        </span>
                        <span className="text-[13px] font-semibold text-[#16181d]">
                          {card.authorName}
                        </span>
                      </div>
                      <p className="mb-2.5 text-[14px] leading-relaxed text-[#37404a]">
                        {card.body}
                      </p>
                      <p className="text-[12px] text-[#a7acb5]">{card.dateLabel}</p>
                    </article>
                  ))
                )}
                {!showChatPanel ? (
                  <p className="mt-2 px-1 text-[12px] text-[#a7acb5]">
                    질문 카드를 누르면 상세 화면에서 실시간 채팅을 이어갈 수 있어요.
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </aside>
      </div>

      <QuestionRoomNewQuestionModal
        open={newQuestionOpen}
        onClose={() => setNewQuestionOpen(false)}
        roomId={props.roomId}
        contextThreadId={props.threadId}
        usage={weeklyUsage}
        usageLoading={usageLoading}
        subjectOptions={props.subjectOptions ?? subjectChipsRoom}
      />

      <QuestionRoomNewNoteModal
        open={newNoteOpen}
        onClose={() => setNewNoteOpen(false)}
        roomId={props.roomId}
        threadId={props.threadId}
        defaultBody={props.draftNoteBody}
      />

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