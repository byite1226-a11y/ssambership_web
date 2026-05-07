import Link from "next/link";
import { HelpCircle, Bell } from "lucide-react";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorCustomRequestOrdersBrowseClient } from "@/components/customRequest/MentorCustomRequestOrdersBrowseClient";
import { MentorCustomRequestWorkspaceLayout } from "@/components/customRequest/MentorCustomRequestWorkspaceLayout";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { fetchActiveOpenDisputeOrderIdSet } from "@/lib/customRequest/orderDisputeHelpers";
import { fetchMentorCustomRequestOrdersFromPrimaryTable } from "@/lib/home/mentorDashboardQueries";
import { classifyMentorOrderBrowseTab } from "@/lib/customRequest/mentorOrderBrowseTabClassify";

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

  const { rows, error } = await fetchMentorCustomRequestOrdersFromPrimaryTable(supabase, user.id, 80);
  const orderIds = rows
    .map((r) => (typeof (r as { id?: unknown }).id === "string" ? String((r as { id: string }).id) : ""))
    .filter(Boolean);
  const activeDisputeOrderIds = error ? new Set<string>() : await fetchActiveOpenDisputeOrderIdSet(supabase, orderIds);
  const disputeIdList = [...activeDisputeOrderIds];

  const billingCount = error ? 0 : rows.filter((r) => classifyMentorOrderBrowseTab(r as Record<string, unknown>, activeDisputeOrderIds) === "billing").length;
  const workCount = error ? 0 : rows.filter((r) => classifyMentorOrderBrowseTab(r as Record<string, unknown>, activeDisputeOrderIds) === "work").length;
  const deliveryPendingCount = error ? 0 : rows.filter((r) => classifyMentorOrderBrowseTab(r as Record<string, unknown>, activeDisputeOrderIds) === "delivery").length;
  const revisionCount = error ? 0 : rows.filter((r) => classifyMentorOrderBrowseTab(r as Record<string, unknown>, activeDisputeOrderIds) === "revision").length;
  const doneCount = error ? 0 : rows.filter((r) => classifyMentorOrderBrowseTab(r as Record<string, unknown>, activeDisputeOrderIds) === "done").length;

  const orderCounts = {
    billing: billingCount,
    work: workCount,
    delivery: deliveryPendingCount,
    revision: revisionCount,
    done: doneCount,
  };

  const navKeyMap: Record<string, string> = {
    billing: "orders-billing",
    work: "orders-work",
    delivery: "orders-delivery",
    revision: "orders-revision",
    done: "orders-done",
  };
  const activeTabKey = navKeyMap[currentTab] ? currentTab : undefined;

  const titleMap: Record<string, string> = {
    billing: "수락된 의뢰",
    work: "진행 중",
    delivery: "납품 대기",
    revision: "수정 요청",
    done: "종료된 의뢰",
  };
  const descMap: Record<string, string> = {
    billing: "학생 결제가 완료되면 곧바로 작업을 시작할 수 있는 의뢰 목록입니다.",
    work: "현재 활발히 진행 및 소통 중인 맞춤의뢰 작업 목록입니다.",
    delivery: "작업을 완수하여 학생에게 납품한 뒤 검토 승인을 기다리는 목록입니다.",
    revision: "학생이 제출물에 수정을 요청하여 보완 작업 중인 목록입니다.",
    done: "모든 작업이 승인되어 최종 정산 및 종료된 맞춤의뢰 목록입니다.",
  };

  const titleText = titleMap[currentTab] ?? "맞춤의뢰 주문";
  const descText = descMap[currentTab] ?? "수락된 의뢰가 주문으로 이어진 뒤, 결제·작업·납품·완료까지 한곳에서 관리합니다.";

  return (
    <PageScaffold
      compactHero
      hideFooterPlaceholderCards
      eyebrow="멘토 · 맞춤의뢰"
      title={titleText}
      description={descText}
      ctas={[]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
      hideHero={true}
    >
      <MentorCustomRequestWorkspaceLayout active="orders" tab={activeTabKey} counts={orderCounts}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          <div className="min-w-0 lg:col-span-8">
            {/* Simple elegant text header inside main content */}
            <div className="mb-6 border-b border-slate-100 pb-5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{titleText}</h1>
              <p className="mt-1 text-sm text-slate-500">{descText}</p>
            </div>
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
              <MentorCustomRequestOrdersBrowseClient rows={rows} activeDisputeOrderIds={disputeIdList} initialTab={currentTab} />
            ) : null}
          </div>

          <aside className="mt-8 min-w-0 lg:col-span-4 lg:mt-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <h3 className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <HelpCircle className="h-3 w-3" />
                </span>
                업무 안내
              </h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                  <span>
                    작업방 카드에서 **납품, 수정 요청, 문제 해결** 흐름을 원스톱으로 처리할 수 있습니다.
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                  <span>
                    대시보드나 새 의뢰 이동은 **왼쪽 통합 사이드 네비게이션**을 적극 활용해 보세요.
                  </span>
                </li>
              </ul>
              <div className="mt-4 border-t border-slate-100 pt-3.5">
                <Link
                  href="/notifications"
                  className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <Bell className="h-3 w-3" />
                  알림 센터에서 실시간 상태 보기
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </MentorCustomRequestWorkspaceLayout>
    </PageScaffold>
  );
}
