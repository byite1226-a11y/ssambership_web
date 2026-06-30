import Link from "next/link";
import { CommunitySectionCard } from "@/components/community/CommunitySectionCard";
import { CommunityShortformVideoCard } from "@/components/community/CommunityShortformVideoCard";
import { CommunityShortformEmptyPanel } from "@/components/community/CommunityShortformEmptyPanel";
import { MessageCircle } from "lucide-react";
import type { CommunityBoardPostCard } from "@/lib/community/communityBoardQueries";
import type { ShortformCard } from "@/lib/community/communityShortformQueries";
import type { AppRole } from "@/lib/types/user";

export function CommunityHomeSections(props: {
  shortforms: ShortformCard[];
  shortformError: string | null;
  popularPosts: CommunityBoardPostCard[];
  boardError: string | null;
  viewerRole?: AppRole | null;
  loggedIn: boolean;
}) {
  return (
    <div className="space-y-[18px]">
      <section className="rounded-2xl border border-[#eef0f3] bg-white px-[22px] py-5">
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">함께하는 학습 공간</h1>
        <p className="mt-1 text-sm text-slate-600">멘토의 숏폼과 게시판 글로 공부 흐름을 이어가 보세요.</p>
      </section>

      <CommunitySectionCard
        title="추천 숏폼"
        subtitle="핵심만 담은 학습 영상을 모았습니다."
        action={{ href: "/community/shortform", label: "더보기 →" }}
      >
        {props.shortformError ? (
          <p className="text-sm text-slate-600">숏폼 영상을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : props.shortforms.length === 0 ? (
          <CommunityShortformEmptyPanel role={props.viewerRole} loggedIn={props.loggedIn} compact />
        ) : (
          <ul className="grid list-none grid-cols-2 gap-3 p-0 sm:gap-4 md:grid-cols-3">
            {props.shortforms.slice(0, 6).map((item) => (
              <div key={item.id} className="[&>li]:h-full">
                <CommunityShortformVideoCard item={item} href={`/community/shortform/${item.id}`} />
              </div>
            ))}
          </ul>
        )}
      </CommunitySectionCard>

      <CommunitySectionCard
        title="인기 게시글"
        subtitle="최근 반응이 좋은 글을 확인하세요."
        action={{ href: "/community/board", label: "게시판 →" }}
      >
        {props.boardError ? (
          <p className="text-sm text-slate-600">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : props.popularPosts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-600">
            아직 표시할 인기 게시글이 없어요.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {props.popularPosts.slice(0, 5).map((post) => (
              <li key={post.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {post.categoryLabel}
                  </span>
                  <span className="text-xs text-slate-400">{post.createdAtLabel}</span>
                </div>
                <Link
                  href={`/community/board/${post.id}`}
                  className="mt-1.5 block text-[14px] font-semibold text-slate-900 hover:text-[#2563EB]"
                >
                  {post.title}
                </Link>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>
                    <span className="font-semibold text-slate-700">{post.authorLabel}</span>
                    {" · "}
                    {post.createdAtLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {post.commentCount.toLocaleString("ko-KR")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CommunitySectionCard>
    </div>
  );
}
