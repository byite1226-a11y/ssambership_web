import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestHero } from "@/components/customRequest/CustomRequestHero";
import { CustomRequestSteps } from "@/components/customRequest/CustomRequestSteps";
import { CustomRequestCategoryGrid } from "@/components/customRequest/CustomRequestCategoryGrid";
import { CustomRequestPostListTable } from "@/components/customRequest/CustomRequestPostListTable";
import { CustomRequestTrustBanner } from "@/components/customRequest/CustomRequestTrustBanner";
import { createClient } from "@/lib/supabase/server";
import { loadCustomRequestCategories, loadRecentCustomRequestPosts } from "@/lib/customRequest/customRequestQueries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomRequestPublicPage() {
  const supabase = await createClient();
  const [recent, cats] = await Promise.all([loadRecentCustomRequestPosts(supabase, 8), loadCustomRequestCategories(supabase)]);

  return (
    <PageScaffold
      compactHero
      hideFooterPlaceholderCards
      eyebrow="맞춤의뢰"
      title="맞춤의뢰"
      description="요청을 올리고 멘토 제안을 비교한 뒤, 이어지는 주문·상담 단계로 진행해요."
      ctas={[
        { href: `/login/student?next=${encodeURIComponent("/custom-request")}`, label: "학생 로그인", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
    >
      <div className="space-y-8 sm:space-y-10">
        <CustomRequestHero />
        <CustomRequestCategoryGrid fromTable={cats} />
        <CustomRequestSteps />
        <section className="space-y-3">
          <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">최근 요청</h2>
          <p className="text-sm text-slate-600">공개 범위에서 보이는 요청이에요.</p>
          <CustomRequestPostListTable list={recent} max={6} />
        </section>
        <CustomRequestTrustBanner />
        <p className="text-center text-sm text-slate-500">
          <Link
            href="/custom-request/new"
            className="inline-flex min-h-[44px] items-center justify-center font-extrabold text-indigo-700 underline"
          >
            의뢰 요청 등록으로 이동
          </Link>
        </p>
      </div>
    </PageScaffold>
  );
}
