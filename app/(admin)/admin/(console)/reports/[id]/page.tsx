import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/routeGuard";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";
import { updateContentReportStatusAction } from "@/lib/admin/adminReportActions";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";

const TABLE = "content_reports" as const;

type Props = { params: Promise<{ id: string }> };

export default async function AdminReportDetailPage(props: Props) {
  await requireRole("admin");
  const { id } = await props.params;
  const supabase = await createClient();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  const row = data as Record<string, unknown> | null;
  const loadErr = error ? toAdminDisplayError(error.message, "reports") ?? "불러오지 못했습니다." : null;

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="관리자 / 신고"
      title="신고 상세"
      description="신고 본문·대상·상태를 확인합니다. 상태 변경은 아래 액션이 연결된 경우에만 동작합니다."
      ctas={[
        { href: "/admin/reports", label: "목록", tone: "blue" },
        { href: "/admin", label: "대시보드", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
    >
      <div className="space-y-4">
        <Link href="/admin/reports" className="text-sm font-extrabold text-indigo-800 underline" prefetch={false}>
          ← 신고 목록
        </Link>
        {loadErr ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{loadErr}</p> : null}
        {row ? (
          <pre className="max-h-[480px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">
            {JSON.stringify(row, null, 2)}
          </pre>
        ) : !loadErr ? (
          <p className="text-sm text-slate-600">해당 id의 신고를 찾지 못했습니다.</p>
        ) : null}

        {row ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-extrabold text-slate-900">상태 변경</p>
            <p className="mt-1 text-xs text-slate-500">버튼은 서버 액션과 동일한 폼을 사용합니다. 권한·스키마에 따라 실패할 수 있어요.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={updateContentReportStatusAction} className="inline">
                <input type="hidden" name="reportId" value={id} />
                <input type="hidden" name="nextStatus" value="reviewing" />
                <FormSubmitButton idleLabel="검토 중" pendingLabel="…" className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white" />
              </form>
              <form action={updateContentReportStatusAction} className="inline">
                <input type="hidden" name="reportId" value={id} />
                <input type="hidden" name="nextStatus" value="resolved" />
                <FormSubmitButton idleLabel="처리 완료" pendingLabel="…" className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white" />
              </form>
              <form action={updateContentReportStatusAction} className="inline">
                <input type="hidden" name="reportId" value={id} />
                <input type="hidden" name="nextStatus" value="dismissed" />
                <FormSubmitButton idleLabel="종결" pendingLabel="…" className="rounded-lg bg-slate-600 px-3 py-2 text-xs font-bold text-white" />
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </PageScaffold>
  );
}
