import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { StateBanner } from "@/components/community/StateBanner";
import { createClient } from "@/lib/supabase/server";
import { COMMUNITY_DATA_POINTS, listBoardPosts, pickTitle } from "@/lib/community/communityQueries";

function commentCount(r: Record<string, unknown>): string {
  if (typeof r.comment_count === "number") return String(r.comment_count);
  if (typeof r.comments_count === "number") return String(r.comments_count);
  return "—";
}

export default async function CommunityBoardPage() {
  const supabase = await createClient();
  const { rows, error, table } = await listBoardPosts(supabase, 50);

  return (
    <PageScaffold
      eyebrow="Public / Community / Board"
      title="게시판"
      description="community_posts 전용. 숏폼과 혼합하지 않습니다."
      ctas={[
        { href: "/community/shorts", label: "숏폼", tone: "slate" },
        { href: "/community", label: "홈", tone: "slate" },
        { href: "/mentor/community/new", label: "멘토 작성", tone: "blue" },
      ]}
      sections={[
        { title: "목록", body: "카테고리·제목·작성자·댓글수·최신순.", status: "skeleton" },
        { title: "상세", body: "/community/board/[id]", status: "skeleton" },
        { title: "댓글", body: "comments (insert 다음).", status: "skeleton" },
        { title: "신고", body: "reports.", status: "skeleton" },
      ]}
      emptyState="글이 없을 때 CTA."
      loadingState="리스트 스켈레톤."
      errorState="조회 실패."
      dataPoints={[...COMMUNITY_DATA_POINTS]}
    >
      {error ? (
        <div className="mb-4">
          <StateBanner kind="error" message={error} />
        </div>
      ) : null}
      {table ? <p className="mb-2 text-xs text-slate-500">source: {table}</p> : null}
      {!error && rows.length === 0 ? <StateBanner kind="empty" message="게시글이 없습니다." /> : null}
      <ul className="space-y-1 rounded-2xl border border-slate-200 bg-white">
        {rows.map((r, i) => (
          <li
            key={typeof r.id === "string" ? r.id : `bd-${i}`}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 last:border-0"
          >
            <div className="min-w-0 flex-1 text-sm">
              {typeof r.category === "string" ? (
                <span className="text-xs font-bold text-slate-500">[{r.category}]</span>
              ) : (
                <span className="text-xs text-slate-400">[—] </span>
              )}{" "}
              <span className="font-extrabold text-slate-900">{pickTitle(r)}</span>
              <span className="ml-2 text-xs text-slate-500">
                {typeof r.author_id === "string" ? `작성자 ${r.author_id.slice(0, 6)}…` : "작성자 —"}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-slate-600">
              <span>댓글 {commentCount(r)}</span>
              {typeof r.id === "string" ? (
                <Link href={`/community/board/${r.id}`} className="font-bold text-blue-700">
                  읽기
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </PageScaffold>
  );
}
