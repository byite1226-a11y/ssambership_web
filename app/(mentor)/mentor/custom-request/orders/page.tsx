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
      ctas={[]}
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <h3 className="text-sm font-extrabold text-slate-900">안내</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                작업방 카드 하나로 납품·수정 요청·분쟁 흐름을 이어가요. 대시보드·새 의뢰 목록 이동은 왼쪽 맞춤의뢰 메뉴를 이용해 주세요.
              </p>
              <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
                주문·납품 알림은{" "}
                <Link href="/notifications" className="font-semibold text-blue-800 underline-offset-2 hover:underline">
                  알림 센터
                </Link>
                에서도 확인할 수 있어요.
              </p>
            </div>
          </aside>
        </div>
      </MentorCustomRequestWorkspaceLayout>
    </PageScaffold>
  );
}
