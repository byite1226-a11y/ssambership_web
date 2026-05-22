import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommunityPopularMentor } from "@/components/community/CommunityNavTypes";
import { defaultMentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import { loadPublicMentorsList } from "@/lib/mentor/publicMentorsListQueries";

export async function loadCommunityPopularMentors(
  supabase: SupabaseClient
): Promise<CommunityPopularMentor[]> {
  const { cards } = await loadPublicMentorsList(
    supabase,
    defaultMentorsListFilters({ sort: "review", page: 1 }),
    { pageSize: 5, fetchLimit: 20 }
  );
  return cards.slice(0, 5).map((c, i) => ({
    id: c.mentorId,
    name: c.display.displayName,
    rank: i + 1,
    subject: c.display.subjects?.split(/[,·]/)[0]?.trim() || c.display.intro?.slice(0, 24) || null,
  }));
}

export function communitySidebarStatsForUser(_userId: string | null): { points: number; badges: number } {
  return { points: 120, badges: 3 };
}
