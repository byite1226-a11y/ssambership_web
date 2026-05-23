import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestHero } from "@/components/customRequest/CustomRequestHero";
import { CustomRequestSteps } from "@/components/customRequest/CustomRequestSteps";
import { CustomRequestCategoryGrid } from "@/components/customRequest/CustomRequestCategoryGrid";
import { CustomRequestPostListTable } from "@/components/customRequest/CustomRequestPostListTable";
import { CustomRequestTrustBanner } from "@/components/customRequest/CustomRequestTrustBanner";
import { createClient } from "@/lib/supabase/server";
import { loadCustomRequestCategories, loadRecentCustomRequestPosts } from "@/lib/customRequest/customRequestQueries";

import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomRequestPublicPage() {
  const supabase = await createClient();
  const { user, profile } = await getServerUserWithProfile();
  const role = profile?.role ?? null;
  const isMentor = role === "mentor";
  const isLoggedIn = Boolean(user);

  const [recent, cats] = await Promise.all([
    loadRecentCustomRequestPosts(supabase, 3),
    loadCustomRequestCategories(supabase),
  ]);

  return (
    <PageScaffold
      compactHero
      hideHero
      hideFooterPlaceholderCards
      eyebrow="맞춤의뢰"
      title="맞춤의뢰"
      description="요청을 올리고 멘토 제안을 비교한 뒤, 주문·상담까지 이어가요."
      ctas={
        isLoggedIn
          ? []
          : [{ href: `/login/student?next=${encodeURIComponent("/custom-request")}`, label: "학생 로그인", tone: "slate" }]
      }
      sections={[]}
      dataPoints={[]}
      emptyState=""
    >
      <div className="mx-auto w-full max-w-6xl space-y-8 px-3 py-6 sm:space-y-12 sm:px-4 sm:py-8 lg:px-0">
        <CustomRequestHero role={role} />
        <CustomRequestSteps />
        <CustomRequestCategoryGrid fromTable={cats} />
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 sm:text-xl">최근 등록된 맞춤의뢰</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">다른 학생들이 등록한 맞춤의뢰 목록입니다.</p>
          </div>
          <CustomRequestPostListTable list={recent} max={3} />
        </section>
        <div className="flex justify-center">
          <Link
            href="/custom-request/new"
            className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[#1A56DB] px-10 py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-blue-700"
          >
            의뢰하기
          </Link>
        </div>
        <CustomRequestTrustBanner />
        <p className="flex flex-col items-center justify-center gap-2 text-center text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-4 select-none">
          {isMentor ? (
            <>
              <Link
                href="/mentor/custom-request/dashboard"
                className="inline-flex min-h-[44px] items-center justify-center font-bold text-indigo-800 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 transition"
              >
                내 진행 의뢰 대시보드 보기
              </Link>
              <Link
                href="/mentor/custom-request/posts"
                className="inline-flex min-h-[44px] items-center justify-center font-bold text-indigo-700 underline hover:text-indigo-900 transition"
              >
                새 의뢰 목록 보기
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/custom-request/orders"
                className="inline-flex min-h-[44px] items-center justify-center font-bold text-indigo-800 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 transition"
              >
                진행 중인 주문 보기
              </Link>
              <Link
                href="/custom-request/posts"
                className="inline-flex min-h-[44px] items-center justify-center font-bold text-indigo-700 underline hover:text-indigo-900 transition"
              >
                내 의뢰 목록
              </Link>
              <Link
                href="/custom-request/new"
                className="inline-flex min-h-[44px] items-center justify-center font-bold text-indigo-700 underline hover:text-indigo-900 transition"
              >
                의뢰 요청 등록으로 이동
              </Link>
            </>
          )}
        </p>
      </div>
    </PageScaffold>
  );
}
