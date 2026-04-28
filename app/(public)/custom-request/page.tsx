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
      eyebrow="맞춤의뢰"
      title="맞춤의뢰"
      description="요청을 등록하고 멘토와 매칭된 뒤, 주문방에서 납품·수정·소통을 진행합니다. 첨부·결제는 주문 확정 단계에서 안내됩니다."
      ctas={[
        { href: "/custom-request/new", label: "의뢰 등록(학생)", tone: "blue" },
        { href: `/login/student?next=${encodeURIComponent("/custom-request")}`, label: "학생 로그인", tone: "slate" },
      ]}
      sections={[]}
    >
      <div className="space-y-6">
        <CustomRequestHero />
        <CustomRequestCategoryGrid fromTable={cats} />
        <CustomRequestSteps />
        <section className="space-y-2">
          <h2 className="text-lg font-extrabold text-slate-900">최근 맞춤의뢰(공개·가능한 범위)</h2>
          <CustomRequestPostListTable list={recent} max={6} />
        </section>
        <div>
          <Link
            className="inline-block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
            href="/custom-request/new"
          >
            요청 등록(학생)
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
