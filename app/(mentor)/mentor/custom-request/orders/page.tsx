import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import {
  fetchMentorCustomRequestOrdersFromPrimaryTable,
  mentorCustomOrderPaymentBadge,
  mentorCustomOrderPaymentLine,
  mentorCustomOrderStatusHeadline,
  mentorCustomOrderWorkroomHref,
} from "@/lib/home/mentorDashboardQueries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, unknown>;

export default async function MentorCustomRequestOrdersListPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const { rows, error } = await fetchMentorCustomRequestOrdersFromPrimaryTable(supabase, user.id, 80);

  return (
    <PageScaffold
      eyebrow="멘토 / 맞춤의뢰"
      title="맞춤의뢰 주문"
      description="학생이 제안을 선택해 생성된 주문입니다. 작업방은 공통 주문방 URL에서 이어집니다."
      ctas={[
        { href: "/mentor/custom-request/dashboard", label: "맞춤의뢰 홈", tone: "slate" },
        { href: "/mentor/custom-request/posts", label: "모집 중 의뢰", tone: "green" },
        { href: "/mentor/dashboard", label: "멘토 대시보드", tone: "blue" },
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
      {rows.length === 0 && !error ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
          아직 표시할 맞춤의뢰 주문이 없습니다. 학생이 지원서를 선택하면 여기에 나타납니다.
        </p>
      ) : null}
      <ul className="space-y-3">
        {rows.map((raw) => {
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
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900">{titleLine}</p>
                    <p className="mt-1 text-xs text-slate-500">주문 ID · {id}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800">
                    {mentorCustomOrderStatusHeadline(r)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-700">
                    결제: {mentorCustomOrderPaymentLine(r)}
                  </span>
                  <span className="rounded-md border border-slate-100 px-2 py-0.5 text-slate-500">
                    배지: {mentorCustomOrderPaymentBadge(r)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-bold text-blue-800 underline">작업방 열기 →</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </PageScaffold>
  );
}
