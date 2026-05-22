import Link from "next/link";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityShortformCategoryTabs } from "@/components/community/CommunityShortformCategoryTabs";
import { CommunityShortformVideoCard } from "@/components/community/CommunityShortformVideoCard";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { listShortformFeed } from "@/lib/community/communityShortformQueries";
import type { ShortformCategorySlug } from "@/lib/community/communityShortformConstants";
import { listPopularHashtags } from "@/lib/community/communityBoardQueries";
import { communitySidebarStatsForUser, loadCommunityPopularMentors } from "@/lib/community/communitySidebarData";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CommunityShortformPage(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const category = (typeof sp.category === "string" ? sp.category : "all") as ShortformCategorySlug;
  const { user, profile } = await getServerUserWithProfile();
  const supabase = await createClient();
  const [{ items, error }, tags, mentors, sidebarStats] = await Promise.all([
    listShortformFeed(supabase, { category, limit: 48 }),
    listPopularHashtags(supabase, 6),
    loadCommunityPopularMentors(supabase),
    communitySidebarStatsForUser(supabase, user?.id ?? null),
  ]);

  const isMentor = profile?.role === "mentor";

  return (
    <CommunityLayoutShell
      activeNav="shortform"
      rightAsidePromo="shortform"
      sidebarStats={sidebarStats}
      hashtags={tags.rows}
      popularMentors={mentors}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900">{"\uC877\uD3FC"}</h1>
          <p className="mt-1 text-sm text-slate-600">{"\uBA58\uD1A0\uC758 \uC9E7\uC740 \uD559\uC2B5 \uC601\uC0C1\uC744 \uB458\uB7EC\uBCF4\uC138\uC694."}</p>
        </div>
        {isMentor ? (
          <Link
            href="/community/shortform/new"
            className="rounded-xl bg-[#1A56DB] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90"
          >
            {"\uC5C5\uB85C\uB4DC"}
          </Link>
        ) : null}
      </header>

      <CommunityShortformCategoryTabs active={category} />

      {error ? (
        <p className="text-sm text-slate-600">{"\uC877\uD3FC \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."}</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          {"\uB4F1\uB85D\uB41C \uC877\uD3FC\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}
        </p>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <CommunityShortformVideoCard key={item.id} item={item} href={`/community/shortform/${item.id}`} />
          ))}
        </ul>
      )}
    </CommunityLayoutShell>
  );
}
