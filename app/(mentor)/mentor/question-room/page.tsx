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
          variant="mentor"
          surface="list"
          title="학생 질문방"
          subtitle="연결된 학생의 질문이 모입니다. 답변이 필요한 방과 학생 확인을 기다리는 방을 탭으로 나눠 볼 수 있어요."
          rooms={bundle.rooms}
          threads={bundle.threads}
          messages={bundle.messages}
          notes={bundle.notes}
          listPreviewsByRoomId={bundle.listPreviewsByRoomId}
          listStartQuestion={{ href: "/mentor/dashboard", label: "대시보드" }}
          listSecondaryCta={{ href: "/mentor/channel", label: "채널" }}
          roomHrefBase="/mentor/question-room"
        />
      </div>
    </PageScaffold>
  );
}
