import { redirect } from "next/navigation";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityShortformUploadForm } from "@/components/community/CommunityShortformUploadForm";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { listPopularHashtags } from "@/lib/community/communityBoardQueries";
import { communitySidebarStatsForUser, loadCommunityPopularMentors } from "@/lib/community/communitySidebarData";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CommunityShortformNewPage(props: Props) {
  const { user, profile } = await getServerUserWithProfile();
  if (!user) redirect(`/login?next=${encodeURIComponent("/community/shortform/new")}`);
  if (profile?.role !== "mentor") redirect("/community/shortform?error=mentor_only");

  const sp = (await props.searchParams) ?? {};
  const errorCode = typeof sp.error === "string" ? sp.error : null;
  const draftSaved = sp.draft === "1";

  const supabase = await createClient();
  const [tags, mentors, sidebarStats] = await Promise.all([
    listPopularHashtags(supabase, 6),
    loadCommunityPopularMentors(supabase),
    communitySidebarStatsForUser(supabase, user.id),
  ]);

  return (
    <CommunityLayoutShell
      activeNav="shortform"
      rightAsidePromo="shortform"
      sidebarStats={sidebarStats}
      hashtags={tags.rows}
      popularMentors={mentors}
    >
      <CommunityShortformUploadForm errorCode={errorCode} draftSaved={draftSaved} />
    </CommunityLayoutShell>
  );
}
