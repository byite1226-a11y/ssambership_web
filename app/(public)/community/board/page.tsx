import Link from "next/link";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
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
  if (error) console.error("[community/board] listBoardPosts", error);

  const failed = Boolean(error);
  const empty = !failed && rows.length === 0;

  return (
    <CommunityLayoutShell
      activeNav="board"
      hero={
        <CommunityPageHero
          eyebrow="게시판"
          title="게시글 목록"
          description="카테고리와 제목을 둘러보고, 글을 열어 전체 내용을 읽을 수 있어요. 숏폼은 숏폼 메뉴에서 확인해 주세요."
          ctas={[
            { href: "/question-room", label: "질문하기", tone: "blue" },
            { href: "/community/shortform", label: "숏폼", tone: "slate" },
            { href: "/community", label: "커뮤니티 홈", tone: "slate" },
            { href: "/mentor/community/new", label: "멘토 글쓰기", tone: "slate" },
          ]}
        />
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {failed ? (
          <p className="p-6 text-sm text-slate-600">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : empty ? (
          <p className="p-6 text-sm text-slate-600">아직 등록된 글이 없습니다. 멘토 작성으로 새 글을 올려 보세요.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r, i) => {
              const id = typeof r.id === "string" ? r.id : null;
              return (
                <li
                  key={id ?? `bd-${i}`}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      {typeof r.category === "string" ? (
                        <span className="text-xs font-bold text-slate-500">[{r.category}]</span>
                      ) : null}{" "}
                      <span className="font-extrabold text-slate-900">{pickTitle(r)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">댓글 {commentCount(r)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {id ? (
                      <Link
                        href={`/community/board/${id}`}
                        className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                      >
                        읽기
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">읽기 불가</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </CommunityLayoutShell>
  );
}
