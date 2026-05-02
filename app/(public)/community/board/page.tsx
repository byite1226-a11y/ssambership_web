import { CommunityBoardEmptyPanel } from "@/components/community/CommunityBoardEmptyPanel";
import { CommunityBoardPostRow } from "@/components/community/CommunityBoardPostRow";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { buildCommunityHeroCtas } from "@/lib/community/communityHeroActions";
import type { AppRole } from "@/lib/types/user";
import { createClient } from "@/lib/supabase/server";
import { listBoardPosts } from "@/lib/community/communityQueries";

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
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 shadow-inner">
          <p className="font-extrabold text-slate-900">게시판 안내</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
            공부법·해설·후기·학습 팁 중심의 글을 카드 형태로 모았어요. 카테고리·작성자 역할·댓글 수를 함께 확인해 보세요.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          {failed ? (
            <p className="p-4 text-sm text-slate-600">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
          ) : empty ? (
            <CommunityBoardEmptyPanel role={role} loggedIn={loggedIn} />
          ) : (
            <ul className="space-y-4">
              {rows.map((r, i) => (
                <CommunityBoardPostRow key={typeof r.id === "string" ? r.id : `bd-${i}`} row={r} index={i} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </CommunityLayoutShell>
  );
}
