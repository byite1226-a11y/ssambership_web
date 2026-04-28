import { PageScaffold } from "@/components/shell/PageScaffold";
import { StudentHomeBody } from "@/components/home/StudentHomeBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadStudentHomeData, STUDENT_HOME_DATA_MODEL } from "@/lib/home/studentHomeQueries";

export default async function StudentHomePage() {
  const { user, profile } = await requireRole("student");
  const supabase = await createClient();
  const data = await loadStudentHomeData(supabase, {
    userId: user.id,
    profile: profile ?? null,
    profileError: null,
  });

  return (
    <PageScaffold
      eyebrow="Student / Home"
      title="학생 홈"
      description="질문·구독·결제·맞춤의뢰로 이어지는 ‘오늘 할 일’을 한곳에서 확인하세요."
      ctas={[
        { href: "/question-room", label: "질문방", tone: "blue" },
        { href: "/subscriptions", label: "구독", tone: "slate" },
        { href: "/custom-request", label: "맞춤의뢰", tone: "slate" },
      ]}
      sections={[
        {
          title: "질문방",
          body: data.rooms.error
            ? "질문방 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
            : `질문방 ${data.rooms.rows?.length ?? 0}곳 · 멘토와 이어진 대화 방이에요`,
          status: data.rooms.error ? "skeleton" : "connected",
        },
        {
          title: "진행 중인 질문",
          body: data.threadStats.error
            ? "진행 중인 질문을 집계하지 못했어요. 잠시 후 다시 시도해 주세요."
            : `답변을 기다리는 질문 ${data.threadStats.openThreads}건 · ${data.threadStats.roomsSampled}곳에서 모았어요`,
          status: data.threadStats.error ? "skeleton" : "connected",
        },
        {
          title: "구독·결제",
          body: `구독: ${data.mypage.subscriptions.detail} · 결제: ${data.mypage.payments.detail}`,
          status: data.mypage.subscriptions.status === "skeleton" || data.mypage.payments.status === "skeleton" ? "skeleton" : "connected",
        },
        {
          title: "알림",
          body: data.mypage.notifications.detail,
          status: data.mypage.notifications.status === "skeleton" ? "skeleton" : "connected",
        },
      ]}
      emptyState="질문방·구독·결제가 아직 없을 때는 아래 버튼으로 이동해 보세요."
      loadingState="홈 정보를 불러오는 중이에요."
      errorState="일부 정보를 불러오지 못했을 때는 잠시 후 다시 시도해 주세요."
      dataPoints={[...STUDENT_HOME_DATA_MODEL]}
    >
      <StudentHomeBody data={data} />
    </PageScaffold>
  );
}
