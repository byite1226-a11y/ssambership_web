import { PageScaffold } from "@/components/shell/PageScaffold";
import { QuestionRoomWorkspace } from "@/components/qna/QuestionRoomWorkspace";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadQuestionRoomListBundle } from "@/lib/qna/questionRoomQueries";

export default async function StudentQuestionRoomListPage() {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const bundle = await loadQuestionRoomListBundle(supabase, "student", user.id);

  return (
    <PageScaffold
      eyebrow="질문방"
      title="나의 질문방"
      description="멘토와 연결되면 이곳에 질문방이 열립니다. 방을 열고 질문과 답변을 이어가요."
      ctas={[
        { href: "/mentors", label: "질문하기", tone: "blue" },
        { href: "/notes", label: "연결 노트", tone: "slate" },
        { href: "/subscriptions", label: "구독", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
    >
      <QuestionRoomWorkspace
        variant="student"
        surface="list"
        title="질문방 목록"
        subtitle="멘토와의 대화는 방마다 이어집니다. 아래에서 방을 고른 뒤, 상세 화면에서 질문을 이어가세요."
        rooms={bundle.rooms}
        threads={bundle.threads}
        messages={bundle.messages}
        notes={bundle.notes}
        buildRoomHref={(roomId) => `/question-room/${roomId}`}
        buildThreadHref={(roomId, threadId) => `/question-room/${roomId}?thread=${encodeURIComponent(threadId)}`}
      />
    </PageScaffold>
  );
}
