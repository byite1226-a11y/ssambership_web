import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { fetchActiveOpenDisputeOrderIdSet } from "@/lib/customRequest/orderDisputeHelpers";
import {
  enrichStudentCustomOrderListRows,
  fetchStudentCustomRequestOrdersFromPrimaryTable,
} from "@/lib/customRequest/studentCustomRequestOrdersQueries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentCustomRequestOrdersListPage() {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const { rows, error } = await fetchStudentCustomRequestOrdersFromPrimaryTable(supabase, user.id, 80);
  const orderIds = rows.map((r) => (typeof (r as { id?: unknown }).id === "string" ? String((r as { id: string }).id) : "")).filter(Boolean);
  const activeDisputeOrderIds = error ? new Set<string>() : await fetchActiveOpenDisputeOrderIdSet(supabase, orderIds);
  const enriched = error ? [] : await enrichStudentCustomOrderListRows(supabase, rows, activeDisputeOrderIds);

  return (
    <PageScaffold
      compactHero
      eyebrow="맞춤의뢰"
      title="내 주문 내역"
      description="결제·진행·납품 중인 맞춤의뢰 주문을 한눈에 확인하고 작업방에서 멘토와 대화하세요."
      ctas={[
        { href: "/custom-request", label: "맞춤의뢰 홈", tone: "slate" },
        { href: "/custom-request/new", label: "새 의뢰 등록", tone: "blue" },
      ]}
      sections={[]}
      dataPoints={[]}
      hideFooterPlaceholderCards
    >
      <div className="space-y-6 select-none max-w-6xl mx-auto py-2">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-950" role="alert">
            주문 목록을 불러오지 못했습니다. {error}
          </div>
        ) : null}

        {enriched.length === 0 && !error ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-12 text-center select-none">
            <div className="text-4xl">📄</div>
            <p className="mt-3 text-base font-bold text-slate-800">진행 중인 주문이 없습니다.</p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              의뢰를 올리고 멘토들의 제안서를 확인하여 작업을 시작해 보세요.
            </p>
            <div className="mt-5">
              <Link
                href="/custom-request/new"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 transition"
              >
                의뢰 요청하기
              </Link>
            </div>
          </div>
        ) : null}

        <ul className="space-y-5">
          {enriched.map((card) => {
            const { id } = card;
            return (
              <li key={id}>
                <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm transition hover:shadow-md hover:border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100/80 pb-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg border border-blue-50 bg-blue-50/50 px-2.5 py-1 text-xs font-bold text-blue-700 select-none">
                          맞춤의뢰 주문
                        </span>
                        <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {card.orderStatusLabel}
                        </span>
                      </div>
                      <p className="mt-2.5 text-base sm:text-lg font-bold text-slate-900 line-clamp-1">{card.titleLine}</p>
                      <p className="mt-1 text-xs text-slate-400 font-mono font-medium">주문 ID: {card.idShort}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 bg-slate-50/50 rounded-xl p-4 sm:p-5 border border-slate-100/80">
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <span className="text-xs font-bold text-slate-400 w-20">결제 상태</span>
                      <span className="text-sm font-semibold text-slate-800">{card.paymentStatusLabel}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <span className="text-xs font-bold text-slate-400 w-20">총 결제 금액</span>
                      <span className="text-sm font-bold text-slate-900">{card.amountLine}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <span className="text-xs font-bold text-slate-400 w-20">담당 멘토</span>
                      <span className="text-sm font-semibold text-slate-800 truncate">{card.mentorLine}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <span className="text-xs font-bold text-slate-400 w-20">생성 일시</span>
                      <span className="text-sm font-medium text-slate-700">{card.createdLabel}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-3 pt-1">
                    <Link
                      href={card.workroomHref}
                      className="inline-flex min-h-[46px] w-full sm:w-auto items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                      작업방 열기 &rarr;
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </PageScaffold>
  );
}
