import { notFound } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { QuestionRoomWorkspace } from "@/components/qna/QuestionRoomWorkspace";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadQuestionRoomDetailBundle, userCanAccessMentorStudentRoom } from "@/lib/qna/questionRoomQueries";
import { extractNoteText } from "@/lib/qna/questionRoomMutations";
import { paramToDraft } from "@/lib/qna/draftQuery";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

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
  const rawActionError = typeof sp.error === "string" && sp.error.length ? sp.error : null;
  const errorMessageUi = rawActionError ? mapDataErrorMessage(rawActionError) : null;
  const feedbackKind = sp.kind === "thread" || sp.kind === "message" || sp.kind === "note" ? sp.kind : undefined;
  const dThreadQ = paramToDraft(typeof sp.dThread === "string" ? sp.dThread : undefined);
  const dMessageQ = paramToDraft(typeof sp.dMessage === "string" ? sp.dMessage : undefined);
  const dNoteQ = paramToDraft(typeof sp.dNote === "string" ? sp.dNote : undefined);

  const draftThreadTitle = feedbackKind === "thread" && rawActionError ? (dThreadQ ?? "") : undefined;
  const draftMessageBody = feedbackKind === "message" && rawActionError ? (dMessageQ ?? "") : undefined;
  const draftNoteBody = feedbackKind === "note" && rawActionError ? (dNoteQ ?? "") : undefined;
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
      hideHero
      eyebrow="질문방"
      title=""
      description=""
      ctas={[]}
      sections={[]}
      dataPoints={[]}
      hideFooterPlaceholderCards
    >
      <QuestionRoomWorkspace
        variant="mentor"
        surface="detail"
        currentUserId={user.id}
        actionFeedback={{ kind: feedbackKind, ok: okMessage, error: errorMessageUi }}
        title="질문방"
        subtitle=""
        rooms={bundle.rooms}
        threads={bundle.threads}
        messages={bundle.messages}
        notes={bundle.notes}
        roomId={roomId}
        threadId={activeThreadId}
        roomHrefBase="/mentor/question-room"
        initialNoteText={initialNoteText}
        draftThreadTitle={draftThreadTitle}
        draftMessageBody={draftMessageBody}
        draftNoteBody={draftNoteBody}
        formRevision={formRevision}
      />
    </PageScaffold>
  );
}
