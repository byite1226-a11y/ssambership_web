import { MentorPayoutsSummaryView } from "@/components/mentor/MentorPayoutsSummaryView";
import { requireRole } from "@/lib/auth/routeGuard";
import { loadMentorPayoutMonthlyCards, loadMentorPayoutSummary } from "@/lib/mentor/mentorPayoutsService";
import { createClient } from "@/lib/supabase/server";

export default async function MentorPayoutsPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const [summary, months] = await Promise.all([
    loadMentorPayoutSummary(supabase, user.id),
    loadMentorPayoutMonthlyCards(supabase, user.id, 6),
  ]);

  return <MentorPayoutsSummaryView summary={summary} months={months} />;
}
