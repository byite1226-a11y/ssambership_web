import Link from "next/link";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { CommunityShortformTabs, parseShortformTab } from "@/components/community/CommunityShortformTabs";
import { CommunityShortformVideoCard } from "@/components/community/CommunityShortformVideoCard";
import { CommunityShortformEmptyPanel } from "@/components/community/CommunityShortformEmptyPanel";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { buildCommunityHeroPrimaryAction } from "@/lib/community/communityHeroActions";
import type { AppRole } from "@/lib/types/user";
import { createClient } from "@/lib/supabase/server";
import { listShortformPosts } from "@/lib/community/communityQueries";
import { Video } from "lucide-react";

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
          primaryAction={buildCommunityHeroPrimaryAction({
            surface: "shortform_list",
            role,
            loggedIn,
            nextPath: "/community/shortform",
          })}
        />
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">탐색</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">추천 · 최신 · 인기 · 전체</p>
            <p className="mt-0.5 text-xs text-slate-500">원하는 탭으로 이동해 숏폼을 빠르게 탐색해 보세요.</p>
          </div>
        </div>
        <div className="mt-4">
          <CommunityShortformTabs active={activeTab} />
        </div>
        {listFailed ? (
          <p className="mt-6 text-sm text-slate-600">숏폼 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : empty ? (
          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-[280px] aspect-[9/16] rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center shadow-inner">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 text-slate-400 shadow-sm ring-1 ring-slate-100">
                <Video className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-black text-slate-900 leading-snug">아직 등록된 숏폼이 없습니다</p>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                {role === "mentor"
                  ? "첫 숏폼을 올려 학습 팁을 공유해보세요!"
                  : "멘토가 올린 숏폼 영상이 준비 중입니다."}
              </p>
              {role === "mentor" && (
                <Link
                  href="/community/new"
                  className="mt-6 inline-flex h-9 items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-black text-white hover:bg-blue-700 transition"
                >
                  숏폼 업로드하기
                </Link>
              )}
            </div>
          </div>
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
