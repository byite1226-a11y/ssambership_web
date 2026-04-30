import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  loadMentorRecentApplicationsWithPostHints,
  pickDisplayField,
} from "@/lib/customRequest/customRequestQueries";
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

  return (
    <PageScaffold
      eyebrow="멘토 / 맞춤의뢰"
      title="맞춤의뢰 홈"
      description="학생이 올린 맞춤의뢰에 지원하고, 제안·납기를 비교해 답할 수 있어요."
      ctas={[
        { href: "/mentor/custom-request/orders", label: "맞춤의뢰 주문", tone: "blue" },
        { href: "/mentor/custom-request/posts", label: "모집 중 의뢰 보기", tone: "green" },
        { href: "/mentor/dashboard", label: "멘토 대시보드", tone: "slate" },
        { href: "/custom-request", label: "맞춤의뢰 소개", tone: "slate" },
      ]}
      sections={[
        {
          title: "빠른 링크",
          body: "주문 목록·모집 중 의뢰로 바로 이동할 수 있어요.",
          status: "connected",
        },
        {
          title: "최근 지원",
          body: recentApplied.length
            ? `최근 제출·연결 ${recentApplied.length}건(요약). 자세한 목록은 '모집 중 의뢰'로 이동하세요.`
            : "아직 제출한 맞춤의뢰 지원이 없어요.",
          status: "connected",
        },
        {
          title: "진행 중인 주문",
          body: orders.error
            ? "주문 내역을 불러오는 중 문제가 있을 수 있어요."
            : orders.rows.length > 0
              ? `맞춤의뢰 주문 ${orders.rows.length}건(최근). 전체는 '맞춤의뢰 주문' 메뉴에서 확인하세요.`
              : "맞춤의뢰로 생성된 주문이 아직 없어요. 학생이 제안을 선택해 주면 주문 흐름이 시작돼요.",
          status: orders.error ? "skeleton" : "connected",
        },
        {
          title: "완료·정리",
          body: "끝난 의뢰 전용 기록(보관함)은 곧 이어서 제공할 예정이에요.",
          status: "skeleton",
        },
      ]}
      emptyState=""
      hideFooterPlaceholderCards
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <Link
            href="/mentor/custom-request/posts"
            className="block rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/90 to-white p-5 text-emerald-950 shadow-sm hover:border-emerald-300"
          >
            <h2 className="text-lg font-extrabold">새 의뢰·모집 중 목록</h2>
            <p className="mt-1 text-sm text-emerald-900/85">지원할 수 있는 맞춤의뢰를 둘러보고, 관심 있는 항목에 제안하세요.</p>
          </Link>
        </li>
        <li>
          <Link
            href="/mentor/custom-request/posts"
            className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"
          >
            <h2 className="text-lg font-extrabold">내가 지원한 의뢰</h2>
            <p className="mt-1 text-sm text-slate-600">같은 페이지의「내가 지원한 맞춤의뢰」목록에서 확인하세요.</p>
          </Link>
        </li>
        <li className="sm:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">진행 중인 맞춤의뢰 주문</h2>
              <Link
                className="text-sm font-bold text-blue-800 underline"
                href="/mentor/custom-request/orders"
              >
                전체 주문 목록
              </Link>
            </div>
            {orders.error ? (
              <p className="mt-2 text-sm text-amber-900">{orders.error}</p>
            ) : orders.rows.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">표시할 주문이 없습니다. 학생이 지원서를 선택하면 여기에 표시됩니다.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {orders.rows.map((raw) => {
                  const r = raw as Row;
                  const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : null;
                  if (!id) return null;
                  const title = pickDisplayField(r, ["title", "subject", "label", "name"]);
                  const titleLine = title !== "—" ? title : "맞춤의뢰 주문";
                  const href = mentorCustomOrderWorkroomHref(id);
                  return (
                    <li key={id}>
                      <Link
                        href={href}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white bg-white/90 px-3 py-2.5 text-sm shadow-sm hover:border-blue-200"
                      >
                        <span className="min-w-0 font-bold text-slate-900">{titleLine}</span>
                        <span className="shrink-0 text-xs font-semibold text-slate-600">
                          {mentorCustomOrderStatusHeadline(r)} · {mentorCustomOrderPaymentLine(r)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {orders.rows.length > 0 ? (
              <p className="mt-2 text-xs text-slate-500">배정된 맞춤의뢰 주문이에요. 전체 목록은 위 링크에서 확인하세요.</p>
            ) : null}
          </div>
        </li>
        <li className="sm:col-span-2">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-slate-600">
            <h2 className="text-lg font-extrabold text-slate-800">완료된 의뢰</h2>
            <p className="mt-1 text-sm">완료·보관 뷰는 곧 이어서 제공될 예정이에요.</p>
          </div>
        </li>
      </ul>
    </PageScaffold>
  );
}
