import Link from "next/link";
import { Sparkles, Send, CheckCircle2, Eye, TrendingUp } from "lucide-react";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorCustomRequestWorkspaceLayout } from "@/components/customRequest/MentorCustomRequestWorkspaceLayout";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  loadMentorRecentApplicationsWithPostHints,
  loadOpenCustomRequestPostsForMentorBrowse,
  pickDisplayField,
} from "@/lib/customRequest/customRequestQueries";
import { fetchActiveOpenDisputeOrderIdSet } from "@/lib/customRequest/orderDisputeHelpers";
import { classifyMentorOrderBrowseTab } from "@/lib/customRequest/mentorOrderBrowseTabClassify";
import {
  fetchMentorCustomRequestOrdersFromPrimaryTable,
  mentorCustomOrderPaymentLine,
  mentorCustomOrderStatusHeadline,
  mentorCustomOrderWorkroomHref,
} from "@/lib/home/mentorDashboardQueries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, unknown>;

export default async function MentorCustomRequestDashboardPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const [{ items: recentApplied }, orders, openList] = await Promise.all([
    loadMentorRecentApplicationsWithPostHints(supabase, user.id, 5),
    fetchMentorCustomRequestOrdersFromPrimaryTable(supabase, user.id, 12),
    loadOpenCustomRequestPostsForMentorBrowse(supabase, 100),
  ]);
  const dashOrderIds = orders.rows
    .map((r) => (typeof (r as { id?: unknown }).id === "string" ? String((r as { id: string }).id) : ""))
    .filter(Boolean);
  const activeDisputeOrderIds = orders.error
    ? new Set<string>()
    : await fetchActiveOpenDisputeOrderIdSet(supabase, dashOrderIds);
  const disputeSet = activeDisputeOrderIds;

  const orderCount = orders.error ? 0 : orders.rows.length;
  const appliedCount = recentApplied.length;
  const openPoolCount =
    openList.status === "ok" ? openList.rows.length : openList.status === "empty" ? 0 : null;
  const deliveryPendingCount = orders.error
    ? 0
    : orders.rows.filter((r) => classifyMentorOrderBrowseTab(r as Row, disputeSet) === "delivery").length;

  const billingCount = orders.error ? 0 : orders.rows.filter((r) => classifyMentorOrderBrowseTab(r as Row, disputeSet) === "billing").length;
  const workCount = orders.error ? 0 : orders.rows.filter((r) => classifyMentorOrderBrowseTab(r as Row, disputeSet) === "work").length;
  const revisionCount = orders.error ? 0 : orders.rows.filter((r) => classifyMentorOrderBrowseTab(r as Row, disputeSet) === "revision").length;
  const doneCount = orders.error ? 0 : orders.rows.filter((r) => classifyMentorOrderBrowseTab(r as Row, disputeSet) === "done").length;

  const dashboardCounts = {
    open: openPoolCount ?? 0,
    applied: appliedCount,
    billing: billingCount,
    work: workCount,
    delivery: deliveryPendingCount,
    revision: revisionCount,
    done: doneCount,
  };

  const primaryHref = orderCount > 0 ? "/mentor/custom-request/orders" : "/mentor/custom-request/posts";
  const primaryLabel = orderCount > 0 ? "진행 중 주문 보기" : "모집 중 의뢰 보기";

  return (
    <PageScaffold
      eyebrow="멘토 · 맞춤의뢰"
      title="맞춤의뢰 대시보드"
      description="오늘 확인할 새 의뢰·진행 주문 요약입니다. 목록 이동은 왼쪽 메뉴에서도 할 수 있어요."
      ctas={[]}
      sections={[]}
      emptyState=""
      hideFooterPlaceholderCards
      hideHero={true}
    >
      <MentorCustomRequestWorkspaceLayout active="dashboard" counts={dashboardCounts}>
        {/* Modern High-Fidelity Product Header */}
        <div className="mb-8 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700 tracking-wide">
              멘토 · 맞춤의뢰
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 pt-1">맞춤의뢰 대시보드</h1>
            <p className="text-sm text-slate-500 font-medium">새 요청, 제안 현황, 진행 주문과 수익을 한눈에 확인하세요.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Card 1: 모집 중 의뢰 */}
          <div className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/20 to-white p-5 shadow-sm hover:shadow-[0_4px_12px_rgba(16,185,129,0.03)] transition duration-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Sparkles className="h-4 w-4" />
                </span>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-800">새 요청</p>
              </div>
              <p className="mt-3.5 whitespace-nowrap text-3xl font-black tracking-tight text-slate-900">
                {openPoolCount === null ? "—" : openPoolCount}
              </p>
            </div>
            <p className="mt-2 text-xs font-bold text-emerald-700/90 truncate" title="오늘 확인 필요">오늘 확인 필요</p>
          </div>

          {/* Card 2: 제안한 의뢰 */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition duration-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <Send className="h-4 w-4" />
                </span>
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">제출한 제안</p>
              </div>
              <p className="mt-3.5 whitespace-nowrap text-3xl font-black tracking-tight text-slate-900">{appliedCount}</p>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-400 truncate" title="제안서 제출 완료">제안서 제출 완료</p>
          </div>

          {/* Card 3: 수락된 의뢰 */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition duration-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">진행 주문</p>
              </div>
              <p className="mt-3.5 whitespace-nowrap text-3xl font-black tracking-tight text-slate-900">{orderCount}</p>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-400 truncate" title="실시간 작업 중">실시간 작업 중</p>
          </div>

          {/* Card 4: 납품 완료 */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition duration-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">검토 대기</p>
              </div>
              <p className="mt-3.5 whitespace-nowrap text-3xl font-black tracking-tight text-slate-900">
                {orders.error ? "—" : deliveryPendingCount}
              </p>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-400 truncate" title="학생 검토 진행">학생 검토 진행</p>
          </div>

          {/* Card 5: 예상 수익 */}
          <div className="flex flex-col justify-between rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/20 to-white p-5 shadow-sm hover:shadow-[0_4px_12px_rgba(37,99,235,0.03)] transition duration-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Eye className="h-4 w-4" />
                </span>
                <p className="text-xs font-black uppercase tracking-wider text-blue-800">예상 수익</p>
              </div>
              <p className="mt-3.5 whitespace-nowrap text-[26px] font-black tracking-tight text-slate-950">
                80,000<span className="text-sm font-extrabold text-slate-500 ml-0.5">캐시</span>
              </p>
            </div>
            <p className="mt-2 text-xs font-bold text-blue-600 truncate" title="전월 대비 60% ▲">전월 대비 60% ▲</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          최근 지원 <span className="font-semibold text-slate-900">{appliedCount}</span>건을 미리 불러두었습니다. 목록 이동 및 세부 관리는 왼쪽 네비게이션을 이용해 주세요.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
              <div className="border-b border-slate-200/80 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900">진행 중인 맞춤의뢰 주문</h2>
                <p className="mt-0.5 text-xs text-slate-500">작업방으로 들어가 납품·메시지를 이어가세요.</p>
              </div>
              {orders.error ? (
                <p className="mt-4 text-sm text-amber-900">{orders.error}</p>
              ) : orders.rows.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  표시할 주문이 없습니다. 학생이 지원서를 선택하면 여기에 표시됩니다.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {orders.rows.map((raw) => {
                    const r = raw as Row;
                    const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : null;
                    if (!id) return null;
                    const title = pickDisplayField(r, ["title", "subject", "label", "name"]);
                    const titleLine = title !== "—" ? title : "맞춤의뢰 주문";
                    const href = mentorCustomOrderWorkroomHref(id);
                    const statusLine = mentorCustomOrderStatusHeadline(r, activeDisputeOrderIds);
                    const payLine = mentorCustomOrderPaymentLine(r);
                    return (
                      <li key={id}>
                        <Link
                          href={href}
                          className="group flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-white bg-white px-4 py-3 shadow-sm transition hover:border-blue-200 hover:shadow"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-slate-900">{titleLine}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">{payLine}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="hidden max-w-[10rem] truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 sm:inline-block">
                              {statusLine}
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900">안내·바로가기</h3>
              <ul className="mt-3 space-y-3 text-xs leading-relaxed text-slate-600">
                <li>
                  정산과 지급은{" "}
                  <Link href="/mentor/payouts" className="font-bold text-blue-800 underline underline-offset-2 hover:no-underline">
                    정산
                  </Link>{" "}
                  메뉴에서 확인합니다.
                </li>
                <li>
                  맞춤의뢰 소개 페이지는 학생에게 공유하기 좋은 요약예요 ·{" "}
                  <Link href="/custom-request" className="font-bold text-blue-800 underline underline-offset-2 hover:no-underline">
                    소개 페이지
                  </Link>
                </li>
              </ul>
              <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                캘린더·별도 일정 기능은 순차 제공 예정이에요. 알림 관련해서는{" "}
                <Link href="/notifications" className="font-bold text-blue-800 underline underline-offset-2 hover:no-underline">
                  알림 설정
                </Link>
                을 확인해 주세요.
              </p>
            </div>
          </aside>
        </div>
      </MentorCustomRequestWorkspaceLayout>
    </PageScaffold>
  );
}
