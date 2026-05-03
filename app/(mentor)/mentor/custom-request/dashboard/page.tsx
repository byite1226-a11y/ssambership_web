import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorCustomRequestWorkspaceLayout } from "@/components/customRequest/MentorCustomRequestWorkspaceLayout";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  loadMentorRecentApplicationsWithPostHints,
  pickDisplayField,
} from "@/lib/customRequest/customRequestQueries";
import { fetchActiveOpenDisputeOrderIdSet } from "@/lib/customRequest/orderDisputeHelpers";
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
  const { items: recentApplied } = await loadMentorRecentApplicationsWithPostHints(supabase, user.id, 5);
  const orders = await fetchMentorCustomRequestOrdersFromPrimaryTable(supabase, user.id, 12);
  const dashOrderIds = orders.rows
    .map((r) => (typeof (r as { id?: unknown }).id === "string" ? String((r as { id: string }).id) : ""))
    .filter(Boolean);
  const activeDisputeOrderIds = orders.error
    ? new Set<string>()
    : await fetchActiveOpenDisputeOrderIdSet(supabase, dashOrderIds);

  const orderCount = orders.error ? 0 : orders.rows.length;
  const appliedCount = recentApplied.length;

  return (
    <PageScaffold
      eyebrow="멘토 · 맞춤의뢰"
      title="맞춤의뢰 대시보드"
      description="모집 중인 요청, 지원 이력, 진행 중인 주문을 한곳에서 확인하고 다음 작업으로 바로 이동하세요."
      ctas={[
        { href: "/mentor/custom-request/posts", label: "새 의뢰 목록", tone: "green" },
        { href: "/mentor/custom-request/orders", label: "맞춤의뢰 주문", tone: "blue" },
        { href: "/mentor/dashboard", label: "멘토 대시보드", tone: "slate" },
      ]}
      sections={[]}
      emptyState=""
      hideFooterPlaceholderCards
    >
      <MentorCustomRequestWorkspaceLayout active="dashboard">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex min-h-[148px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">진행 중인 주문</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">{orderCount}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">배정·진행 중인 맞춤의뢰 주문 수예요.</p>
            <Link
              href="/mentor/custom-request/orders"
              className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-bold text-blue-700 hover:underline"
            >
              주문 목록 <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="flex min-h-[148px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">최근 지원</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">{appliedCount}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">목록에 표시된 최근 지원·연결 건수예요.</p>
            <Link
              href="/mentor/custom-request/posts"
              className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-bold text-emerald-700 hover:underline"
            >
              지원 내역 보기 <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="flex min-h-[148px] flex-col rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/90 to-white p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">모집 중 의뢰</p>
            <p className="mt-2 text-sm font-bold leading-snug text-emerald-950">새 요청을 둘러보고 제안을 보내 보세요.</p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-900/80">관심 분야에 맞는 의뢰를 골라 지원할 수 있어요.</p>
            <Link
              href="/mentor/custom-request/posts"
              className="mt-auto inline-flex min-h-[40px] items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-500"
            >
              새 의뢰 목록으로
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">진행 중인 맞춤의뢰 주문</h2>
                  <p className="mt-0.5 text-xs text-slate-500">작업방으로 들어가 납품·메시지를 이어가세요.</p>
                </div>
                <Link
                  className="inline-flex min-h-[40px] items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50"
                  href="/mentor/custom-request/orders"
                >
                  전체 보기
                </Link>
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
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {payLine}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="hidden max-w-[10rem] truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 sm:inline-block">
                              {statusLine}
                            </span>
                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-blue-600" aria-hidden />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/mentor/custom-request/posts"
                className="flex min-h-[100px] flex-col justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
              >
                <span className="text-sm font-extrabold text-slate-900">내가 지원한 의뢰</span>
                <span className="mt-1 text-xs text-slate-600">같은 목록에서 모집 중·지원 탭을 확인하세요.</span>
              </Link>
              <div className="flex min-h-[100px] flex-col justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-slate-600">
                <span className="text-sm font-extrabold text-slate-800">완료된 의뢰</span>
                <span className="mt-1 text-xs">보관함 뷰는 순차적으로 제공될 예정이에요.</span>
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900">오늘의 일정</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">캘린더·일정 연동은 준비 중이에요.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900">수익 현황</h3>
              <p className="mt-2 text-xs text-slate-600">정산·지급 내역은 정산 메뉴에서 확인하세요.</p>
              <Link
                href="/mentor/payouts"
                className="mt-3 inline-flex text-sm font-bold text-blue-700 underline-offset-2 hover:underline"
              >
                정산 화면으로 →
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900">나의 평점</h3>
              <p className="mt-2 text-xs text-slate-600">프로필에서 리뷰·평점을 관리할 수 있어요.</p>
              <Link
                href="/mentor/profile"
                className="mt-3 inline-flex text-sm font-bold text-blue-700 underline-offset-2 hover:underline"
              >
                프로필로 이동 →
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900">빠른 메뉴</h3>
              <ul className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                <li>
                  <Link className="hover:text-blue-700 hover:underline" href="/custom-request">
                    맞춤의뢰 소개
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-blue-700 hover:underline" href="/mentor/question-room">
                    질문방
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-blue-700 hover:underline" href="/community">
                    커뮤니티
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-sm font-bold text-slate-800">
            맞춤의뢰·주문 알림을 놓치지 않도록{" "}
            <Link href="/notifications" className="font-extrabold text-blue-700 underline-offset-2 hover:underline">
              알림 설정
            </Link>
            에서 받는 방법을 확인해 보세요.
          </p>
        </div>
      </MentorCustomRequestWorkspaceLayout>
    </PageScaffold>
  );
}
