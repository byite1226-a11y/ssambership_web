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
      description="답변할 질문, 질문방, 정산, 맞춤의뢰를 한 화면에서 바로 확인하세요."
      ctas={[
        { href: "/mentor/question-room", label: "질문방 관리", tone: "green" },
        { href: "/mentor/custom-request/dashboard", label: "맞춤의뢰", tone: "blue" },
        { href: "/mentor/support/disputes", label: "분쟁·환불", tone: "blue" },
        { href: "/mentor/payouts", label: "정산", tone: "slate" },
        { href: "/mentor/profile", label: "프로필", tone: "slate" },
        { href: "/mentor/community/new", label: "커뮤니티 글쓰기", tone: "slate" },
      ]}
      sections={[
        {
          title: "답변·처리",
          body: data.threadStats.error
            ? "답변·처리 현황을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
            : `처리 예정 ${data.threadStats.mentorQueueEstimate}건 · 진행 중인 질문 ${data.threadStats.openThreads}건`,
          status: data.threadStats.error || data.rooms.error ? "skeleton" : "connected",
        },
        {
          title: "정산",
          body: data.payouts.payoutError ?? data.payouts.tableHint,
          status: data.payouts.payoutTable ? "connected" : "skeleton",
        },
        {
          title: "맞춤의뢰",
          body: data.customRecent.error
            ? "맞춤의뢰를 불러오는 중 문제가 있어요"
            : data.customRecent.rows.length > 0
              ? `최근 맞춤의뢰 ${data.customRecent.rows.length}건`
              : "최근 맞춤의뢰가 없어요",
          status: data.customRecent.error ? "skeleton" : "connected",
        },
        { title: "알림", body: data.notifyProbe.detail, status: data.notifyProbe.status === "skeleton" ? "skeleton" : "connected" },
      ]}
      emptyState="질문·정산이 없을 때는 프로필·채널로 안내하세요."
      loadingState="대시보드를 불러오는 중이에요."
      errorState="일부 정보를 불러오지 못했을 때는 잠시 후 다시 시도해 주세요."
      dataPoints={[...MENTOR_DASHBOARD_DATA_MODEL]}
    >
      <MentorDashboardBody data={data} />
    </PageScaffold>
  );
}
