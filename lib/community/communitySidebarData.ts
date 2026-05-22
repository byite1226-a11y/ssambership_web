import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommunityPopularMentor, CommunitySidebarStats } from "@/components/community/CommunityNavTypes";
import { defaultMentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import { loadPublicMentorsList } from "@/lib/mentor/publicMentorsListQueries";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

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
    school: c.display.university?.trim() || null,
    priceLabel:
      c.minPriceKrw != null ? `${c.minPriceKrw.toLocaleString("ko-KR")}캐시~` : null,
    subject: c.display.subjects?.split(/[,·]/)[0]?.trim() || null,
  }));
}

export async function communitySidebarStatsForUser(
  supabase: SupabaseClient,
  userId: string | null
): Promise<CommunitySidebarStats> {
  if (!userId) return { points: 0, badges: 0 };

  const statTables = ["community_user_stats", "user_community_stats", "community_profiles"] as const;
  for (const table of statTables) {
    const { error: pe } = await supabase.from(table).select("user_id").limit(1);
    if (pe) continue;
    const { column: uid } = await pickExistingColumn(supabase, table, ["user_id", "id"]);
    if (!uid) continue;
    const { data, error } = await supabase.from(table).select("*").eq(uid, userId).maybeSingle();
    if (error || !data) continue;
    const row = data as Row;
    const points =
      typeof row.points === "number"
        ? row.points
        : typeof row.community_points === "number"
          ? row.community_points
          : typeof row.point_balance === "number"
            ? row.point_balance
            : 0;
    const badges =
      typeof row.badge_count === "number"
        ? row.badge_count
        : typeof row.badges === "number"
          ? row.badges
          : typeof row.badge_total === "number"
            ? row.badge_total
            : 0;
    return { points: Math.max(0, Math.round(points)), badges: Math.max(0, Math.round(badges)) };
  }

  const badgeTables = ["user_badges", "community_user_badges"] as const;
  let badgeCount = 0;
  for (const table of badgeTables) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) continue;
    const { column: uid } = await pickExistingColumn(supabase, table, ["user_id"]);
    if (!uid) continue;
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(uid, userId);
    if (!error && count != null) {
      badgeCount = count;
      break;
    }
  }

  return { points: 0, badges: badgeCount };
}
