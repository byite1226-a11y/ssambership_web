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
      hideHero
      eyebrow="질문방"
      title=""
      description=""
      ctas={[]}
      sections={[]}
      dataPoints={[]}
      hideFooterPlaceholderCards
    >
      <div className="rounded-2xl bg-slate-50/50 p-3 sm:p-4">
        <QuestionRoomWorkspace
          variant="student"
          surface="list"
          title="나의 질문방"
          subtitle="멘토와 연결되면 방이 열립니다. 답변이 오면 확인이 필요한지, 아직 기다리는지 카드에서 바로 볼 수 있어요."
          rooms={bundle.rooms}
          threads={bundle.threads}
          messages={bundle.messages}
          notes={bundle.notes}
          listPreviewsByRoomId={bundle.listPreviewsByRoomId}
          listStartQuestion={{ href: "/mentors", label: "질문 시작하기" }}
          listSecondaryCta={{ href: "/subscriptions", label: "구독·멤버십" }}
          roomHrefBase="/question-room"
        />
      </div>
    </PageScaffold>
  );
}
