import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorCustomRequestOrdersBrowseClient } from "@/components/customRequest/MentorCustomRequestOrdersBrowseClient";
import { MentorCustomRequestWorkspaceLayout } from "@/components/customRequest/MentorCustomRequestWorkspaceLayout";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { fetchActiveOpenDisputeOrderIdSet } from "@/lib/customRequest/orderDisputeHelpers";
import { fetchMentorCustomRequestOrdersFromPrimaryTable } from "@/lib/home/mentorDashboardQueries";
import { classifyMentorOrderBrowseTab } from "@/lib/customRequest/mentorOrderBrowseTabClassify";
import { fetchMentorWorkspaceCounts, mentorWorkspaceSidebarCounts } from "@/lib/customRequest/mentorCounts";

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
  const { rows, error } = ordersResp;

  const orderIds = rows
    .map((r) => (typeof (r as { id?: unknown }).id === "string" ? String((r as { id: string }).id) : ""))
    .filter(Boolean);
  const activeDisputeOrderIds = error ? new Set<string>() : await fetchActiveOpenDisputeOrderIdSet(supabase, orderIds);
  const disputeIdList = [...activeDisputeOrderIds];

  const activeTabKey = ["billing", "work", "delivery", "revision", "done"].includes(currentTab) ? currentTab : undefined;

  // Compute counts per tab from actual data
  const tabCountMap: Record<string, number> = { all: rows.length };
  for (const row of rows) {
    const tab = classifyMentorOrderBrowseTab(row, activeDisputeOrderIds);
    tabCountMap[tab] = (tabCountMap[tab] ?? 0) + 1;
  }

  // Summary stats for right sidebar (req_15)
  const totalAccepted = rows.length;
  const beforeStart = tabCountMap.billing ?? 0;
  const inProgress = tabCountMap.work ?? 0;
  const settlingCount = tabCountMap.delivery ?? 0;
  const completedCount = tabCountMap.done ?? 0;

  // Estimate total accepted amount (캐시)
  // We can't compute actual amounts from ordering data without more fields, so show a placeholder
  const totalAmountPlaceholder = "—";

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
      <MentorCustomRequestWorkspaceLayout active="orders" tab={activeTabKey} counts={mentorWorkspaceSidebarCounts(orderCounts)}>
        {/* Page header */}
        <div className="mb-5">
          <h1 className="text-[24px] font-black tracking-tight text-slate-900">수락된 의뢰</h1>
          <p className="mt-1 text-[14px] text-slate-500">의뢰자가 제안을 수락한 의뢰 목록입니다.</p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
          {/* Main: orders list */}
          <div className="min-w-0 lg:col-span-8">
            {error ? (
              <p
                className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] font-semibold text-amber-900"
                role="alert"
              >
                주문 목록을 불러오지 못했습니다. {error}
              </p>
            ) : !error && rows.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <p className="text-[14px] font-bold text-slate-700 mb-2">수락된 의뢰가 없습니다</p>
                <p className="text-[13px] text-slate-500">학생이 제안서를 수락하면 여기에 나타납니다.</p>
                <Link
                  href="/mentor/custom-request/posts"
                  className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#142d61] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#0f2349] transition"
                >
                  새 의뢰 목록 보기
                </Link>
              </div>
            ) : (
              <MentorCustomRequestOrdersBrowseClient
                rows={rows}
                activeDisputeOrderIds={disputeIdList}
                initialTab={currentTab}
                counts={tabCountMap}
              />
            )}
          </div>

          {/* Right sidebar matching req_15 */}
          <aside className="mt-6 min-w-0 lg:col-span-4 lg:mt-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* 수락된 의뢰 요약 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-[14px] font-black text-slate-900 mb-3">수락된 의뢰 요약</h3>
                <ul className="space-y-2">
                  {[
                    { label: "전체 수락", value: `${totalAccepted}건`, cls: "text-slate-900" },
                    { label: "작업 대기", value: `${beforeStart}건`, cls: "text-slate-700" },
                    { label: "작업 진행 중", value: `${inProgress}건`, cls: "text-slate-700" },
                    { label: "납품 대기", value: `${settlingCount}건`, cls: "text-slate-700" },
                    { label: "종료됨", value: `${completedCount}건`, cls: "text-slate-700" },
                  ].map(({ label, value, cls }) => (
                    <li key={label} className="flex items-center justify-between text-[13px]">
                      <span className="text-slate-500">{label}</span>
                      <span className={`font-bold ${cls}`}>{value}</span>
                    </li>
                  ))}
                  <li className="border-t border-slate-100 pt-2 flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">총 수락 금액</span>
                    <span className="font-bold text-slate-900">{totalAmountPlaceholder}캐시</span>
                  </li>
                </ul>
              </div>

              {/* 빠른 메뉴 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-[14px] font-black text-slate-900">빠른 메뉴</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/mentor/custom-request/posts"
                    className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 p-2.5 text-center transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span className="text-[11px] font-bold text-slate-700">새 의뢰 목록</span>
                  </Link>
                  <Link
                    href="/mentor/payouts"
                    className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 p-2.5 text-center transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span className="text-[11px] font-bold text-slate-700">정산 내역</span>
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 p-2.5 text-center transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span className="text-[11px] font-bold text-slate-700">알림 센터</span>
                  </Link>
                  <Link
                    href="/legal/no-offplatform-contact"
                    className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 p-2.5 text-center transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span className="text-[11px] font-bold text-slate-700">운영 정책</span>
                  </Link>
                </div>
              </div>

              {/* 안내 사항 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-[14px] font-black text-slate-900 mb-3">안내 사항</h3>
                <ul className="space-y-2 text-[12px] leading-relaxed text-slate-600">
                  {[
                    "작업 시작 전 학생과 충분히 소통해주세요.",
                    "납품은 마감일 전까지 완료해주세요.",
                    "학생 확인 후 3일 내에 정산이 진행됩니다.",
                    "문제 발생 시 고객센터로 문의해주세요.",
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#142d61]" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 문의 및 지원 */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-[13px] font-black text-slate-900 mb-2">문의 및 지원</h3>
                <p className="text-[12px] text-slate-500 mb-3">맞춤의뢰 진행 중 문제가 발생하였나요?</p>
                <Link
                  href="/notifications"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-[12px] font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  알림 센터에서 문의 안내 보기
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </MentorCustomRequestWorkspaceLayout>
    </PageScaffold>
  );
}
