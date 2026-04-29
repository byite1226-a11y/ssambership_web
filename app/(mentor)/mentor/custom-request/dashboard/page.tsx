import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadMentorRecentApplicationsWithPostHints } from "@/lib/customRequest/customRequestQueries";
import { fetchRecentCustomOrders } from "@/lib/home/mentorDashboardQueries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MentorCustomRequestDashboardPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const { items: recentApplied } = await loadMentorRecentApplicationsWithPostHints(supabase, user.id, 5);
  const orders = await fetchRecentCustomOrders(supabase, user.id, 3);

  return (
    <PageScaffold
      eyebrow="멘토 / 맞춤의뢰"
      title="맞춤의뢰 홈"
      description="학생이 올린 맞춤의뢰에 지원하고, 제안·납기를 비교해 답할 수 있어요."
      ctas={[
        { href: "/mentor/custom-request/posts", label: "모집 중 의뢰 보기", tone: "green" },
        { href: "/mentor/dashboard", label: "멘토 대시보드", tone: "slate" },
        { href: "/custom-request", label: "맞춤의뢰 소개", tone: "slate" },
      ]}
      sections={[
        {
          title: "빠른 링크",
          body: "아래 카드에서 바로 이동할 수 있어요.",
          status: "connected",
        },
        {
          title: "최근 지원",
          body: recentApplied.length
            ? `최근 제출·연결 ${recentApplied.length}건(요약). 자세한 목록은 '모집 중 의뢰'로 이동하세요.`
            : "아직 제출한 맞춤의뢰 지원이 없어요.",
          status: "connected",
        },
        {
          title: "진행 중인 주문",
          body: orders.error
            ? "주문 내역을 불러오는 중이에요. 잠시 후 대시보드에서 다시 확인해 주세요."
            : orders.rows.length > 0
              ? "최근 맞춤의뢰 주문이 있어요. 대시보드·주문 메뉴가 준비되면 여기서도 바로 열 수 있게 이어갈 예정이에요."
              : "맞춤의뢰로 생성된 주문이 아직 없어요. 학생이 제안을 선택해 주면 주문 흐름이 시작돼요.",
          status: orders.error ? "skeleton" : "connected",
        },
        {
          title: "완료·정리",
          body: "끝난 의뢰 전용 기록(보관함)은 곧 이어서 제공할 예정이에요.",
          status: "skeleton",
        },
      ]}
      emptyState=""
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <Link
            href="/mentor/custom-request/posts"
            className="block rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/90 to-white p-5 text-emerald-950 shadow-sm hover:border-emerald-300"
          >
            <h2 className="text-lg font-extrabold">새 의뢰·모집 중 목록</h2>
            <p className="mt-1 text-sm text-emerald-900/85">지원할 수 있는 맞춤의뢰를 둘러보고, 관심 있는 항목에 제안하세요.</p>
          </Link>
        </li>
        <li>
          <Link
            href="/mentor/custom-request/posts"
            className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"
          >
            <h2 className="text-lg font-extrabold">내가 지원한 의뢰</h2>
            <p className="mt-1 text-sm text-slate-600">같은 페이지의「내가 지원한 맞춤의뢰」목록에서 확인하세요.</p>
          </Link>
        </li>
        <li>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
            <h2 className="text-lg font-extrabold text-slate-900">진행 중인 맞춤의뢰 주문</h2>
            <p className="mt-1 text-sm text-slate-600">주문·납품 단계는 멘토 홈 대시보드와 앞으로 추가될 주문 전용 화면에서 이어갈 예정이에요.</p>
            <Link
              className="mt-3 inline-block text-sm font-bold text-blue-800 underline"
              href="/mentor/dashboard"
            >
              멘토 대시보드로 가기
            </Link>
          </div>
        </li>
        <li>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-slate-600">
            <h2 className="text-lg font-extrabold text-slate-800">완료된 의뢰</h2>
            <p className="mt-1 text-sm">완료·보관 뷰는 곧 이어서 제공될 예정이에요.</p>
          </div>
        </li>
      </ul>
    </PageScaffold>
  );
}
