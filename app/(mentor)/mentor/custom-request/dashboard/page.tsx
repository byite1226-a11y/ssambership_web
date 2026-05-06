import Link from "next/link";
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

  const primaryHref = orderCount > 0 ? "/mentor/custom-request/orders" : "/mentor/custom-request/posts";
  const primaryLabel = orderCount > 0 ? "진행 중 주문 보기" : "모집 중 의뢰 보기";

  return (
    <PageScaffold
      eyebrow="멘토 · 맞춤의뢰"
      title="맞춤의뢰 대시보드"
      description="오늘 확인할 새 의뢰·진행 주문 요약입니다. 목록 이동은 왼쪽 메뉴에서도 할 수 있어요."
      ctas={[{ href: primaryHref, label: primaryLabel, tone: "green" }]}
      sections={[]}
      emptyState=""
      hideFooterPlaceholderCards
    >
      <MentorCustomRequestWorkspaceLayout active="dashboard">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-white p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">모집 중 의뢰</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">
              {openPoolCount === null ? "—" : openPoolCount}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-900/80">
              {openList.status === "rpc_unavailable"
                ? "목록 연결을 불러오지 못했어요."
                : "새 의뢰 목록 탭과 동일 풀이에요."}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">진행 중인 주문</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">{orderCount}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">배정·진행 단계까지 포함된 맞춤의뢰 주문입니다.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">납품·검토 단계 (근사)</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">{orders.error ? "—" : deliveryPendingCount}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              아래 목록에 불러온 행 기준으로만 세며, 전체와 다를 수 있어요.
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-600">
          최근 지원 <span className="font-bold text-slate-900">{appliedCount}</span>건까지 미리 불러두었습니다. 전체 목록에서 탭과 필터를
          확인해 보세요.
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
