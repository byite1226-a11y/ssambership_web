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
      description="질문·구독·결제·맞춤의뢰로 이어질 ‘오늘 해야 할 일’ 허브(연결·probe 우선, 더미 없음)."
      ctas={[
        { href: "/question-room", label: "질문방", tone: "blue" },
        { href: "/subscriptions", label: "구독", tone: "slate" },
        { href: "/custom-request", label: "맞춤의뢰", tone: "slate" },
      ]}
      sections={[
        {
          title: "mentor_student_rooms",
          body: data.rooms.error ?? `${data.rooms.rows?.length ?? 0} rooms`,
          status: data.rooms.error ? "skeleton" : "connected",
        },
        {
          title: "question_threads",
          body: data.threadStats.error ?? `열림 ${data.threadStats.openThreads} · room ${data.threadStats.roomsSampled}곳 샘플`,
          status: data.threadStats.error ? "skeleton" : "connected",
        },
        {
          title: "subscriptions / payments",
          body: `${data.mypage.subscriptions.detail} / ${data.mypage.payments.detail}`,
          status: data.mypage.subscriptions.status === "skeleton" || data.mypage.payments.status === "skeleton" ? "skeleton" : "connected",
        },
        { title: "notifications", body: data.mypage.notifications.detail, status: data.mypage.notifications.status === "skeleton" ? "skeleton" : "connected" },
      ]}
      emptyState="room·구독·결제가 비어 있으면 CTA로 탐색을 유도합니다."
      loadingState="(student)/home/loading — 서버 조회 중"
      errorState="섹션별 Supabase/RLS 메시지 — 실시간·알림 목록은 후속"
      dataPoints={[...STUDENT_HOME_DATA_MODEL]}
    >
      <StudentHomeBody data={data} />
    </PageScaffold>
  );
}
