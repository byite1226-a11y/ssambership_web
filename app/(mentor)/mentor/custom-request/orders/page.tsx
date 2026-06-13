import { PageScaffold } from "@/components/shell/PageScaffold";
import { EmptyState, LinkButton } from "@/components/design-system";
import { MentorCustomRequestOrdersBrowseClient } from "@/components/customRequest/MentorCustomRequestOrdersBrowseClient";
import { MentorCustomRequestWorkspaceLayout } from "@/components/customRequest/MentorCustomRequestWorkspaceLayout";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { fetchActiveOpenDisputeOrderIdSet } from "@/lib/customRequest/orderDisputeHelpers";
import { fetchMentorCustomRequestOrdersFromPrimaryTable } from "@/lib/home/mentorDashboardQueries";
import { classifyMentorOrderBrowseTab } from "@/lib/customRequest/mentorOrderBrowseTabClassify";
import { fetchMentorWorkspaceCounts, mentorWorkspaceSidebarCounts } from "@/lib/customRequest/mentorCounts";
import { enrichMentorDashboardOrderRows } from "@/lib/customRequest/mentorDashboardOrderEnrichment";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MentorCustomRequestOrdersListPage(props: PageProps) {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const sp = (await props.searchParams) ?? {};
  const currentTab = typeof sp.tab === "string" ? sp.tab : "all";

  const [ordersResp, orderCounts] = await Promise.all([
    fetchMentorCustomRequestOrdersFromPrimaryTable(supabase, user.id, 80),
    fetchMentorWorkspaceCounts(supabase, user.id),
  ]);
  const { rows: rawRows, error } = ordersResp;

  const rows = error ? [] : await enrichMentorDashboardOrderRows(supabase, user.id, rawRows as Record<string, unknown>[]);

  const orderIds = rows
    .map((r) => (typeof (r as { id?: unknown }).id === "string" ? String((r as { id: string }).id) : ""))
    .filter(Boolean);
  const activeDisputeOrderIds = error ? new Set<string>() : await fetchActiveOpenDisputeOrderIdSet(supabase, orderIds);
  const disputeIdList = [...activeDisputeOrderIds];

  const tabCountMap: Record<string, number> = { all: rows.length };
  for (const row of rows) {
    const tab = classifyMentorOrderBrowseTab(row, activeDisputeOrderIds);
    tabCountMap[tab] = (tabCountMap[tab] ?? 0) + 1;
  }

  return (
    <PageScaffold
      compactHero
      hideFooterPlaceholderCards
      eyebrow="멘토 · 맞춤의뢰"
      title="수락된 의뢰"
      description="의뢰자가 제안을 수락한 의뢰 목록입니다."
      ctas={[]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
      hideHero={true}
    >
      <MentorCustomRequestWorkspaceLayout active="orders" counts={mentorWorkspaceSidebarCounts(orderCounts)}>
        <div className="mb-5">
          <h1 className="ds-text-h2 text-slate-900">수락된 의뢰</h1>
          <p className="mt-1 text-sm text-slate-600">의뢰자가 제안을 수락한 의뢰 목록입니다.</p>
        </div>

        {error ? (
          <p
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"
            role="alert"
          >
            주문 목록을 불러오지 못했습니다. {error}
          </p>
        ) : !error && rows.length === 0 ? (
          <EmptyState
            title="수락된 의뢰가 없습니다"
            description="학생이 제안서를 수락하면 여기에 나타납니다."
            action={
              <LinkButton href="/mentor/custom-request/posts" accent="student">
                새 의뢰 목록 보기
              </LinkButton>
            }
          />
        ) : (
          <MentorCustomRequestOrdersBrowseClient
            rows={rows}
            activeDisputeOrderIds={disputeIdList}
            initialTab={currentTab}
            counts={tabCountMap}
          />
        )}
      </MentorCustomRequestWorkspaceLayout>
    </PageScaffold>
  );
}
