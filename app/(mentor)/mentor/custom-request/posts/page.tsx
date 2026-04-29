import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorOpenPostListSection } from "@/components/customRequest/MentorOpenPostListSection";
import { MentorAppliedListSection } from "@/components/customRequest/MentorAppliedListSection";
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
      eyebrow="멘토"
      title="맞춤의뢰"
      description="모집 중인 요청을 찾고 지원하거나, 보낸 지원을 다시 확인하세요."
      ctas={[
        { href: "/mentor/custom-request/dashboard", tone: "slate", label: "맞춤의뢰 홈" },
        { href: "/mentor/dashboard", tone: "slate", label: "멘토 대시보드" },
      ]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
    >
      <section className="space-y-2.5">
        <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">모집 중</h2>
        <MentorOpenPostListSection rows={openList.rows} listStatus={openList.status} />
      </section>
      <section className="mt-6 space-y-2.5 sm:mt-8">
        <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">내가 지원한 의뢰</h2>
        <MentorAppliedListSection items={applied.items} listFailed={applied.listFailed} />
      </section>
      <p className="mt-5 text-center text-sm text-slate-500 sm:mt-6">
        <Link href="/custom-request" className="min-h-[44px] font-extrabold text-blue-700 underline">
          맞춤의뢰 소개
        </Link>
      </p>
    </PageScaffold>
  );
}
