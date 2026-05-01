import Link from "next/link";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { CommunityShortformTabs, parseShortformTab } from "@/components/community/CommunityShortformTabs";
import { createClient } from "@/lib/supabase/server";
import { listShortformPosts, pickExcerpt, pickTitle } from "@/lib/community/communityQueries";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CommunityShortformPage(props: Props) {
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
          title="짧은 소식·인사이트"
          description="짧게 올라온 글을 모았습니다. 카드에서 요약을 확인한 뒤 상세로 이동해 전체를 읽을 수 있어요."
          ctas={[
            { href: "/question-room", label: "질문하기", tone: "blue" },
            { href: "/community/board", label: "게시판", tone: "slate" },
            { href: "/community", label: "커뮤니티 홈", tone: "slate" },
            { href: "/mentor/community/new", label: "멘토 글쓰기", tone: "slate" },
          ]}
        />
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <CommunityShortformTabs active={activeTab} />
        {listFailed ? (
          <p className="mt-6 text-sm text-slate-600">숏폼 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : empty ? (
          <p className="mt-6 text-sm text-slate-600">아직 등록된 숏폼이 없습니다.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r, i) => (
              <li
                key={typeof r.id === "string" ? r.id : `sf-${i}`}
                className="flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50/40 p-5 shadow-sm transition hover:border-slate-200 hover:bg-white"
              >
                <h2 className="text-sm font-extrabold text-slate-900">{pickTitle(r)}</h2>
                <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-slate-600">
                  {pickExcerpt(r) || "내용을 확인해 보세요."}
                </p>
                {typeof r.id === "string" ? (
                  <Link
                    className="mt-4 inline-flex w-full justify-center rounded-xl bg-blue-600 py-2 text-center text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                    href={`/community/shorts/${r.id}`}
                  >
                    자세히 보기
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </CommunityLayoutShell>
  );
}
