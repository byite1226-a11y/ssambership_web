import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestHero } from "@/components/customRequest/CustomRequestHero";
import { CustomRequestSteps } from "@/components/customRequest/CustomRequestSteps";
import { CustomRequestCategoryGrid } from "@/components/customRequest/CustomRequestCategoryGrid";
import { CustomRequestPostListTable } from "@/components/customRequest/CustomRequestPostListTable";
import { createClient } from "@/lib/supabase/server";
import { loadCustomRequestCategories, loadRecentCustomRequestPosts } from "@/lib/customRequest/customRequestQueries";
import { CUSTOM_REQUEST_DATA_MODEL } from "@/lib/customRequest/customRequestDataModel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomRequestPublicPage() {
  const supabase = await createClient();
  const [recent, cats] = await Promise.all([loadRecentCustomRequestPosts(supabase, 8), loadCustomRequestCategories(supabase)]);

  return (
    <PageScaffold
      eyebrow="Public / Custom request"
      title="맞춤의뢰"
      description="의뢰·지원·주문·납품 흐름(소개). 데이터는 custom_request_* 테이블(존재 시)에서만 조회 — 더미 행 없음."
      ctas={[
        { href: "/custom-request/new", label: "의뢰 등록(학생)", tone: "blue" },
        { href: `/login/student?next=${encodeURIComponent("/custom-request")}`, label: "학생 로그인", tone: "slate" },
      ]}
      sections={[
        { title: "데이터", body: recent.table ? `posts: ${recent.table}` : "posts 테이블 probe", status: recent.table ? "connected" : "skeleton" },
        { title: "카테고리", body: cats.table ? String(cats.table) : "정적·또는 categories(후보)", status: cats.source === "table" && !cats.error ? "connected" : "skeleton" },
        { title: "결제/첨부", body: "이번 턴: UI·Supabase 스텁 — 캐시·결제 모듈 비변경.", status: "skeleton" },
      ]}
      emptyState="최근 의뢰가 없으면 등록 CTA."
      dataPoints={[...CUSTOM_REQUEST_DATA_MODEL]}
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
