import Link from "next/link";
import { FileText } from "lucide-react";
import { StudentCustomRequestOrdersBrowseClient } from "@/components/customRequest/StudentCustomRequestOrdersBrowseClient";
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
      hideHero
      sections={[]}
      dataPoints={[]}
      hideFooterPlaceholderCards
    >
      <div className="space-y-6 select-none max-w-6xl mx-auto py-2">
        <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">맞춤의뢰</p>
            <h1 className="ds-text-h1 mt-1.5 text-slate-900">내 주문 내역</h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              결제·진행·납품 중인 맞춤의뢰 주문을 한눈에 확인하고 작업방에서 멘토와 대화하세요.
            </p>
          </div>
          <div className="flex flex-none gap-2">
            <Link
              href="/custom-request"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              맞춤의뢰 홈
            </Link>
            <Link
              href="/custom-request/new"
              className="inline-flex items-center rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              새 의뢰 등록
            </Link>
          </div>
        </div>
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-950" role="alert">
            주문 목록을 불러오지 못했습니다. {error}
          </div>
        ) : null}

        {enriched.length === 0 && !error ? (
          <div className="rounded-2xl border border-ds-border-subtle bg-ds-muted p-12 text-center select-none">
            <div className="flex justify-center text-slate-300"><FileText className="h-11 w-11" strokeWidth={1.5} aria-hidden /></div>
            <p className="mt-3 text-base font-bold text-ds-primary">진행 중인 주문이 없습니다.</p>
            <p className="mt-1 text-sm font-medium text-ds-secondary">
              의뢰를 올리고 멘토들의 제안서를 확인하여 작업을 시작해 보세요.
            </p>
            <div className="mt-5">
              <Link
                href="/custom-request/new"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white transition hover:bg-blue-700"
              >
                의뢰 요청하기
              </Link>
            </div>
          </div>
        ) : null}

        {!error && enriched.length > 0 ? (
          <StudentCustomRequestOrdersBrowseClient cards={enriched} />
        ) : null}
      </div>
    </PageScaffold>
  );
}
