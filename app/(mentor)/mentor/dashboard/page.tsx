import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorDashboardPage } from "@/components/mentor/dashboard/MentorDashboardPage";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadMentorHubDashboardData } from "@/lib/mentor/dashboard/mentorHubDashboardQueries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MentorDashboardRoutePage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const data = await loadMentorHubDashboardData(supabase, user.id);

  return (
    <PageScaffold hideHero hideFooterPlaceholderCards sections={[]} ctas={[]} dataPoints={[]}>
      <MentorDashboardPage data={data} />
    </PageScaffold>
  );
}
