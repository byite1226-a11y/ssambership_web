import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
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
  const enriched = error ? [] : await enrichStudentCustomOrderListRows(supabase, rows);

  return (
    <PageScaffold
      compactHero
      eyebrow="맞춤의뢰"
      title="내 주문"
      description="결제·진행·납품 중인 맞춤의뢰 주문을 확인하세요. 작업방에서 멘토와 이어가요."
      ctas={[
        { href: "/custom-request", label: "맞춤의뢰 홈", tone: "slate" },
        { href: "/custom-request/new", label: "새 의뢰 등록", tone: "blue" },
        { href: "/home", label: "학생 홈", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
      hideFooterPlaceholderCards
    >
      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950" role="alert">
          주문 목록을 불러오지 못했습니다. {error}
        </p>
      ) : null}
      {enriched.length === 0 && !error ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
          아직 표시할 맞춤의뢰 주문이 없습니다. 의뢰를 올리고 멘토 제안을 선택하면 여기에 나타납니다.
        </p>
      ) : null}
      <ul className="space-y-3">
        {enriched.map((card) => {
          const { id } = card;
          return (
            <li key={id}>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900">{card.titleLine}</p>
                    <p className="mt-1 text-xs text-slate-500">주문 ID · {card.idShort}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800">
                    {card.orderStatusLabel}
                  </span>
                </div>
                <dl className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="font-semibold text-slate-500">결제</dt>
                    <dd>{card.paymentStatusLabel}</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="font-semibold text-slate-500">금액</dt>
                    <dd>{card.amountLine}</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2 sm:col-span-2">
                    <dt className="font-semibold text-slate-500">멘토</dt>
                    <dd className="min-w-0 break-all">{card.mentorLine}</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2 sm:col-span-2">
                    <dt className="font-semibold text-slate-500">생성</dt>
                    <dd>{card.createdLabel}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <Link
                    href={card.workroomHref}
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
                  >
                    작업방 열기
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </PageScaffold>
  );
}
