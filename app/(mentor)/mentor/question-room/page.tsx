import { PageScaffold } from "@/components/shell/PageScaffold";
import { QuestionRoomWorkspace } from "@/components/qna/QuestionRoomWorkspace";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadQuestionRoomListBundle } from "@/lib/qna/questionRoomQueries";

export default async function MentorQuestionRoomListPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const bundle = await loadQuestionRoomListBundle(supabase, "mentor", user.id);

  return (
    <PageScaffold
      eyebrow="질문방"
      title="답변 대기"
      description="연결된 학생의 질문방이 이곳에 모입니다. 방을 열고 질문에 답하고 안내를 이어가요."
      ctas={[
        { href: "/mentor/question-room#question-rooms", label: "답변 대기 보기", tone: "blue" },
        { href: "/mentor/dashboard", label: "대시보드", tone: "slate" },
        { href: "/mentor/support/disputes", label: "분쟁", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
      hideFooterPlaceholderCards
    >
      <QuestionRoomWorkspace
        variant="mentor"
        surface="list"
        title="질문방 목록"
        subtitle="학생이 남긴 질문은 방·스레드·대화로 이어집니다. 아래에서 방을 고르면 상세로 이동해 답할 수 있어요."
        rooms={bundle.rooms}
        threads={bundle.threads}
        messages={bundle.messages}
        notes={bundle.notes}
        buildRoomHref={(roomId) => `/mentor/question-room/${roomId}`}
        buildThreadHref={(roomId, threadId) => `/mentor/question-room/${roomId}?thread=${encodeURIComponent(threadId)}`}
      />
    </PageScaffold>
  );
}
