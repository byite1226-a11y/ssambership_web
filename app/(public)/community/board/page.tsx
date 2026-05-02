import Link from "next/link";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { buildCommunityHeroCtas } from "@/lib/community/communityHeroActions";
import type { AppRole } from "@/lib/types/user";
import { createClient } from "@/lib/supabase/server";
import { listBoardPosts, pickTitle } from "@/lib/community/communityQueries";

function commentCount(r: Record<string, unknown>): string {
  if (typeof r.comment_count === "number") return String(r.comment_count);
  if (typeof r.comments_count === "number") return String(r.comments_count);
  return "—";
}

function boardListDescription(role: AppRole | null | undefined, loggedIn: boolean): string {
  if (role === "mentor") {
    return "공부법, 해설, 후기, 학습 팁을 읽고 댓글로 소통해 보세요. 새 게시글은 아래에서 작성할 수 있어요.";
  }
  if (!loggedIn) {
    return "공부법, 해설, 후기, 학습 팁을 둘러볼 수 있어요. 댓글·스크랩은 로그인 후 이용할 수 있습니다.";
  }
  return "공부법, 해설, 후기, 학습 팁을 읽고 댓글로 소통해 보세요.";
}

export default async function CommunityBoardPage() {
  const { user, profile } = await getServerUserWithProfile();
  const loggedIn = user != null;
  const role = profile?.role;

  const supabase = await createClient();
  const { rows, error } = await listBoardPosts(supabase, 50);
  if (error) console.error("[community/board] listBoardPosts", error);

  const failed = Boolean(error);
  const empty = !failed && rows.length === 0;

  return (
    <CommunityLayoutShell
      activeNav="board"
      rightAsidePromo="shortform"
      hero={
        <CommunityPageHero
          eyebrow="게시판"
          title="게시글 목록"
          description={boardListDescription(role, loggedIn)}
          ctas={buildCommunityHeroCtas({
            surface: "board_list",
            role,
            loggedIn,
            nextPath: "/community/board",
          })}
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
