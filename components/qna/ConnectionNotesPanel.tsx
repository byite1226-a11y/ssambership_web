"use client";

import { useState } from "react";
import { Notebook, Plus, CalendarDays, MessagesSquare } from "lucide-react";
import { QuestionRoomNewNoteModal } from "@/components/qna/QuestionRoomNewNoteModal";
import { partyUserIdFromRoomRow } from "@/lib/qna/questionRoomUiLabels";
import { formatQuestionRoomDateTime } from "@/lib/qna/formatQuestionRoomDisplay";

type Row = Record<string, unknown>;

function authorIdOf(n: Row): string | null {
  for (const k of ["author_id", "user_id", "sender_id"] as const) {
    const v = n[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function noteBodyOf(n: Row): string {
  for (const k of ["body", "content", "note", "text"] as const) {
    const v = n[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** room.created_at → "N개월" (1개월 미만은 "N일"). */
function periodTogether(createdAt: unknown): string {
  if (typeof createdAt !== "string" || !createdAt) return "-";
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return "-";
  const days = Math.max(0, Math.floor((Date.now() - start.getTime()) / (24 * 60 * 60 * 1000)));
  if (days < 31) return `${days}일`;
  return `${Math.floor(days / 30)}개월`;
}

type NoteCard = { id: string; body: string; dateLabel: string; authorLabel: string };

export function ConnectionNotesPanel(props: {
  room: Row | null;
  notes: Row[];
  viewerRole: "student" | "mentor";
  currentUserId: string;
  roomId: string;
  threadId?: string | null;
  threadCount: number;
  studentName?: string;
  mentorName?: string;
}) {
  const [newNoteOpen, setNewNoteOpen] = useState(false);

  const studentId = props.room ? partyUserIdFromRoomRow(props.room, "student") : null;
  const mentorId = props.room ? partyUserIdFromRoomRow(props.room, "mentor") : null;
  const studentLabel = props.studentName?.trim() || "학생";
  const mentorLabel = props.mentorName?.trim() || "멘토";

  // 보는 사람과 무관하게 author 기준으로 "학생 칸 / 멘토 칸" 고정 분리.
  function sideOf(n: Row): "student" | "mentor" | null {
    const aid = authorIdOf(n);
    if (studentId && aid === studentId) return "student";
    if (mentorId && aid === mentorId) return "mentor";
    const role = String(n.author_role ?? "").toLowerCase();
    if (role === "student") return "student";
    if (role === "mentor") return "mentor";
    if (aid) return aid === props.currentUserId ? props.viewerRole : props.viewerRole === "student" ? "mentor" : "student";
    return null;
  }

  const studentNotes: NoteCard[] = [];
  const mentorNotes: NoteCard[] = [];
  for (const n of props.notes) {
    const body = noteBodyOf(n);
    if (!body) continue;
    const side = sideOf(n);
    if (!side) continue;
    const card: NoteCard = {
      id: String(n.id ?? `${authorIdOf(n)}-${body.slice(0, 8)}`),
      body,
      dateLabel: formatQuestionRoomDateTime(n.updated_at ?? n.created_at) ?? "",
      authorLabel: side === "student" ? studentLabel : mentorLabel,
    };
    (side === "student" ? studentNotes : mentorNotes).push(card);
  }

  function NoteColumn(opts: { side: "student" | "mentor"; title: string; cards: NoteCard[] }) {
    const isStudent = opts.side === "student";
    const canAdd = props.viewerRole === opts.side;
    return (
      <section
        className={`rounded-2xl border p-3.5 ${
          isStudent ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-100/70"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-slate-900">
            <span className={`h-2.5 w-2.5 rounded-full ${isStudent ? "bg-blue-600" : "bg-slate-500"}`} aria-hidden />
            {opts.title}
            <span className={`text-[11px] font-bold ${isStudent ? "text-blue-700" : "text-slate-600"}`}>
              {opts.cards.length}
            </span>
          </p>
          {canAdd ? (
            <button
              type="button"
              onClick={() => setNewNoteOpen(true)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition ${
                isStudent
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />내 노트 추가
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {opts.cards.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-3 py-4 text-center text-[12px] font-semibold text-slate-400">
              아직 노트가 없어요
            </p>
          ) : (
            opts.cards.map((card) => (
              <article
                key={card.id}
                className={`rounded-xl border border-l-[3px] bg-white px-3.5 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${
                  isStudent ? "border-blue-200 border-l-blue-600" : "border-slate-300 border-l-slate-500"
                }`}
              >
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">{card.body}</p>
                <p className="mt-2 text-[11px] font-semibold text-slate-400">
                  {card.authorLabel}
                  {card.dateLabel ? <span className="text-slate-300"> · {card.dateLabel}</span> : null}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    );
  }

  return (
    <aside className="hidden w-full shrink-0 flex-col bg-[#f8fafc] lg:flex lg:w-[420px]">
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
        {/* 헤더 색면 띠 (앱 파랑 info) */}
        <div className="border-b border-blue-200 bg-blue-100 px-5 py-4">
          <p className="flex items-center gap-2 text-[15px] font-extrabold text-blue-900">
            <Notebook className="h-[18px] w-[18px] text-blue-700" aria-hidden />
            연결 노트
          </p>
          {/* 관계 지표 */}
          <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-xl border border-blue-200 bg-white">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <CalendarDays className="h-4 w-4 shrink-0 text-blue-700" aria-hidden />
              <span className="min-w-0">
                <span className="block text-[10px] font-bold text-blue-700">함께한 기간</span>
                <span className="block text-[15px] font-black tabular-nums text-slate-900">
                  {periodTogether(props.room?.created_at)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 border-l border-blue-200 px-3 py-2.5">
              <MessagesSquare className="h-4 w-4 shrink-0 text-blue-700" aria-hidden />
              <span className="min-w-0">
                <span className="block text-[10px] font-bold text-blue-700">함께한 질문</span>
                <span className="block text-[15px] font-black tabular-nums text-slate-900">{props.threadCount}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <NoteColumn side="student" title="학생의 노트" cards={studentNotes} />
          <NoteColumn side="mentor" title="멘토의 노트" cards={mentorNotes} />
        </div>
      </div>

      <QuestionRoomNewNoteModal
        open={newNoteOpen}
        onClose={() => setNewNoteOpen(false)}
        roomId={props.roomId}
        threadId={props.threadId}
        actor={props.viewerRole}
      />
    </aside>
  );
}
