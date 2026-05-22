import { MentorsListBody } from "@/components/mentor/MentorsListBody";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { loadFavoriteMentorIdsForUser } from "@/lib/mentor/mentorFavorites";
import { parseMentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import { loadPublicMentorsList } from "@/lib/mentor/publicMentorsListQueries";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MentorsPage(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const filters = parseMentorsListFilters(sp);
  const supabase = await createClient();
  const list = await loadPublicMentorsList(supabase, filters);

  const { user } = await getServerUserWithProfile();
  const favoriteIds: string[] = [];
  if (user) {
    const fav = await loadFavoriteMentorIdsForUser(supabase, user.id);
    favoriteIds.push(...fav.ids);
  }

  if (list.usersError) {
    console.error("[mentors] PUBLIC MENTOR LIST (USERS) ERROR:", list.usersError, "PROBES:", list.probes);
  }
  if (list.profilesError) {
    console.error("[mentors] PUBLIC MENTOR PROFILE ERROR:", list.profilesError, "PROBES:", list.probes);
  }

  return (
    <MentorsListBody
      filters={filters}
      list={list}
      favoriteIds={favoriteIds}
      isLoggedIn={Boolean(user)}
    />
  );
}
