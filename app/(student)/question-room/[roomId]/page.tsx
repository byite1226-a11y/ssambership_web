import { notFound } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { QuestionRoomWorkspace } from "@/components/qna/QuestionRoomWorkspace";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadQuestionRoomDetailBundle, userCanAccessMentorStudentRoom } from "@/lib/qna/questionRoomQueries";
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

  const roomRow = bundle.rooms.rows.find((r) => r != null && String(r.id) === String(roomId));
  const pageTitle =
    (roomRow && typeof roomRow.title === "string" && roomRow.title) ||
    (roomRow && typeof (roomRow as { topic?: string }).topic === "string" && (roomRow as { topic: string }).topic) ||
    "질문방";

  return (
    <PageScaffold
      eyebrow="질문방"
      title={pageTitle}
      description="멘토와 궁금한 점을 남기고, 답변을 주고받을 수 있어요."
      ctas={[
        { href: "/question-room", label: "질문방 목록", tone: "slate" },
        { href: "/notes", label: "노트", tone: "blue" },
      ]}
      sections={[]}
      dataPoints={[]}
    >
      <QuestionRoomWorkspace
        variant="student"
        surface="detail"
        currentUserId={user.id}
        actionFeedback={{ kind: feedbackKind, ok: okMessage, error: errorMessage }}
        title="질문방"
        subtitle=""
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
