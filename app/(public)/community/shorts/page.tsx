import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { StateBanner } from "@/components/community/StateBanner";
import { createClient } from "@/lib/supabase/server";
import { COMMUNITY_DATA_POINTS, listShortformPosts, pickExcerpt, pickTitle } from "@/lib/community/communityQueries";

export default async function CommunityShortsPage() {
  const supabase = await createClient();
  const { rows, error, table } = await listShortformPosts(supabase, 30);

  return (
    <PageScaffold
      eyebrow="Public / Community / Shorts"
      title="숏폼"
      description="shortform_posts 전용. 게시판(community_posts)과 동일 URL에 섞지 않습니다."
      ctas={[
        { href: "/community/board", label: "게시판", tone: "slate" },
        { href: "/community", label: "커뮤니티 홈", tone: "slate" },
        { href: "/mentor/community/new", label: "멘토 작성", tone: "blue" },
      ]}
      sections={[
        { title: "그리드", body: "카드 리스트 — shortform만.", status: "skeleton" },
        { title: "상세", body: "/community/shorts/[id]", status: "skeleton" },
        { title: "댓글/좋아요", body: "자리만 (실시간 제외).", status: "skeleton" },
        { title: "신고", body: "reports.", status: "skeleton" },
      ]}
      emptyState="숏이 없을 때 CTA·가이드."
      loadingState="썸네일/스켈레톤 자리."
      errorState="테이블 미정·RLS 시 메시지."
      dataPoints={[...COMMUNITY_DATA_POINTS]}
    >
      {error ? (
        <div className="mb-4">
          <StateBanner kind="error" message={error} />
        </div>
      ) : null}
      {table ? <p className="mb-2 text-xs text-slate-500">source: {table}</p> : null}
      {!error && rows.length === 0 ? <StateBanner kind="empty" message="숏폼 글이 없습니다." /> : null}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r, i) => (
          <li key={typeof r.id === "string" ? r.id : `sf-${i}`} className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-extrabold text-slate-900">{pickTitle(r)}</h2>
            <p className="mt-1 line-clamp-3 text-xs text-slate-600">{pickExcerpt(r) || "·"}</p>
            {typeof r.id === "string" ? (
              <Link className="mt-3 inline-block text-xs font-bold text-blue-700" href={`/community/shorts/${r.id}`}>
                상세
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </PageScaffold>
  );
}
