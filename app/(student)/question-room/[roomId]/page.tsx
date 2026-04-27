import { notFound } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { QuestionRoomWorkspace } from "@/components/qna/QuestionRoomWorkspace";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadQuestionRoomDetailBundle, userCanAccessMentorStudentRoom } from "@/lib/qna/questionRoomQueries";
import { qnaHierarchy } from "@/lib/domain/coreFlows";
import { extractNoteText } from "@/lib/qna/questionRoomMutations";
import { paramToDraft } from "@/lib/qna/draftQuery";

type Props = {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<{
    thread?: string;
    ok?: string;
    error?: string;
    kind?: "thread" | "message" | "note";
    t?: string;
    dThread?: string;
    dMessage?: string;
    dNote?: string;
  }>;
};

export default async function StudentQuestionRoomDetailPage(props: Props) {
  const { roomId } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const threadFromQuery = typeof sp.thread === "string" && sp.thread.length ? sp.thread : null;
  const okMessage = typeof sp.ok === "string" && sp.ok.length ? sp.ok : null;
  const errorMessage = typeof sp.error === "string" && sp.error.length ? sp.error : null;
  const feedbackKind = sp.kind === "thread" || sp.kind === "message" || sp.kind === "note" ? sp.kind : undefined;
  const dThreadQ = paramToDraft(typeof sp.dThread === "string" ? sp.dThread : undefined);
  const dMessageQ = paramToDraft(typeof sp.dMessage === "string" ? sp.dMessage : undefined);
  const dNoteQ = paramToDraft(typeof sp.dNote === "string" ? sp.dNote : undefined);

  const draftThreadTitle = feedbackKind === "thread" && errorMessage ? (dThreadQ ?? "") : undefined;
  const draftMessageBody = feedbackKind === "message" && errorMessage ? (dMessageQ ?? "") : undefined;
  const draftNoteBody = feedbackKind === "note" && errorMessage ? (dNoteQ ?? "") : undefined;
  const formRevision = typeof sp.t === "string" && sp.t.length ? sp.t : "0";

  const { user } = await requireRole("student");
  const supabase = await createClient();
  const allowed = await userCanAccessMentorStudentRoom(supabase, user.id, "student", roomId);
  if (!allowed) {
    notFound();
  }
  const detail = await loadQuestionRoomDetailBundle(supabase, user.id, "student", roomId, threadFromQuery);
  const { resolvedThreadId, ...bundle } = detail;

  const activeThreadId = resolvedThreadId;
  const initialNoteText = extractNoteText(bundle.notes.rows[0]);

  return (
    <PageScaffold
      eyebrow="Student / Question Room Detail"
      title={`질문방 ${roomId}`}
      description={`핵심 구조: ${qnaHierarchy.join(" → ")}. connection note는 room 스코프로 별도 트랙(메시지와 합치지 않음).`}
      ctas={[
        { href: "/question-room", label: "질문방 목록", tone: "slate" },
        { href: "/notes", label: "room 연결노트", tone: "blue" },
      ]}
      sections={[
        { title: "Room 컨텍스트", body: "mentor_student_rooms — 접근/목록 scope 검증.", status: "connected" },
        { title: "Thread 목록/선택", body: "question_threads — ?thread=로 선택(없으면 첫 thread).", status: "connected" },
        { title: "Message 타임라인(선택 thread)", body: "question_messages — thread_id 기준.", status: "connected" },
        { title: "Connection note( room )", body: "connection_notes — room_id 기준.", status: "connected" },
      ]}
      emptyState="room 접근 권한이 없으면 좌측 room 패널에 오류/빈 상태로 표시합니다."
      loadingState="서버에서 조회가 끝나면 패널에 데이터가 표시됩니다."
      errorState="쿼리 실패는 패널 상단 배너로 구분합니다."
      dataPoints={["mentor_student_rooms.id", "question_threads.room_id", "question_messages.thread_id", "connection_notes.room_id"]}
    >
      <QuestionRoomWorkspace
        variant="student"
        surface="detail"
        actionFeedback={{ kind: feedbackKind, ok: okMessage, error: errorMessage }}
        title="질문방 상세"
        subtitle={`room=${roomId} / thread=${activeThreadId ?? "(none)"}`}
        rooms={bundle.rooms}
        threads={bundle.threads}
        messages={bundle.messages}
        notes={bundle.notes}
        roomId={roomId}
        threadId={activeThreadId}
        buildRoomHref={(id) => `/question-room/${id}`}
        buildThreadHref={(rid, tid) => `/question-room/${rid}?thread=${encodeURIComponent(tid)}`}
        initialNoteText={initialNoteText}
        draftThreadTitle={draftThreadTitle}
        draftMessageBody={draftMessageBody}
        draftNoteBody={draftNoteBody}
        formRevision={formRevision}
      />
    </PageScaffold>
  );
}
