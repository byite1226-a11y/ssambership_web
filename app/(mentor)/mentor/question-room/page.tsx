import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorQuestionRoomDashboard } from "@/components/qna/MentorQuestionRoomDashboard";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadQuestionRoomListBundle } from "@/lib/qna/questionRoomQueries";

export default async function MentorQuestionRoomListPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const bundle = await loadQuestionRoomListBundle(supabase, "mentor", user.id);

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
      <MentorQuestionRoomDashboard
        rooms={bundle.rooms}
        listPreviewsByRoomId={bundle.listPreviewsByRoomId}
        roomHrefBase="/mentor/question-room"
      />
    </PageScaffold>
  );
}
