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

export default async function MentorQuestionRoomDetailPage(props: Props) {
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

  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const allowed = await userCanAccessMentorStudentRoom(supabase, user.id, "mentor", roomId);
  if (!allowed) {
    notFound();
  }
  const detail = await loadQuestionRoomDetailBundle(supabase, user.id, "mentor", roomId, threadFromQuery);
  const { resolvedThreadId, ...bundle } = detail;

  const activeThreadId = resolvedThreadId;
  const initialNoteText = extractNoteText(bundle.notes.rows[0]);

  return (
    <PageScaffold
      eyebrow="Mentor / Question Room Detail"
      title={`멘토 질문방 ${roomId}`}
      description={`${qnaHierarchy.join(" → ")} 구조를 학생 UI와 대칭으로 유지합니다.`}
      ctas={[
        { href: "/mentor/question-room", label: "질문방 목록", tone: "slate" },
        { href: "/mentor/channel", label: "콘텐츠 연계", tone: "green" },
      ]}
      sections={[
        { title: "Room 컨텍스트", body: "mentor_student_rooms — 멘토 room scope 검증.", status: "connected" },
        { title: "Thread 관리", body: "question_threads — ?thread=로 선택(없으면 첫 thread).", status: "connected" },
        { title: "Message 처리(선택 thread)", body: "question_messages — 답변 영역(placeholder) + raw 확인.", status: "connected" },
        { title: "Connection note( room )", body: "connection_notes — room_id.", status: "connected" },
      ]}
      emptyState="권한이 없는 room이면 좌측에서 오류/빈 상태로 표시합니다."
      loadingState="서버 조회 완료 시 패널이 채워집니다."
      errorState="오류는 패널 배너로 표시합니다."
      dataPoints={["mentor_student_rooms", "question_threads", "question_messages", "connection_notes"]}
    >
      <QuestionRoomWorkspace
        variant="mentor"
        surface="detail"
        actionFeedback={{ kind: feedbackKind, ok: okMessage, error: errorMessage }}
        title="멘토 질문방 상세"
        subtitle={`room=${roomId} / thread=${activeThreadId ?? "(none)"}`}
        rooms={bundle.rooms}
        threads={bundle.threads}
        messages={bundle.messages}
        notes={bundle.notes}
        roomId={roomId}
        threadId={activeThreadId}
        buildRoomHref={(id) => `/mentor/question-room/${id}`}
        buildThreadHref={(rid, tid) => `/mentor/question-room/${rid}?thread=${encodeURIComponent(tid)}`}
        initialNoteText={initialNoteText}
        draftThreadTitle={draftThreadTitle}
        draftMessageBody={draftMessageBody}
        draftNoteBody={draftNoteBody}
        formRevision={formRevision}
      />
    </PageScaffold>
  );
}
