"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { QuestionRoomListCatalog } from "@/components/qna/QuestionRoomListCatalog";
import {
  createQuestionThreadAction,
  saveConnectionNoteAction,
  sendQuestionMessageAction,
} from "@/lib/qna/questionRoomActions";
import {
  formatQuestionRoomDateTime,
  threadInRoomPath,
} from "@/lib/qna/formatQuestionRoomDisplay";
import type { QuestionRoomListPreview } from "@/lib/qna/questionRoomQueries";
import {
  readThreadLifecycleStatus,
} from "@/lib/qna/questionRoomUiLabels";
import {
  ChevronLeft, 
  MessageSquare, 
  Paperclip, 
  Bookmark, 
  Clock,
  Layout,
  User
} from "lucide-react";

type Row = Record<string, unknown>;

function roomTitle(r: Row): string {
  for (const k of ["title", "topic", "name", "label", "student_name"] as const) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "질문방";
}

function threadLabelForRow(t: Row): string {
  for (const k of ["title", "subject", "label", "topic"] as const) {
    const v = t[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "새 질문";
}

function messageBody(m: Row): string {
  return (
    (typeof m.body === "string" && m.body) ||
    (typeof m.content === "string" && m.content) ||
    (typeof m.text === "string" && m.text) ||
    ""
  );
}

function pickRowString(r: Row | undefined, keys: string[]): string | null {
  if (!r) return null;
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export function QuestionRoomWorkspace(props: {
  variant: "student" | "mentor";
  surface?: "list" | "detail";
  actionFeedback?: { kind?: "thread" | "message" | "note"; ok: string | null; error: string | null };
  title: string;
  subtitle: string;
  currentUserId?: string;
  rooms: { rows: Row[]; error: string | null; loading: boolean };
  threads: { rows: Row[]; error: string | null; loading: boolean };
  messages: { rows: Row[]; error: string | null; loading: boolean };
  notes: { rows: Row[]; error: string | null; loading: boolean };
  roomId?: string;
  threadId?: string | null;
  listPreviewsByRoomId?: Record<string, QuestionRoomListPreview>;
  roomHrefBase?: string;
  listStartQuestion?: { href: string; label: string };
  listSecondaryCta?: { href: string; label: string };
  initialNoteText?: string;
  draftThreadTitle?: string;
  draftMessageBody?: string;
  draftNoteBody?: string;
  formRevision?: string;
}) {
  const rev = props.formRevision ?? "0";
  const uid = props.currentUserId;
  const roomBase = props.roomHrefBase || (props.variant === "mentor" ? "/mentor/question-room" : "/question-room");

  const currentRoom = useMemo(() => {
    if (!props.roomId) return null;
    return props.rooms.rows.find((r) => r && String(r.id) === String(props.roomId));
  }, [props.roomId, props.rooms.rows]);

  const selectedThread = useMemo(() => {
    if (!props.threadId) return props.threads.rows[0] ?? null;
    return props.threads.rows.find((t) => t && String(t.id) === String(props.threadId)) ?? null;
  }, [props.threadId, props.threads.rows]);

  const studentName = currentRoom ? roomTitle(currentRoom) : "학생";
  const studentExtra = currentRoom ? (pickRowString(currentRoom, ["grade", "school"]) ?? pickRowString(currentRoom, ["subject", "major"])) : null;
  const threadStatus = selectedThread ? readThreadLifecycleStatus(selectedThread) : "open";

  const studentNoteText = useMemo(() => {
    const studentId = currentRoom ? pickRowString(currentRoom, ["student_id", "student_user_id", "student_uid"]) : null;
    if (!studentId) return "";
    const note = props.notes.rows.find(n => pickRowString(n, ["author_id", "user_id"]) === studentId);
    return note ? pickRowString(note, ["body", "content", "note", "text"]) ?? "" : "";
  }, [props.notes.rows, currentRoom]);

  const mentorNoteText = useMemo(() => {
    if (!uid) return props.initialNoteText ?? "";
    const note = props.notes.rows.find(n => pickRowString(n, ["author_id", "user_id"]) === uid);
    return note ? pickRowString(note, ["body", "content", "note", "text"]) ?? "" : (props.initialNoteText ?? "");
  }, [props.notes.rows, uid, props.initialNoteText]);

  // List View
  if (props.surface === "list") {
    const startHref = props.listStartQuestion?.href ?? (props.variant === "student" ? "/mentors" : "/mentor/dashboard");
    const startLabel = props.listStartQuestion?.label ?? (props.variant === "student" ? "질문 시작하기" : "대시보드로 이동");
    
    return (
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-3">
        <QuestionRoomListCatalog
          variant={props.variant}
          title={props.title}
          subtitle={props.subtitle}
          rooms={props.rooms}
          listPreviewsByRoomId={props.listPreviewsByRoomId ?? {}}
          roomHrefBase={roomBase}
          startQuestionHref={startHref}
          startQuestionLabel={startLabel}
          secondaryCta={props.listSecondaryCta}
        />
      </div>
    );
  }

  // Detail View (3-column Workspace)
  return (
    <div className="relative flex h-[calc(100vh-140px)] w-full bg-white font-sans text-slate-900 overflow-hidden rounded-[32px] border border-slate-100 shadow-sm">
      <div className="flex w-full h-full overflow-hidden">
        {props.actionFeedback?.ok ? (
          <div className="absolute z-20 mx-auto mt-2 max-w-lg self-start px-4 left-0 right-0">
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-950 shadow-sm">
              {props.actionFeedback.ok}
            </p>
          </div>
        ) : null}
        {props.actionFeedback?.error ? (
          <div className="absolute z-20 mx-auto mt-2 max-w-lg self-start px-4 left-0 right-0">
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-950 shadow-sm">
              {props.actionFeedback.error}
            </p>
          </div>
        ) : null}
        
        {/* [좌측] 질문 주제 목록 */}
        <aside className="w-[300px] shrink-0 border-r border-slate-100 flex flex-col h-full bg-[#fcfdfe]">
          <div className="p-6 border-b border-slate-50 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-black text-slate-900">질문 주제</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {props.threads.loading ? (
              <div className="p-10 text-center text-[12px] font-bold text-slate-300">로딩 중...</div>
            ) : props.threads.rows.length > 0 ? (
              props.threads.rows.map((t) => {
                const id = String(t.id);
                const isActive = props.threadId === id || (!props.threadId && props.threads.rows[0]?.id === t.id);
                const status = readThreadLifecycleStatus(t);
                
                return (
                  <Link
                    key={id}
                    href={threadInRoomPath(roomBase, props.roomId!, id)}
                    className={`w-full flex flex-col gap-1 px-6 py-5 transition-all text-left border-b border-slate-50 relative ${
                      isActive ? "bg-white shadow-[inset_4px_0_0_0_#2563eb]" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[13px] font-black truncate ${isActive ? "text-blue-600" : "text-slate-900"}`}>
                        {threadLabelForRow(t)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300">
                        {formatQuestionRoomDateTime(t.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                        status === "open" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                      }`}>
                        {status === "open" ? "진행 중" : "종료"}
                      </span>
                      <p className="text-[11px] font-medium text-slate-400 line-clamp-1 flex-1">
                        {pickRowString(t, ["last_message_body", "preview", "snippet"]) ?? "요약 없음"}
                      </p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="p-6 text-center text-[12px] font-bold leading-relaxed text-slate-400">
                {props.variant === "mentor" ? (
                  <>
                    학생이 새 질문 주제를 만들면
                    <br />
                    이 목록에 표시됩니다.
                  </>
                ) : (
                  <>
                    아직 등록된 질문 주제가 없습니다.
                    <br />
                    아래에서 새 주제를 추가해 주세요.
                  </>
                )}
              </div>
            )}
          </div>
          {props.variant === "student" && props.roomId ? (
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 p-4">
              <p className="text-[11px] font-extrabold text-slate-600">새 질문 주제</p>
              <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-500">
                질문 주제는 학생만 만들 수 있습니다. 활성 구독이 없으면 추가가 차단될 수 있어요.
              </p>
              <form action={createQuestionThreadAction} className="mt-2 space-y-2">
                <input type="hidden" name="roomId" value={props.roomId} />
                <input type="hidden" name="contextThreadId" value={props.threadId ?? ""} />
                <input
                  name="threadTitle"
                  required
                  placeholder="질문 주제 제목"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium outline-none focus:border-blue-400"
                />
                <FormSubmitButton
                  idleLabel="주제 추가"
                  pendingLabel="추가 중…"
                  className="w-full h-9 rounded-xl bg-blue-600 text-[12px] font-black text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-40"
                />
              </form>
            </div>
          ) : null}
        </aside>

        {/* [중앙] 대화 영역 */}
        <main className="flex-1 flex flex-col h-full bg-white border-r border-slate-100 overflow-hidden">
          {/* 중앙 상단: Room Header */}
          <header className="px-8 py-5 border-b border-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <Link 
                href={roomBase}
                className="p-2 rounded-xl hover:bg-slate-50 transition text-slate-400"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[18px] font-black text-slate-900">{studentName}</h1>
                  {studentExtra && (
                    <span className="text-[12px] font-bold text-slate-400">· {studentExtra}</span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    threadStatus === "open" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                  }`}>
                    {threadStatus === "open" ? "대기 중" : "종료됨"}
                  </span>
                </div>
                <p className="text-[12px] font-bold text-slate-400 mt-0.5">
                  {selectedThread ? threadLabelForRow(selectedThread) : "주제를 선택하세요"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="h-4 w-4" />
              <span className="text-[11px] font-bold">최근 업데이트: {currentRoom ? formatQuestionRoomDateTime(currentRoom.updated_at) : "-"}</span>
            </div>
          </header>

          {/* 메시지 리스트 */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#fcfdfe] custom-scrollbar">
            {props.messages.loading ? (
              <div className="text-center py-20 text-slate-300 font-bold">대화를 불러오는 중...</div>
            ) : props.messages.rows.length > 0 ? (
              props.messages.rows.map((m) => {
                const body = messageBody(m);
                const author = (m.author_id as string) || (m.user_id as string);
                const mine = Boolean(uid && author === uid);
                
                return (
                  <div key={String(m.id)} className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`flex flex-col max-w-[80%] ${mine ? "items-end" : "items-start"}`}>
                      {!mine && <span className="text-[11px] font-bold text-slate-400 mb-1 ml-1">{studentName}</span>}
                      <div className={`relative px-5 py-3 rounded-2xl shadow-sm text-[13px] font-medium leading-relaxed ${
                        mine 
                          ? "bg-blue-600 text-white rounded-tr-none" 
                          : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                      }`}>
                        {body}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 mt-1.5 px-1">
                        {formatQuestionRoomDateTime(m.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <MessageSquare className="h-12 w-12 text-slate-200 mb-4" />
                <p className="text-[14px] font-bold text-slate-400">대화가 없습니다.</p>
              </div>
            )}
          </div>

          {/* 메시지 작성 */}
          <div className="p-6 bg-white border-t border-slate-50 shrink-0">
            <form key={`msg-form-${props.threadId ?? "none"}-${rev}`} action={sendQuestionMessageAction}>
              <div className="relative">
                <textarea 
                  name="messageBody"
                  required
                  disabled={!props.threadId}
                  defaultValue={props.draftMessageBody ?? ""}
                  placeholder={
                    !props.threadId
                      ? "왼쪽에서 질문 주제를 먼저 선택해 주세요."
                      : props.variant === "student"
                        ? "이해가 잘 되도록 질문을 구체적으로 작성해 주세요."
                        : "학생이 이해하기 쉽게 답변을 작성해 주세요."
                  }
                  className="w-full h-32 rounded-[24px] border border-slate-200 bg-white p-5 pr-14 text-[13px] font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
                {props.threadId && <input type="hidden" name="threadId" value={props.threadId} />}
                {props.roomId && <input type="hidden" name="roomId" value={props.roomId} />}
                <input type="hidden" name="actor" value={props.variant} />
                <input type="hidden" name="contextThreadId" value={props.threadId ?? ""} />
                
                <div className="absolute right-4 bottom-4 flex items-center gap-2">
                  <div
                    className="p-2 text-slate-300 cursor-not-allowed"
                    title="파일 첨부는 저장소 연동 후 제공됩니다."
                  >
                    <Paperclip className="h-5 w-5" />
                  </div>
                  <FormSubmitButton
                    idleLabel={props.variant === "student" ? "질문 보내기" : "답변 보내기"}
                    pendingLabel="..."
                    disabled={!props.threadId}
                    className="h-11 px-4 rounded-full bg-blue-600 text-white text-[13px] font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
                  />
                </div>
              </div>
            </form>
          </div>
        </main>

        {/* [우측] 정보 패널 */}
        <aside className="w-[300px] shrink-0 flex flex-col h-full bg-white overflow-hidden">
          <div className="flex flex-col h-full border-l border-slate-100">
            <section className="border-b border-blue-100 bg-blue-50/50 px-4 py-3 text-[10px] font-medium leading-relaxed text-blue-950">
              <span className="font-extrabold">연결 메모</span>는 이 질문방(room) 단위입니다. 질문 스레드마다 따로 저장되지 않습니다. 스키마에 따라
              room당 하나의 노트 행만 있을 수 있어, 학생·멘토 메모가 같은 저장소를 갱신할 수 있습니다.
            </section>

            {props.variant === "mentor" ? (
              <section className="p-6 border-b border-slate-50">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-wider">학생 참고 메모</h2>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-[12px] font-medium leading-relaxed text-slate-600">
                  {studentNoteText || "표시할 학생 메모가 없습니다."}
                </div>
              </section>
            ) : (
              <section className="p-6 border-b border-slate-50">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-wider">멘토 참고 메모</h2>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-[12px] font-medium leading-relaxed text-slate-600">
                  {mentorNoteText || "표시할 멘토 메모가 없습니다."}
                </div>
              </section>
            )}

            <section className="p-6 border-b border-slate-50">
              <div className="flex items-center gap-2 mb-4">
                <Bookmark className="h-4 w-4 text-blue-500" />
                <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-wider">
                  {props.variant === "student" ? "내 메모 (room 단위)" : "멘토 메모 (room 단위)"}
                </h2>
              </div>

              <form action={saveConnectionNoteAction} key={`note-form-${rev}`} className="space-y-4">
                <textarea
                  name="noteBody"
                  required
                  defaultValue={
                    props.draftNoteBody !== undefined
                      ? props.draftNoteBody
                      : props.variant === "student"
                        ? studentNoteText || ""
                        : mentorNoteText
                  }
                  placeholder={props.variant === "student" ? "멘토에게 전달할 배경·목표를 짧게 남겨 주세요." : "멘토만 볼 수 있는 메모를 남겨 주세요."}
                  className="h-32 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-[12px] font-medium outline-none transition-all focus:border-blue-200 focus:bg-white resize-none"
                />
                {props.roomId && <input type="hidden" name="roomId" value={props.roomId} />}
                <input type="hidden" name="actor" value={props.variant} />
                <input type="hidden" name="contextThreadId" value={props.threadId ?? ""} />
                <FormSubmitButton
                  idleLabel="메모 저장"
                  pendingLabel="저장 중…"
                  className="h-10 w-full rounded-xl bg-slate-900 text-[12px] font-black text-white shadow-sm transition hover:bg-slate-800"
                />
              </form>
            </section>

            <section className="border-b border-slate-50 p-6">
              <h3 className="mb-4 text-[12px] font-black uppercase tracking-wider text-slate-400">빠른 링크</h3>
              <div className="space-y-2">
                <Link
                  href={roomBase}
                  className="group flex items-center justify-between rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100"
                >
                  <span className="text-[12px] font-bold text-slate-700">전체 목록</span>
                  <ChevronLeft className="h-4 w-4 rotate-180 text-slate-300 group-hover:text-slate-500" />
                </Link>
                <Link
                  href={props.variant === "mentor" ? "/mentor/dashboard" : "/home"}
                  className="group flex items-center justify-between rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100"
                >
                  <span className="text-[12px] font-bold text-slate-700">{props.variant === "mentor" ? "멘토 대시보드" : "학생 홈"}</span>
                  <Layout className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                </Link>
              </div>
            </section>

            {props.variant === "mentor" ? (
              <section className="m-6 rounded-2xl border border-blue-50 bg-blue-50/30 p-6">
                <p className="mb-2 text-[12px] font-black text-blue-900">멘토 가이드</p>
                <p className="text-[11px] font-medium leading-relaxed text-blue-700">
                  학생의 눈높이에 맞는 단계별 설명을 지향해 주세요. 주제별로 대화를 나누면 이후 복기에 도움이 됩니다.
                </p>
              </section>
            ) : null}
          </div>
        </aside>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
