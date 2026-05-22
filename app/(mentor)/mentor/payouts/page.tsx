import { MentorPayoutsPage } from "@/components/mentor/payouts/MentorPayoutsPage";
import { requireRole } from "@/lib/auth/routeGuard";
import { loadMentorPayoutsPageData } from "@/lib/mentor/mentorPayoutsService";
import { createClient } from "@/lib/supabase/server";

export default async function MentorPayoutsRoutePage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const data = await loadMentorPayoutsPageData(supabase, user.id);

  return <MentorPayoutsPage data={data} />;
}
