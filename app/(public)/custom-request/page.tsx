import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestHero } from "@/components/customRequest/CustomRequestHero";
import { CustomRequestSteps } from "@/components/customRequest/CustomRequestSteps";
import { CustomRequestCategoryGrid } from "@/components/customRequest/CustomRequestCategoryGrid";
import { CustomRequestPostListTable } from "@/components/customRequest/CustomRequestPostListTable";
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
      description="요청을 올리고 멘토와 맞은 뒤, 주문 방에서 납품·소통을 이어가요. 첨부·결제는 주문이 열리면 안내돼요."
      ctas={[
        { href: "/custom-request/new", label: "의뢰 등록(학생)", tone: "blue" },
        { href: `/login/student?next=${encodeURIComponent("/custom-request")}`, label: "학생 로그인", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
    >
      <div className="space-y-5 sm:space-y-6">
        <CustomRequestHero />
        <CustomRequestCategoryGrid fromTable={cats} />
        <CustomRequestSteps />
        <section className="space-y-2.5">
          <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">최근 맞춤의뢰</h2>
          <p className="text-sm text-slate-600">공개 범위에서 보이는 요청이에요.</p>
          <CustomRequestPostListTable list={recent} max={6} />
        </section>
        <div>
          <Link
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
            href="/custom-request/new"
          >
            요청 등록(학생)
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
