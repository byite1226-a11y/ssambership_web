import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorCustomRequestWorkspaceLayout } from "@/components/customRequest/MentorCustomRequestWorkspaceLayout";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  loadMentorRecentApplicationsWithPostHints,
  pickDisplayField,
} from "@/lib/customRequest/customRequestQueries";
import { fetchActiveOpenDisputeOrderIdSet } from "@/lib/customRequest/orderDisputeHelpers";
import { classifyMentorOrderBrowseTab } from "@/lib/customRequest/mentorOrderBrowseTabClassify";
import {
  fetchMentorCustomRequestOrdersFromPrimaryTable,
  mentorCustomOrderWorkroomHref,
} from "@/lib/home/mentorDashboardQueries";
import { loadMentorPayoutsPageData } from "@/lib/mentor/mentorPayoutsQueries";
import { fetchMentorProfileRow } from "@/lib/mentor/mentorProfileQueries";
import { fetchMentorWorkspaceCounts, mentorWorkspaceSidebarCounts } from "@/lib/customRequest/mentorCounts";
import {
  MENTOR_OPEN_POST_CATEGORY_COLORS,
  MENTOR_OPEN_POST_CATEGORY_LABELS,
} from "@/lib/customRequest/mentorOpenPostCategory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, unknown>;

function getDeadlineDisplay(row: Row): { dday: string; dateStr: string } {
  const deadline = pickDisplayField(row, ["deadline", "due_at", "due_date", "close_at"]);
  if (deadline === "—") return { dday: "—", dateStr: "" };
  // Try to compute D-day
  try {
    const d = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dday = diff === 0 ? "D-Day" : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
    const dateStr = deadline.substring(0, 10).replace(/-/g, ".");
    return { dday, dateStr };
  } catch {
    return { dday: "—", dateStr: "" };
  }
}

function getStudentName(row: Row): string {
  const name = pickDisplayField(row, ["student_name", "buyer_name", "client_name", "requester_name"]);
  if (name !== "—") return name;
  return "학생";
}

function getStatusBadge(row: Row, disputeSet: Set<string>): { label: string; cls: string } {
  const id = typeof row.id === "string" ? row.id.trim() : "";
  if (id && disputeSet.has(id)) return { label: "분쟁", cls: "bg-red-50 text-red-600" };
  const tab = classifyMentorOrderBrowseTab(row, disputeSet);
  if (tab === "billing") return { label: "작업 대기", cls: "bg-amber-50 text-amber-800" };
  if (tab === "revision") return { label: "수정 요청", cls: "bg-orange-50 text-orange-600" };
  if (tab === "done") return { label: "완료", cls: "bg-slate-50 text-slate-500" };
  return { label: "작업 중", cls: "bg-blue-50 text-blue-600" };
}

function getRecentActivity(row: Row): string {
  const updated = pickDisplayField(row, ["updated_at", "last_message_at", "last_activity_at"]);
  if (updated === "—") return "최근 활동 없음";
  try {
    const d = new Date(updated);
    const now = new Date();
    const diff = Math.round((now.getTime() - d.getTime()) / (1000 * 60));
    if (diff < 60) return `${diff}분 전`;
    if (diff < 60 * 24) return `${Math.round(diff / 60)}시간 전`;
    return `${Math.round(diff / (60 * 24))}일 전`;
  } catch {
    return updated.substring(0, 10);
  }
}

export default async function MentorCustomRequestDashboardPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const [{ items: recentApplied }, orders, dashboardCounts, payouts, mentorProfile] = await Promise.all([
    loadMentorRecentApplicationsWithPostHints(supabase, user.id, 5),
    fetchMentorCustomRequestOrdersFromPrimaryTable(supabase, user.id, 12),
    fetchMentorWorkspaceCounts(supabase, user.id),
    loadMentorPayoutsPageData(supabase, user.id),
    fetchMentorProfileRow(supabase, user.id),
  ]);

  const profileRow = mentorProfile.row ?? {};
  const avgRating =
    typeof profileRow.avg_rating === "number"
      ? profileRow.avg_rating
      : typeof profileRow.average_rating === "number"
        ? profileRow.average_rating
        : null;
  const reviewCount =
    typeof profileRow.review_count === "number"
      ? profileRow.review_count
      : typeof profileRow.reviews_count === "number"
        ? profileRow.reviews_count
        : 0;
  const monthRevenueCash = Math.round(payouts.monthExpectedCents / 100);
  const expectedSettlementCash = payouts.settlementPayouts.totals.expectedMentorAmount;
  const paidSettlementCash = payouts.settlementPayouts.totals.paidMentorAmount;

  const dashOrderIds = orders.rows
    .map((r) => (typeof (r as { id?: unknown }).id === "string" ? String((r as { id: string }).id) : ""))
    .filter(Boolean);
  const activeDisputeOrderIds = orders.error
    ? new Set<string>()
    : await fetchActiveOpenDisputeOrderIdSet(supabase, dashOrderIds);

  const orderCount = orders.error ? 0 : orders.rows.length;
  const appliedCount = dashboardCounts.applied;
  const sidebarCounts = mentorWorkspaceSidebarCounts(dashboardCounts);
  const openByCategory = dashboardCounts.openByCategory;
  const openPoolCount = sidebarCounts.open;
  const deliveryPendingCount = dashboardCounts.delivery ?? 0;
  const doneCount = dashboardCounts.done ?? 0;

  const categorySlices = (["study", "career", "essay", "other"] as const)
    .filter((id) => openByCategory[id] > 0)
    .map((id) => ({ id, count: openByCategory[id], label: MENTOR_OPEN_POST_CATEGORY_LABELS[id], color: MENTOR_OPEN_POST_CATEGORY_COLORS[id] }));

  const donutCircumference = 2 * Math.PI * 35;
  let donutOffset = 0;
  const donutSegments = categorySlices.map((slice) => {
    const length = openPoolCount > 0 ? (slice.count / openPoolCount) * donutCircumference : 0;
    const segment = { ...slice, length, offset: donutOffset };
    donutOffset += length;
    return segment;
  });

  // For the 진행 중 table, get active orders (not done/billing)
  const activeOrders = orders.error
    ? []
    : orders.rows.filter((r) => {
        const tab = classifyMentorOrderBrowseTab(r, activeDisputeOrderIds);
        return tab !== "done";
      });

  return (
    <PageScaffold
      eyebrow="멘토 · 맞춤의뢰"
      title="맞춤의뢰 대시보드"
      description="멘토님의 맞춤의뢰 활동 현황을 한눈에 확인하세요."
      ctas={[]}
      sections={[]}
      emptyState=""
      hideFooterPlaceholderCards
      hideHero={true}
    >
      <MentorCustomRequestWorkspaceLayout active="dashboard" counts={sidebarCounts}>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-[26px] font-black tracking-tight text-slate-900">맞춤의뢰 대시보드</h1>
          <p className="mt-1 text-[14px] text-slate-500">멘토님의 맞춤의뢰 활동 현황을 한눈에 확인하세요.</p>
        </div>

        {/* 5 Stats Cards — matching req_11 */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {/* Card 1: 새 의뢰 */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <svg className="h-4.5 w-4.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-[12px] font-semibold text-slate-500">새 의뢰</span>
              </div>
              <p className="text-[28px] font-black tracking-tight text-slate-900">
                {openPoolCount}
                <span className="text-[15px] font-bold text-slate-600 ml-0.5">건</span>
              </p>
            </div>
            <p className="mt-2 text-[12px] font-semibold text-blue-600">미제안 {openPoolCount}건</p>
          </div>

          {/* Card 2: 제안한 의뢰 */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                  <svg className="h-4.5 w-4.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <span className="text-[12px] font-semibold text-slate-500">제안한 의뢰</span>
              </div>
              <p className="text-[28px] font-black tracking-tight text-slate-900">
                {appliedCount}
                <span className="text-[15px] font-bold text-slate-600 ml-0.5">건</span>
              </p>
            </div>
            <p className="mt-2 text-[12px] font-semibold text-orange-500">
              응답 대기 {appliedCount}건
            </p>
          </div>

          {/* Card 3: 수락된 의뢰 */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                  <svg className="h-4.5 w-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-[12px] font-semibold text-slate-500">수락된 의뢰</span>
              </div>
              <p className="text-[28px] font-black tracking-tight text-slate-900">
                {orderCount}
                <span className="text-[15px] font-bold text-slate-600 ml-0.5">건</span>
              </p>
            </div>
            <p className="mt-2 text-[12px] font-semibold text-emerald-600">
              진행 중 {orderCount}건
            </p>
          </div>

          {/* Card 4: 납품 완료 */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <svg className="h-4.5 w-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-[12px] font-semibold text-slate-500">납품 완료</span>
              </div>
              <p className="text-[28px] font-black tracking-tight text-slate-900">
                {doneCount}
                <span className="text-[15px] font-bold text-slate-600 ml-0.5">건</span>
              </p>
            </div>
            <p className="mt-2 text-[12px] font-semibold text-slate-500">
              납품 대기 {deliveryPendingCount}건
            </p>
          </div>

          {/* Card 5: 이번 달 수익 */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[13px] font-black text-slate-600">₩</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-500">이번 달 수익</span>
              </div>
              <p className="text-[22px] font-black tracking-tight text-slate-900">
                {monthRevenueCash.toLocaleString("ko-KR")}
                <span className="text-[13px] font-bold text-slate-500 ml-0.5">캐시</span>
              </p>
            </div>
            <p className="mt-2 text-[12px] font-medium text-slate-400">이번 달 예상 수익</p>
          </div>
        </div>

        {/* Main content area - 2-col: 진행 중 의뢰 + 오늘의 일정 / 수익 현황 */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* Left col: 진행 중 의뢰 + 새 의뢰 현황 */}
          <div className="space-y-6 lg:col-span-8">
            {/* 진행 중 의뢰 table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-[15px] font-black text-slate-900">진행 중 의뢰</h2>
                <Link
                  href="/mentor/custom-request/orders"
                  className="flex items-center gap-0.5 text-[12px] font-bold text-blue-600 hover:underline"
                >
                  전체 보기
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 bg-slate-50/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <div className="col-span-5">의뢰 제목</div>
                <div className="col-span-2">학생</div>
                <div className="col-span-2">마감일</div>
                <div className="col-span-2 text-center">진행 단계</div>
                <div className="col-span-1 text-right">최근 활동</div>
              </div>

              {orders.error ? (
                <div className="py-8 text-center text-[13px] text-slate-500">
                  데이터를 불러올 수 없습니다.
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-[13px] font-bold text-slate-600">아직 진행 중인 의뢰가 없어요</p>
                  <Link
                    href="/mentor/custom-request/posts"
                    className="mt-3 inline-block text-[12px] font-bold text-[#1A56DB] hover:underline"
                  >
                    의뢰 둘러보기
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {activeOrders.slice(0, 5).map((raw) => {
                    const r = raw as Row;
                    const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : null;
                    if (!id) return null;
                    const title = pickDisplayField(r, ["title", "subject", "label", "name"]);
                    const titleLine = title !== "—" ? title : "맞춤의뢰 주문";
                    const href = mentorCustomOrderWorkroomHref(id);
                    const { dday, dateStr } = getDeadlineDisplay(r);
                    const studentName = getStudentName(r);
                    const badge = getStatusBadge(r, activeDisputeOrderIds);
                    const recentActivity = getRecentActivity(r);
                    const isDdayRed = dday.startsWith("D-") && parseInt(dday.slice(2)) <= 3;

                    return (
                      <li key={id}>
                        <Link
                          href={href}
                          className="group grid grid-cols-12 gap-2 px-5 py-3.5 items-center transition hover:bg-slate-50/60"
                        >
                          <div className="col-span-5 min-w-0">
                            <p className="text-[13px] font-bold text-slate-900 truncate group-hover:text-blue-600">
                              {titleLine}
                            </p>
                          </div>
                          <div className="col-span-2 min-w-0">
                            <p className="text-[12px] text-slate-600 truncate">{studentName}</p>
                          </div>
                          <div className="col-span-2">
                            <p className={`text-[12px] font-bold ${isDdayRed ? "text-red-500" : "text-slate-600"}`}>
                              {dday}
                            </p>
                            {dateStr && (
                              <p className="text-[10px] text-slate-400">{dateStr}</p>
                            )}
                          </div>
                          <div className="col-span-2 flex justify-center">
                            <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="col-span-1 text-right">
                            <p className="text-[11px] text-slate-400">{recentActivity}</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Bottom row: 새 의뢰 현황 + 인기 키워드 */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* 새 의뢰 현황 donut */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-black text-slate-900">새 의뢰 현황</h3>
                  <Link href="/mentor/custom-request/posts" className="text-[12px] font-bold text-blue-600 hover:underline">
                    전체 보기 &gt;
                  </Link>
                </div>
                {openPoolCount === 0 ? (
                  <p className="py-6 text-center text-[13px] text-slate-400">새 의뢰가 없습니다</p>
                ) : (
                  <div className="flex items-center gap-4">
                    {/* Donut placeholder */}
                    <div className="relative flex h-24 w-24 items-center justify-center shrink-0">
                      <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                        {donutSegments.map((seg) => (
                          <circle
                            key={seg.id}
                            cx="50"
                            cy="50"
                            r="35"
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="12"
                            strokeDasharray={`${seg.length} ${donutCircumference - seg.length}`}
                            strokeDashoffset={-seg.offset}
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[18px] font-black text-slate-900">{openPoolCount}</span>
                        <span className="text-[10px] text-slate-500">전체</span>
                      </div>
                    </div>
                    <ul className="flex-1 space-y-1.5 text-[12px]">
                      {categorySlices.map((slice) => (
                        <li key={slice.id} className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: slice.color }}
                            />
                            <span className="text-slate-600">{slice.label}</span>
                          </span>
                          <span className="shrink-0 font-bold tabular-nums text-slate-800">{slice.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 인기 키워드 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-black text-slate-900">의뢰 분야별 인기 키워드</h3>
                  <Link href="/mentor/custom-request/posts" className="text-[12px] font-bold text-blue-600 hover:underline">
                    전체 보기 &gt;
                  </Link>
                </div>
                <p className="py-4 text-center text-[12px] text-slate-400">키워드 데이터가 준비 중입니다</p>
              </div>
            </div>
          </div>

          {/* Right col: 오늘의 일정 + 수익 현황 + 나의 평활 + 빠른 메뉴 */}
          <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
            {/* 오늘의 일정 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-black text-slate-900">오늘의 일정</h3>
                <Link href="/mentor/custom-request/orders" className="text-[12px] font-bold text-blue-600 hover:underline">
                  전체 보기 &gt;
                </Link>
              </div>
              {activeOrders.length === 0 ? (
                <p className="py-3 text-[12px] text-slate-400">오늘 확인할 일정이 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {activeOrders.slice(0, 3).map((raw) => {
                    const r = raw as Row;
                    const id = typeof r.id === "string" ? r.id.trim() : "";
                    if (!id) return null;
                    const { dday } = getDeadlineDisplay(r);
                    const badge = getStatusBadge(r, activeDisputeOrderIds);
                    const href = mentorCustomOrderWorkroomHref(id);
                    const title = pickDisplayField(r, ["title", "subject", "label", "name"]);
                    const titleLine = title !== "—" ? title : "맞춤의뢰 주문";
                    const isDdayRed = dday.startsWith("D-") && parseInt(dday.slice(2)) <= 3;
                    return (
                      <li key={id} className="flex items-center justify-between gap-2">
                        <Link href={href} className="flex items-center gap-2 min-w-0 flex-1 hover:underline">
                          <span className={`text-[11px] font-bold ${badge.cls} rounded px-1.5 py-0.5 shrink-0`}>
                            {badge.label}
                          </span>
                          <span className="text-[12px] text-slate-700 truncate">{titleLine}</span>
                        </Link>
                        <span className={`shrink-0 text-[12px] font-bold ${isDdayRed ? "text-red-500" : "text-slate-600"}`}>
                          {dday}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* 수익 현황 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-900">수익 현황</h3>
              <dl className="mt-3 space-y-2 text-[12px]">
                <div className="flex justify-between gap-2">
                  <dt className="font-semibold text-slate-500">총 예상 수익</dt>
                  <dd className="font-black text-slate-900">{monthRevenueCash.toLocaleString("ko-KR")} 캐시</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-semibold text-slate-500">진행 중</dt>
                  <dd className="font-bold text-blue-600">{expectedSettlementCash.toLocaleString("ko-KR")} 캐시</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-semibold text-slate-500">완료(정산 예정)</dt>
                  <dd className="font-bold text-emerald-700">{paidSettlementCash.toLocaleString("ko-KR")} 캐시</dd>
                </div>
              </dl>
              <Link
                href="/mentor/payouts"
                className="mt-3 inline-flex text-[12px] font-bold text-[#1A56DB] hover:underline"
              >
                정산/수익 관리 &gt;
              </Link>
            </div>

            {/* 나의 평점 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-900">나의 평점</h3>
              <p className="mt-2 text-2xl font-black text-[#1A56DB]">
                {avgRating != null ? avgRating.toFixed(1) : "—"}
                <span className="text-sm font-bold text-slate-400"> / 5.0</span>
              </p>
              <p className="mt-1 text-amber-500 text-sm" aria-hidden>
                {"★".repeat(Math.round(avgRating ?? 0))}
                {"☆".repeat(5 - Math.round(avgRating ?? 0))}
              </p>
              <Link href="/mentor/reviews" className="mt-3 inline-flex text-[12px] font-bold text-[#1A56DB] hover:underline">
                리뷰 {reviewCount}개 보기 &gt;
              </Link>
            </div>

            {/* 빠른 메뉴 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-900 mb-3">빠른 메뉴</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "의뢰 가이드", href: "#", emoji: "📋" },
                  { label: "프로필 관리", href: "/mentor/profile/edit", emoji: "👤" },
                  { label: "정산 관리", href: "/mentor/payouts", emoji: "💳" },
                  { label: "알림 설정", href: "/notifications", emoji: "🔔" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex flex-col items-center gap-1.5 rounded-lg p-2 hover:bg-slate-50 transition text-center"
                  >
                    <span className="text-[20px]">{item.emoji}</span>
                    <span className="text-[10px] font-semibold text-slate-600 leading-tight">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </MentorCustomRequestWorkspaceLayout>
    </PageScaffold>
  );
}
