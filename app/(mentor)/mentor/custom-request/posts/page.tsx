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

export default async function MentorCustomRequestPostsPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const [openList, applied] = await Promise.all([
    loadOpenCustomRequestPostsForMentorBrowse(supabase, 50),
    loadMentorRecentApplicationsWithPostHints(supabase, user.id, 25),
  ]);

  return (
    <PageScaffold
      compactHero
      hideFooterPlaceholderCards
      eyebrow="멘토 · 맞춤의뢰"
      title="새 의뢰 목록"
      description="모집 중인 요청을 살펴보고 제안을 보내거나, 이미 보낸 지원의 상태를 확인하세요."
      ctas={[
        { href: "/mentor/custom-request/orders", tone: "blue", label: "맞춤의뢰 주문" },
        { href: "/mentor/custom-request/dashboard", tone: "slate", label: "맞춤의뢰 대시보드" },
        { href: "/mentor/dashboard", tone: "slate", label: "멘토 대시보드" },
      ]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
    >
      <MentorCustomRequestWorkspaceLayout active="posts">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          <div className="min-w-0 lg:col-span-8">
            <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <span className="rounded-lg bg-white px-4 py-2 text-sm font-extrabold text-blue-800 shadow-sm">
                모집 중
              </span>
              <span className="rounded-lg px-4 py-2 text-sm font-bold text-slate-500">내가 지원한 의뢰</span>
            </div>

            <section className="space-y-3">
              <h2 className="sr-only">모집 중인 맞춤의뢰</h2>
              <MentorOpenPostListSection rows={openList.rows} listStatus={openList.status} />
            </section>

            <section className="mt-10 space-y-3 border-t border-slate-200 pt-8">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">내가 지원한 의뢰</h2>
              <MentorAppliedListSection items={applied.items} listFailed={applied.listFailed} />
            </section>

            <p className="mt-6 text-center text-sm text-slate-500">
              <Link href="/custom-request" className="min-h-[44px] font-extrabold text-blue-700 underline">
                맞춤의뢰 소개
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
