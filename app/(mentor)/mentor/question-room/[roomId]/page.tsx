import { notFound } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { QuestionRoomWorkspace } from "@/components/qna/QuestionRoomWorkspace";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadQuestionRoomDetailBundle, loadQuestionRoomListBundle, userCanAccessMentorStudentRoom } from "@/lib/qna/questionRoomQueries";
import {
  loadMentorUnreadCountsByRoomId,
  loadStudentDisplaysForQuestionRooms,
} from "@/lib/qna/questionRoomMentorContext";
import {
  loadLastMessageByThreadId,
  loadMessageCountsByThreadId,
  loadQuestionRoomSubscriptionContext,
} from "@/lib/qna/questionRoomStudentContext";
import { fetchWeeklyQuestionUsageWithFallback } from "@/lib/qna/weeklyQuestionUsage";
import { partyUserIdFromRoomRow } from "@/lib/qna/questionRoomUiLabels";
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
  const dMessageQ = paramToDraft(typeof sp.dMessage === "string" ? sp.dMessage : undefined);
  const draftMessageBody = feedbackKind === "message" && rawActionError ? (dMessageQ ?? "") : undefined;
  const formRevision = typeof sp.t === "string" && sp.t.length ? sp.t : "0";

  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const allowed = await userCanAccessMentorStudentRoom(supabase, user.id, "mentor", roomId);
  if (!allowed) {
    notFound();
  }

  const [listBundle, detail] = await Promise.all([
    loadQuestionRoomListBundle(supabase, "mentor", user.id),
    loadQuestionRoomDetailBundle(supabase, user.id, "mentor", roomId, threadFromQuery),
  ]);
  const { resolvedThreadId, ...bundle } = detail;

  const threadIds = bundle.threads.rows
    .map((t) => (t?.id != null ? String(t.id) : ""))
    .filter((id) => id.length > 0);
  const roomIds = listBundle.rooms.rows
    .map((r) => (r?.id != null ? String(r.id) : ""))
    .filter((id) => id.length > 0);

  const [studentDisplays, messageCountsByThreadId, lastMessageByThreadId, unreadCountsByRoomId] =
    await Promise.all([
      loadStudentDisplaysForQuestionRooms(supabase, listBundle.rooms.rows),
      loadMessageCountsByThreadId(supabase, threadIds),
      loadLastMessageByThreadId(supabase, threadIds),
      loadMentorUnreadCountsByRoomId(supabase, roomIds),
    ]);

  const initialNoteText = extractNoteText(bundle.notes.rows[0]);

  // 이 학생의 구독 요금제·이번 주 잔여 질문(읽기 전용 표시용). 기존 학생 로직 재사용.
  const currentRoom = listBundle.rooms.rows.find((r) => r && String(r.id) === String(roomId)) ?? null;
  const studentId = currentRoom ? partyUserIdFromRoomRow(currentRoom, "student") : null;
  const [subscriptionContext, weeklyUsageResult] = studentId
    ? await Promise.all([
        loadQuestionRoomSubscriptionContext(supabase, studentId, currentRoom),
        fetchWeeklyQuestionUsageWithFallback(supabase, studentId, user.id),
      ])
    : [null, null];
  const studentWeeklyUsage = weeklyUsageResult?.usage ?? null;

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
        rooms={listBundle.rooms}
        threads={bundle.threads}
        messages={bundle.messages}
        notes={bundle.notes}
        roomId={roomId}
        threadId={resolvedThreadId}
        listPreviewsByRoomId={listBundle.listPreviewsByRoomId}
        studentDisplays={studentDisplays}
        messageCountsByThreadId={messageCountsByThreadId}
        lastMessageByThreadId={lastMessageByThreadId}
        unreadCountsByRoomId={unreadCountsByRoomId}
        roomHrefBase="/mentor/question-room"
        initialNoteText={initialNoteText}
        draftMessageBody={draftMessageBody}
        formRevision={formRevision}
        subscriptionContext={subscriptionContext}
        studentWeeklyUsage={studentWeeklyUsage}
      />
    </PageScaffold>
  );
}
