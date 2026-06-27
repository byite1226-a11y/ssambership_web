import { AdminDisputesWorkspace } from "@/components/admin/AdminDisputesWorkspace";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminListPagination } from "@/components/admin/AdminListPagination";
import { requireRole } from "@/lib/auth/routeGuard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { mapRowToAdminListItem } from "@/lib/disputes/disputeListQueries";
import {
  countAdminDisputesByStatus,
  loadAdminDisputesListPaged,
} from "@/lib/admin/adminQueries";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";
import { parseAdminListParams } from "@/lib/admin/adminListParams";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

const DISPUTES_BASE_PATH = "/admin/disputes";

export default async function AdminDisputesListPage(props: PageProps) {
  await requireRole("admin");
  const sp = (await props.searchParams) ?? {};
  const flashErrRaw = typeof sp.error === "string" ? sp.error : null;
  const flashErr = flashErrRaw ? (toAdminDisplayError(flashErrRaw, "disputes") ?? "처리에 실패했습니다.") : null;
  const flashOk = sp.ok === "sanction" ? "조치를 기록했습니다." : null;

  const supabase = await createClient();
  let adminBypass: ReturnType<typeof createServiceRoleClient> | undefined;
  // [보안 주석] service_role로 RLS 우회 — 관리자 가드 아래에서만 사용.
  try {
    adminBypass = createServiceRoleClient();
  } catch {
    adminBypass = undefined;
  }

  const params = parseAdminListParams(sp, { defaultPageSize: 25, defaultStatus: "open" });
  const [paged, byStatus] = await Promise.all([
    loadAdminDisputesListPaged(supabase, params, { adminBypassClient: adminBypass }),
    countAdminDisputesByStatus(supabase, { adminBypassClient: adminBypass }),
  ]);
  const items = paged.rows.map((r) => mapRowToAdminListItem(r));
  const statusTabs = [
    { value: "open", label: "접수", count: byStatus.open ?? 0 },
    { value: "under_review", label: "검토 중", count: byStatus.under_review ?? 0 },
    { value: "escalated", label: "운영 검토", count: byStatus.escalated ?? 0 },
    { value: "resolved", label: "해결", count: byStatus.resolved ?? 0 },
    { value: "dismissed", label: "종료", count: byStatus.dismissed ?? 0 },
    { value: "all", label: "전체", count: byStatus.all ?? 0 },
  ];

  return (
    <div className="space-y-4">
      {flashOk ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{flashOk}</p> : null}
      {flashErr ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">{flashErr}</p> : null}
      <AdminListToolbar
        basePath={DISPUTES_BASE_PATH}
        params={params}
        searchPlaceholder="분쟁/주문/구독/사용자 ID, 사유 검색"
        statusTabs={statusTabs}
      />
      <AdminDisputesWorkspace items={items} listError={paged.error} table={paged.table} />
      <AdminListPagination
        basePath={DISPUTES_BASE_PATH}
        params={params}
        totalCount={paged.totalCount}
        rowsOnPage={items.length}
      />
    </div>
  );
}
