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
      eyebrow="멘토 / 맞춤의뢰"
      title="맞춤의뢰 목록"
      description="모집 중인 요청을 보고 지원하거나, 제출한 지원을 다시 확인하세요."
      ctas={[
        { href: "/mentor/custom-request/dashboard", tone: "slate", label: "맞춤의뢰 홈" },
        { href: "/mentor/dashboard", tone: "slate", label: "멘토 대시보드" },
      ]}
      sections={[]}
      emptyState=""
    >
      <section className="space-y-2">
        <h2 className="text-lg font-extrabold text-slate-900">모집 중인 맞춤의뢰</h2>
        <MentorOpenPostListSection rows={openList.rows} listStatus={openList.status} />
      </section>
      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-extrabold text-slate-900">내가 지원한 맞춤의뢰</h2>
        <MentorAppliedListSection items={applied.items} listFailed={applied.listFailed} />
      </section>
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/custom-request" className="font-bold text-blue-700 underline">
          맞춤의뢰 서비스 소개
        </Link>
      </p>
    </PageScaffold>
  );
}
