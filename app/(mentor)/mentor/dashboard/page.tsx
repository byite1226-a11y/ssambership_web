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
    <PageScaffold hideHero hideFooterPlaceholderCards sections={[]} ctas={[]} dataPoints={[]}>
      <MentorDashboardBody data={data} />
    </PageScaffold>
  );
}
