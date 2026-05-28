import { CommunitySectionCard } from "@/components/community/CommunitySectionCard";
import { CommunityShortformVideoCard } from "@/components/community/CommunityShortformVideoCard";
import { CommunityShortformEmptyPanel } from "@/components/community/CommunityShortformEmptyPanel";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import type { CommunityBoardPostCard } from "@/lib/community/communityBoardQueries";
import type { ShortformCard } from "@/lib/community/communityShortformQueries";
import type { AppRole } from "@/lib/types/user";

export function CommunityHomeSections(props: {
  shortforms: ShortformCard[];
  shortformError: string | null;
  popularPosts: CommunityBoardPostCard[];
  boardError: string | null;
  weeklyPosts: CommunityBoardPostCard[];
  weeklyError: string | null;
  viewerRole?: AppRole | null;
  loggedIn: boolean;
}) {
  return (
    <div className="space-y-6">
      <CommunitySectionCard
        title="추천 숏폼"
        subtitle="멘토가 올린 짧은 학습 영상을 한눈에 모았어요."
        action={{ href: "/community/shortform", label: "숏폼 보기 >" }}
      >
        {props.shortformError ? (
          <p className="text-sm text-slate-600">숏폼 영상을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : props.shortforms.length === 0 ? (
          <CommunityShortformEmptyPanel role={props.viewerRole} loggedIn={props.loggedIn} compact />
        ) : (
          <ul className="flex list-none gap-4 overflow-x-auto pb-2 p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {props.shortforms.slice(0, 5).map((item) => (
              <div key={item.id} className="w-[160px] shrink-0 sm:w-[180px] [&>li]:h-full">
                <CommunityShortformVideoCard item={item} href={`/community/shortform/${item.id}`} />
              </div>
            ))}
          </ul>
        )}
      </CommunitySectionCard>

      <CommunitySectionCard
        title="인기 게시글"
        subtitle="공부법·해설·후기·학습 팁 중심의 글을 빠르게 살펴보세요."
        action={{ href: "/community/board", label: "게시판 보기 >" }}
      >
        {props.boardError ? (
          <p className="text-sm text-slate-600">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : props.popularPosts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-600">
            아직 표시할 인기 게시글이 없어요.
          </p>
        ) : (
          <ul className="space-y-3">
            {props.popularPosts.slice(0, 5).map((post) => (
              <li key={post.id}>
                <CommunityPostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </CommunitySectionCard>

      <CommunitySectionCard
        title="이번 주 게시판"
        subtitle="최근 올라온 글을 모아 두었어요."
        action={{ href: "/community/board", label: "게시판 보기 >" }}
      >
        {props.weeklyError ? (
          <p className="text-sm text-slate-600">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : props.weeklyPosts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-600">
            이번 주에 추가된 글이 아직 없어요.
          </p>
        ) : (
          <ul className="space-y-3">
            {props.weeklyPosts.slice(0, 3).map((post) => (
              <li key={post.id}>
                <CommunityPostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </CommunitySectionCard>
    </div>
  );
}
