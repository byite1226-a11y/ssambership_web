import { MentorPayoutsDetailView } from "@/components/mentor/MentorPayoutsDetailView";
import { requireRole } from "@/lib/auth/routeGuard";

export default async function MentorPayoutsDetailPage() {
  await requireRole("mentor");
  return <MentorPayoutsDetailView />;
}
