import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorCustomRequestOrdersBrowseClient } from "@/components/customRequest/MentorCustomRequestOrdersBrowseClient";
import { MentorCustomRequestWorkspaceLayout } from "@/components/customRequest/MentorCustomRequestWorkspaceLayout";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { fetchActiveOpenDisputeOrderIdSet } from "@/lib/customRequest/orderDisputeHelpers";
import { fetchMentorCustomRequestOrdersFromPrimaryTable } from "@/lib/home/mentorDashboardQueries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MentorCustomRequestOrdersListPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const { rows, error } = await fetchMentorCustomRequestOrdersFromPrimaryTable(supabase, user.id, 80);
  const orderIds = rows
    .map((r) => (typeof (r as { id?: unknown }).id === "string" ? String((r as { id: string }).id) : ""))
    .filter(Boolean);
  const activeDisputeOrderIds = error ? new Set<string>() : await fetchActiveOpenDisputeOrderIdSet(supabase, orderIds);
  const disputeIdList = [...activeDisputeOrderIds];

  return (
    <PageScaffold
      compactHero
      hideFooterPlaceholderCards
      eyebrow="멘토 · 맞춤의뢰"
      title="맞춤의뢰 주문"
      description="수락된 의뢰가 주문으로 이어진 뒤, 결제·작업·납품·완료까지 한곳에서 이어가요. 상태를 골라 목록을 좁힐 수 있어요."
      ctas={[
        { href: "/mentor/custom-request/dashboard", label: "맞춤의뢰 대시보드", tone: "slate" },
        { href: "/mentor/custom-request/posts", label: "새 의뢰 목록", tone: "green" },
        { href: "/mentor/dashboard", label: "멘토 대시보드", tone: "blue" },
      ]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
    >
      <MentorCustomRequestWorkspaceLayout active="orders">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          <div className="min-w-0 lg:col-span-8">
            {error ? (
              <p
                className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950"
                role="alert"
              >
                주문 목록을 불러오지 못했습니다. {error}
              </p>
            ) : null}
            {!error && rows.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50/90 p-6 text-sm text-slate-700">
                아직 표시할 맞춤의뢰 주문이 없습니다. 학생이 지원서를 선택하면 여기에 나타납니다.
              </p>
            ) : null}
            {!error && rows.length > 0 ? (
              <MentorCustomRequestOrdersBrowseClient rows={rows} activeDisputeOrderIds={disputeIdList} />
            ) : null}
          </div>

          <aside className="mt-8 min-w-0 lg:col-span-4 lg:mt-0">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900">빠른 메뉴</h3>
                <ul className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                  <li>
                    <Link className="hover:text-blue-700 hover:underline" href="/mentor/custom-request/dashboard">
                      맞춤의뢰 대시보드
                    </Link>
                  </li>
                  <li>
                    <Link className="hover:text-blue-700 hover:underline" href="/mentor/custom-request/posts">
                      새 의뢰 목록
                    </Link>
                  </li>
                  <li>
                    <Link className="hover:text-blue-700 hover:underline" href="/mentor/question-room">
                      질문방
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900">안내</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  작업방에서는 납품·수정 요청·분쟁 안내가 단계별로 표시됩니다. 위험한 취소·환불은 신중히 진행해 주세요.
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/90 to-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900">알림</h3>
                <p className="mt-2 text-xs text-slate-600">주문·납품 알림은 알림 센터와 함께 확인하세요.</p>
                <Link
                  href="/notifications"
                  className="mt-3 inline-flex text-sm font-bold text-blue-700 underline-offset-2 hover:underline"
                >
                  알림 설정 →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </MentorCustomRequestWorkspaceLayout>
    </PageScaffold>
  );
}
