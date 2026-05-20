import { MentorReviewsManage } from "@/components/mentor/MentorReviewsManage";
import { requireRole } from "@/lib/auth/routeGuard";
import { listMentorReceivedReviews } from "@/lib/reviews/reviewQueries";
import { createClient } from "@/lib/supabase/server";

export default async function MentorReviewsPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const items = await listMentorReceivedReviews(supabase, user.id, 50);
  return <MentorReviewsManage initialItems={items} />;
}
