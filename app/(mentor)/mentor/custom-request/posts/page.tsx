import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorOpenPostListSection } from "@/components/customRequest/MentorOpenPostListSection";
import { MentorAppliedListSection } from "@/components/customRequest/MentorAppliedListSection";
import { MentorCustomRequestPostsFilterPanel } from "@/components/customRequest/MentorCustomRequestPostsFilterPanel";
import { MentorCustomRequestWorkspaceLayout } from "@/components/customRequest/MentorCustomRequestWorkspaceLayout";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadMentorRecentApplicationsWithPostHints, loadOpenCustomRequestPostsForMentorBrowse } from "@/lib/customRequest/customRequestQueries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MentorCustomRequestPostsPage(props: PageProps) {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const sp = (await props.searchParams) ?? {};
  const currentTab = typeof sp.tab === "string" ? sp.tab : "open";

  const [openList, applied] = await Promise.all([
    loadOpenCustomRequestPostsForMentorBrowse(supabase, 50),
    loadMentorRecentApplicationsWithPostHints(supabase, user.id, 25),
  ]);

  const appliedPostIds = new Set(
    (applied.items ?? []).map((item) => String(item.postId || "").trim())
  );

  const filteredOpenRows = (openList.rows ?? []).filter((row) => {
    const id = String(row.id ?? "").trim();
    return id && !appliedPostIds.has(id);
  });

  const openCount = filteredOpenRows.length;
  const appliedCount = applied.items.length;

  const counts = {
    open: openCount,
    applied: appliedCount,
  };

  const isApplied = currentTab === "applied";
  const titleText = isApplied ? "제안한 의뢰" : "새 의뢰 목록";
  const descriptionText = isApplied
    ? "내가 지원서를 보내고 매칭 결과를 기다리는 의뢰 목록입니다."
    : "현재 멘토 모집 중인 의뢰 요청들을 확인해 보세요.";

  return (
    <PageScaffold
      compactHero
      hideFooterPlaceholderCards
      eyebrow="멘토 · 맞춤의뢰"
      title={titleText}
      description={descriptionText}
      ctas={[]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
      hideHero={true}
    >
      <MentorCustomRequestWorkspaceLayout active="posts" tab={isApplied ? "applied" : "open"} counts={counts}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          <div className="min-w-0 lg:col-span-8">
            {/* Simple elegant text header inside main content */}
            <div className="mb-6 border-b border-slate-100 pb-5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{titleText}</h1>
              <p className="mt-1 text-sm text-slate-500">{descriptionText}</p>
            </div>

            {!isApplied ? (
              <section className="space-y-3">
                <h2 className="sr-only">모집 중인 맞춤의뢰</h2>
                <MentorOpenPostListSection rows={filteredOpenRows} listStatus={openList.status} />
              </section>
            ) : (
              <section className="space-y-3">
                <h2 className="sr-only">내가 지원한 의뢰</h2>
                <MentorAppliedListSection items={applied.items} listFailed={applied.listFailed} />
              </section>
            )}

            <p className="mt-8 text-center text-xs text-slate-400">
              <Link href="/custom-request" className="font-semibold text-blue-800 underline-offset-2 hover:underline">
                맞춤의뢰 소개 보기
              </Link>
            </p>
          </div>

          <div className="mt-8 min-w-0 lg:col-span-4 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <MentorCustomRequestPostsFilterPanel />
            </div>
          </div>
        </div>
      </MentorCustomRequestWorkspaceLayout>
    </PageScaffold>
  );
}
