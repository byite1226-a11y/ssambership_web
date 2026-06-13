import type { ReactNode } from "react";
import Link from "next/link";
import type { CommunityMeActivityPayload } from "@/components/community/CommunityMeTabPanels";
import { MeDraftsList, MePostsList } from "@/components/community/CommunityMeTabPanels";
import { communityMePath } from "@/lib/community/communityMeTab";

function SectionCard(props: {
  title: string;
  moreHref: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <h2 className="text-base font-extrabold text-slate-900">{props.title}</h2>
        <Link href={props.moreHref} className="text-xs font-bold text-blue-600 hover:underline">
          더 보기 &gt;
        </Link>
      </div>
      <div className="pt-4">{props.children}</div>
    </section>
  );
}

export function CommunityMeOverviewSections(props: {
  activity: CommunityMeActivityPayload | null;
}) {
  const act = props.activity;
  const recentPosts = act?.myPosts.slice(0, 5) ?? [];
  const recentDrafts = act?.myDrafts.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <SectionCard title="내 게시글" moreHref={communityMePath("posts")}>
        {act?.loadFailed ? (
          <p className="text-xs font-semibold text-amber-800">목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
        ) : recentPosts.length === 0 ? (
          <p className="text-sm text-slate-500">아직 작성한 게시글이 없어요.</p>
        ) : (
          <MePostsList items={recentPosts} />
        )}
      </SectionCard>

      <SectionCard title="임시저장" moreHref={communityMePath("drafts")}>
        {act?.loadFailed ? (
          <p className="text-xs font-semibold text-amber-800">목록을 불러오지 못했어요.</p>
        ) : recentDrafts.length === 0 ? (
          <p className="text-sm text-slate-500">임시저장된 글이 없어요.</p>
        ) : (
          <MeDraftsList items={recentDrafts} />
        )}
      </SectionCard>

      <SectionCard title="스크랩" moreHref={communityMePath("scraps")}>
        <p className="text-sm text-slate-600">스크랩한 게시글을 모아 볼 수 있어요.</p>
        <p className="mt-2 text-xs text-slate-500">「더 보기」에서 전체 스크랩 목록을 확인하세요.</p>
      </SectionCard>
    </div>
  );
}
