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
      eyebrow="Mentor / Question Room"
      title="멘토 질문방"
      description="멘토 기준 room을 탐색합니다. thread/message는 room 아래에서 분기하고, connection note는 room 단위로 별도 추적합니다."
      ctas={[
        { href: "/mentor/dashboard", label: "대시보드", tone: "slate" },
        { href: "/mentor/support/disputes", label: "분쟁", tone: "blue" },
      ]}
      sections={[
        { title: "Room 리스트", body: "mentor_student_rooms(멘토 기준) — Supabase select.", status: "connected" },
        { title: "Thread 목록", body: "question_threads — room 상세에서 조회(목록은 room만).", status: "connected" },
        { title: "Message (선택 thread)", body: "question_messages — room 상세에서 thread 선택 후 조회.", status: "connected" },
        { title: "Connection note( room )", body: "connection_notes — room 상세에서 room_id 기준 조회.", status: "connected" },
      ]}
      emptyState="배정 room이 없으면 프로필/채널/노출 설정을 점검합니다."
      loadingState="loading.tsx"
      errorState="오류는 패널 배너로 표시합니다."
      dataPoints={["mentor_student_rooms", "question_threads", "question_messages", "connection_notes"]}
    >
      <QuestionRoomWorkspace
        variant="mentor"
        surface="list"
        title="멘토 질문방 워크스페이스"
        subtitle="목록: room만 Supabase로 채웁니다. thread/message/notes는 room 상세에서 연결합니다."
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
