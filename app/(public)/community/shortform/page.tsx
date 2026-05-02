import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { CommunityShortformTabs, parseShortformTab } from "@/components/community/CommunityShortformTabs";
import { CommunityShortformVideoCard } from "@/components/community/CommunityShortformVideoCard";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { buildCommunityHeroCtas } from "@/lib/community/communityHeroActions";
import type { AppRole } from "@/lib/types/user";
import { createClient } from "@/lib/supabase/server";
import { listShortformPosts } from "@/lib/community/communityQueries";

function shortformListDescription(role: AppRole | null | undefined, loggedIn: boolean): string {
  if (role === "mentor") {
    return "멘토가 올린 짧은 영상으로 학습 팁, 후기, 포트폴리오 노하우를 빠르게 확인해 보세요. 새 숏폼은 아래에서 업로드할 수 있어요.";
  }
  if (!loggedIn) {
    return "멘토가 올린 짧은 영상으로 학습 팁, 후기, 포트폴리오 노하우를 둘러볼 수 있어요. 댓글·스크랩은 로그인 후 이용할 수 있습니다.";
  }
  return "멘토가 올린 짧은 영상으로 학습 팁, 후기, 포트폴리오 노하우를 빠르게 확인해 보세요.";
}

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CommunityShortformPage(props: Props) {
  const { user, profile } = await getServerUserWithProfile();
  const loggedIn = user != null;
  const role = profile?.role;

  const sp = (await props.searchParams) ?? {};
  const tabRaw = typeof sp.tab === "string" ? sp.tab : Array.isArray(sp.tab) ? sp.tab[0] : undefined;
  const activeTab = parseShortformTab(tabRaw);

  const supabase = await createClient();
  const { rows, error } = await listShortformPosts(supabase, 30);
  if (error) console.error("[community/shortform] listShortformPosts", error);

  const listFailed = Boolean(error);
  const empty = !listFailed && rows.length === 0;

  return (
    <CommunityLayoutShell
      activeNav="shortform"
      hero={
        <CommunityPageHero
          eyebrow="숏폼"
          title="숏폼"
          description={shortformListDescription(role, loggedIn)}
          ctas={buildCommunityHeroCtas({
            surface: "shortform_list",
            role,
            loggedIn,
            nextPath: "/community/shortform",
          })}
        />
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <CommunityShortformTabs active={activeTab} />
        {listFailed ? (
          <p className="mt-6 text-sm text-slate-600">숏폼 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : empty ? (
          <p className="mt-6 text-sm text-slate-600">아직 등록된 숏폼 영상이 없습니다.</p>
        ) : (
          <ul className="mt-6 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r, i) => {
              const id = typeof r.id === "string" ? r.id : null;
              return id ? (
                <CommunityShortformVideoCard key={id} row={r} href={`/community/shortform/${id}`} linkLabel="자세히 보기" />
              ) : (
                <li key={`sf-${i}`} className="list-none rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                  항목을 표시할 수 없습니다.
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </CommunityLayoutShell>
  );
}
