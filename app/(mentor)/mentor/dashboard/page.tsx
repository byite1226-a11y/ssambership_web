import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorDashboardBody } from "@/components/home/MentorDashboardBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadMentorDashboardData } from "@/lib/home/mentorDashboardQueries";

export default async function MentorDashboardPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const data = await loadMentorDashboardData(supabase, user.id);

  return (
    <PageScaffold
      eyebrow="멘토"
      title="멘토 홈"
      description="질문 답변, 맞춤의뢰·주문, 정산·알림을 한곳에서 확인합니다."
      ctas={[
        { href: "/mentor/question-room", label: "질문방 관리", tone: "green" },
        { href: "/mentor/support/disputes", label: "분쟁·환불", tone: "blue" },
        { href: "/mentor/payouts", label: "정산", tone: "slate" },
        { href: "/mentor/profile", label: "프로필", tone: "slate" },
        { href: "/mentor/community/new", label: "커뮤니티 글쓰기", tone: "slate" },
      ]}
      sections={[]}
    >
      <MentorDashboardBody data={data} />
    </PageScaffold>
  );
}
