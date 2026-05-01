import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { StateBanner } from "@/components/community/StateBanner";
import { createClient } from "@/lib/supabase/server";
import { listBoardPosts, pickTitle } from "@/lib/community/communityQueries";

function commentCount(r: Record<string, unknown>): string {
  if (typeof r.comment_count === "number") return String(r.comment_count);
  if (typeof r.comments_count === "number") return String(r.comments_count);
  return "—";
}

export default async function CommunityBoardPage() {
  const supabase = await createClient();
  const { rows, error } = await listBoardPosts(supabase, 50);
  if (error) {
    console.error("[community/board] listBoardPosts", error);
  }

  return (
    <PageScaffold
      eyebrow="게시판"
      title="게시글 목록"
      description="카테고리와 제목을 둘러보고, 글을 열어 전체 내용을 읽을 수 있어요. 숏폼 콘텐츠는 숏폼 메뉴에서 확인해 주세요."
      ctas={[
        { href: "/question-room", label: "질문하기", tone: "blue" },
        { href: "/community/shorts", label: "숏폼", tone: "slate" },
        { href: "/community", label: "커뮤니티 홈", tone: "slate" },
        { href: "/mentor/community/new", label: "멘토 글쓰기", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
    >
      {error ? (
        <div className="mb-4">
          <StateBanner kind="error" message="게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />
        </div>
      ) : null}
      {!error && rows.length === 0 ? (
        <StateBanner
          kind="empty"
          message="아직 등록된 글이 없습니다. 커뮤니티 홈으로 돌아가거나 멘토 작성으로 새 글을 올려 보세요."
        />
      ) : null}
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li
            key={typeof r.id === "string" ? r.id : `bd-${i}`}
            className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1 text-sm">
              {typeof r.category === "string" ? (
                <span className="text-xs font-bold text-slate-500">[{r.category}]</span>
              ) : null}{" "}
              <span className="font-extrabold text-slate-900">{pickTitle(r)}</span>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="text-slate-500">댓글 {commentCount(r)}</span>
              {typeof r.id === "string" ? (
                <Link
                  href={`/community/board/${r.id}`}
                  className="inline-flex rounded-xl bg-blue-600 px-3 py-1.5 font-bold text-white shadow-sm hover:bg-blue-700"
                >
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
