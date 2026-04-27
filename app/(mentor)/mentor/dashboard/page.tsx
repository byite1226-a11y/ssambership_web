import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorDashboardBody } from "@/components/home/MentorDashboardBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadMentorDashboardData, MENTOR_DASHBOARD_DATA_MODEL } from "@/lib/home/mentorDashboardQueries";

export default async function MentorDashboardPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const data = await loadMentorDashboardData(supabase, user.id);

  return (
    <PageScaffold
      eyebrow="Mentor / Dashboard"
      title="멘토 홈(대시보드)"
      description="답변 큐·연결 room·정산·맞춤의뢰를 한 화면에 묶는 허브(휴리스틱/재사용 쿼리, 더미 없음)."
      ctas={[
        { href: "/mentor/question-room", label: "질문방 관리", tone: "green" },
        { href: "/mentor/support/disputes", label: "분쟁·환불", tone: "blue" },
        { href: "/mentor/payouts", label: "정산", tone: "slate" },
        { href: "/mentor/profile", label: "프로필", tone: "slate" },
        { href: "/mentor/community/new", label: "커뮤니티 글쓰기", tone: "slate" },
      ]}
      sections={[
        {
          title: "question_threads (큐)",
          body: data.threadStats.error ?? `답변 추정 ${data.threadStats.mentorQueueEstimate} / 열림 ${data.threadStats.openThreads}`,
          status: data.threadStats.error || data.rooms.error ? "skeleton" : "connected",
        },
        {
          title: "payouts",
          body: data.payouts.payoutError ?? data.payouts.tableHint,
          status: data.payouts.payoutTable ? "connected" : "skeleton",
        },
        {
          title: "custom_request_orders",
          body: data.customRecent.probe,
          status: data.customRecent.error ? "skeleton" : "connected",
        },
        { title: "notifications", body: data.notifyProbe.detail, status: data.notifyProbe.status === "skeleton" ? "skeleton" : "connected" },
      ]}
      emptyState="질문·정산·맞춤의뢰가 없을 때 프로필/채널 CTA"
      loadingState="(mentor)/mentor/dashboard/loading"
      errorState="섹션별 RLS/스키마 메시지, 실시간·차트는 후속"
      dataPoints={[...MENTOR_DASHBOARD_DATA_MODEL]}
    >
      <MentorDashboardBody data={data} />
    </PageScaffold>
  );
}
