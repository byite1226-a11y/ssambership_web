import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { QuestionRoomWorkspace } from "@/components/qna/QuestionRoomWorkspace";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadQuestionRoomListBundle } from "@/lib/qna/questionRoomQueries";
import { loadMentorDisplaysForQuestionRooms } from "@/lib/qna/questionRoomStudentDisplay";

export default async function StudentQuestionRoomListPage() {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const bundle = await loadQuestionRoomListBundle(supabase, "student", user.id);

  const firstRoomId = bundle.rooms.rows[0]?.id;
  if (firstRoomId != null && String(firstRoomId).length > 0) {
    redirect(`/question-room/${encodeURIComponent(String(firstRoomId))}`);
  }

  const mentorDisplays = await loadMentorDisplaysForQuestionRooms(supabase, bundle.rooms.rows);

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
        variant="student"
        surface="list"
        title="구독 질문방"
        subtitle="멘토를 구독하면 질문방이 열립니다."
        rooms={bundle.rooms}
        threads={bundle.threads}
        messages={bundle.messages}
        notes={bundle.notes}
        listPreviewsByRoomId={bundle.listPreviewsByRoomId}
        mentorDisplays={mentorDisplays}
        listStartQuestion={{ href: "/mentors", label: "질문방 구독하기" }}
        listSecondaryCta={{ href: "/subscriptions", label: "구독·멤버십" }}
        roomHrefBase="/question-room"
      />
    </PageScaffold>
  );
}
