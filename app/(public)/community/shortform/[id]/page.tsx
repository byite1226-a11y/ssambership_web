import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityShortformDetailView } from "@/components/community/CommunityShortformDetailView";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { isCommunityPostUuid, loadCommunityComments } from "@/lib/community/communityQueries";
import { getShortformDetail, incrementShortformView } from "@/lib/community/communityShortformQueries";
import { listPopularHashtags } from "@/lib/community/communityBoardQueries";
import { communitySidebarStatsForUser, loadCommunityPopularMentors } from "@/lib/community/communitySidebarData";

type Props = { params: Promise<{ id: string }> };

export default async function CommunityShortformDetailPage(props: Props) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { user } = await getServerUserWithProfile();
  const idOk = isCommunityPostUuid(id);

  let item = null;
  let loadError: string | null = null;
  if (idOk) {
    const res = await getShortformDetail(supabase, id);
    if (res.error) loadError = "\uC877\uD3FC\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
    else if (res.item) {
      item = res.item;
      await incrementShortformView(supabase, id);
    }
  }

  const { rows: comments } = item ? await loadCommunityComments(supabase, "shortform", id) : { rows: [] };
  const returnPath = `/community/shortform/${id}`;
  const [tags, mentors, sidebarStats] = await Promise.all([
    listPopularHashtags(supabase, 6),
    loadCommunityPopularMentors(supabase),
    communitySidebarStatsForUser(supabase, user?.id ?? null),
  ]);

  return (
    <CommunityLayoutShell
      activeNav="shortform"
      rightAsidePromo="shortform"
      sidebarStats={sidebarStats}
      hashtags={tags.rows}
      popularMentors={mentors}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {loadError ? <p className="text-sm font-semibold text-red-800">{loadError}</p> : null}
        {!item && !loadError ? <p className="text-sm text-slate-600">{"\uC877\uD3FC\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."}</p> : null}
        {item ? (
          <CommunityShortformDetailView
            item={item}
            postId={id}
            returnPath={returnPath}
            comments={comments}
            canComment={user != null}
          />
        ) : null}
      </div>
    </CommunityLayoutShell>
  );
}
