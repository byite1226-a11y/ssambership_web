import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminContentReportsTable } from "@/components/admin/AdminContentReportsTable";
import { createClient } from "@/lib/supabase/server";
import { fetchAdminUsersDisplayByIds, loadAdminReportsList } from "@/lib/admin/adminQueries";
import { mentorProfilesAdminReadClient } from "@/lib/admin/mentorProfilesAdminRead";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";

const CONTENT_REPORTS_TABLE = "content_reports";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminReportsPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const errParam = sp.error;
  const okParam = sp.ok;
  const flashErrRaw = typeof errParam === "string" ? errParam : Array.isArray(errParam) ? errParam[0] : null;
  const flashOkRaw = typeof okParam === "string" ? okParam : Array.isArray(okParam) ? okParam[0] : null;
  const flashErr = flashErrRaw ? (toAdminDisplayError(flashErrRaw, "reports") ?? "처리에 실패했습니다.") : null;
  const flashOk =
    flashOkRaw === "reviewing"
      ? "상태를 검토 중으로 변경했습니다."
      : flashOkRaw === "resolved"
        ? "신고를 처리 완료로 표시했습니다."
        : flashOkRaw === "dismissed"
          ? "신고를 종결했습니다."
          : null;

  const supabase = await createClient();
  const list = await loadAdminReportsList(supabase, 50);
  const readDb = mentorProfilesAdminReadClient(supabase);
  const reporterIds = list.rows
    .map((r) => {
      const row = r as Record<string, unknown>;
      const v = row.reporter_id ?? row.user_id ?? row.author_id;
      return v != null ? String(v).trim() : "";
    })
    .filter((x) => x.length > 0);
  const userById = await fetchAdminUsersDisplayByIds(readDb, reporterIds);

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="관리자 / 신고"
      title="신고 관리"
      description="사용자가 접수한 신고를 확인하고 조치할 수 있습니다."
      ctas={[
        { href: "/admin/reviews", label: "리뷰 관리", tone: "slate" },
        { href: "/admin", label: "대시보드", tone: "blue" },
      ]}
      sections={[
        { title: "신고 유형", body: "접수된 신고의 유형과 상태를 확인합니다.", status: list.table ? "connected" : "skeleton" },
        { title: "조치", body: "검토 후 필요한 운영 조치를 진행합니다.", status: "skeleton" },
      ]}
      emptyState=""
      loadingState=""
      errorState=""
      dataPoints={[]}
    >
      <div className="space-y-4">
        {flashOk ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm font-semibold text-emerald-950">{flashOk}</p>
        ) : null}
        {flashErr ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 p-3 text-sm font-semibold text-red-950">{flashErr}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">신고 목록</span>
          <AdminStatusBadge result={list} hint="최근 접수 기준 최대 50건" />
        </div>
        {list.table === CONTENT_REPORTS_TABLE ? (
          <AdminContentReportsTable list={list} userById={userById} />
        ) : (
          <AdminRecordTable result={list} errorDisplayContext="reports" />
        )}
      </div>
    </PageScaffold>
  );
}
