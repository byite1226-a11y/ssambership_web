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
      eyebrow="Student / Question Room"
      title="질문방"
      description="room → thread → message 흐름을 유지합니다. connection note는 room 단위로 별도 패널에서 다룹니다(단일 채팅 리스트로 합치지 않음)."
      ctas={[
        { href: "/mentors", label: "멘토 찾아 질문 시작", tone: "blue" },
        { href: "/notes", label: "연결노트( room 단위 )", tone: "slate" },
      ]}
      sections={[
        { title: "Room 리스트", body: "mentor_student_rooms(학생 기준) — Supabase select.", status: "connected" },
        { title: "Thread 목록", body: "question_threads — room 상세에서 조회(목록은 room만).", status: "connected" },
        { title: "Message (선택 thread)", body: "question_messages — room 상세에서 thread 선택 후 조회.", status: "connected" },
        { title: "Connection note( room )", body: "connection_notes — room 상세에서 room_id 기준 조회.", status: "connected" },
      ]}
      emptyState="질문방이 없으면 멘토 상세/구독(subscribe)로 전환 CTA를 제공합니다."
      loadingState="loading.tsx"
      errorState="RLS/권한/네트워크 오류는 패널 상단 배너로 표시합니다."
      dataPoints={["mentor_student_rooms", "question_threads", "question_messages", "connection_notes(room_id)"]}
    >
      <QuestionRoomWorkspace
        variant="student"
        surface="list"
        title="질문방 워크스페이스"
        subtitle="목록: room만 Supabase로 채웁니다. thread/message/notes는 room 상세에서 연결합니다."
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
