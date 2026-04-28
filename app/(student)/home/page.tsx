import { PageScaffold } from "@/components/shell/PageScaffold";
import { StudentHomeBody } from "@/components/home/StudentHomeBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadStudentHomeData } from "@/lib/home/studentHomeQueries";

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
      eyebrow="학생"
      title="학생 홈"
      description="질문방, 구독, 맞춤의뢰로 이어지는 오늘의 할 일을 모아 보여 줍니다."
      ctas={[
        { href: "/question-room", label: "질문방", tone: "blue" },
        { href: "/subscriptions", label: "구독", tone: "slate" },
        { href: "/custom-request", label: "맞춤의뢰", tone: "slate" },
      ]}
      sections={[]}
    >
      <StudentHomeBody data={data} />
    </PageScaffold>
  );
}
