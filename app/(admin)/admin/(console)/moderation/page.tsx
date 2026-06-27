import { AdminModerationWorkspace } from "@/components/admin/AdminModerationWorkspace";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminListPagination } from "@/components/admin/AdminListPagination";
import { createClient } from "@/lib/supabase/server";
import {
  countAdminReportsByStatus,
  fetchAdminUsersDisplayByIds,
  loadAdminReportsListPaged,
} from "@/lib/admin/adminQueries";
import { mentorProfilesAdminReadClient } from "@/lib/admin/mentorProfilesAdminRead";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";
import { parseAdminListParams } from "@/lib/admin/adminListParams";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

const MODERATION_BASE_PATH = "/admin/moderation";

export default async function AdminModerationPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const flashErr = typeof sp.error === "string" ? (toAdminDisplayError(sp.error, "reports") ?? "처리 실패") : null;
  const flashOk =
    sp.ok === "hidden"
      ? "콘텐츠를 숨김 처리했습니다."
      : sp.ok === "deleted"
        ? "삭제 처리했습니다."
        : sp.ok === "restored"
          ? "정상 복구했습니다."
          : null;

  const supabase = await createClient();
  const params = parseAdminListParams(sp, { defaultPageSize: 25, defaultStatus: "pending" });
  const [list, byStatus] = await Promise.all([
    loadAdminReportsListPaged(supabase, params),
    countAdminReportsByStatus(supabase),
  ]);
  const statusTabs = [
    { value: "pending", label: "대기", count: byStatus.pending ?? 0 },
    { value: "reviewing", label: "검토 중", count: byStatus.reviewing ?? 0 },
    { value: "resolved", label: "해결됨", count: byStatus.resolved ?? 0 },
    { value: "dismissed", label: "기각", count: byStatus.dismissed ?? 0 },
    { value: "rejected", label: "거절", count: byStatus.rejected ?? 0 },
    { value: "hidden", label: "숨김", count: byStatus.hidden ?? 0 },
    { value: "removed", label: "삭제", count: byStatus.removed ?? 0 },
    { value: "all", label: "전체", count: byStatus.all ?? 0 },
  ];
  // [보안 주석] service_role로 RLS 우회
  // 이 페이지는 (admin)/layout.tsx + (admin)/(console)/layout.tsx
  // 이중 requireRole("admin") 가드로 보호됨.
  // service_role 사용은 관리자 업무상 의도된 것임.
  const readDb = mentorProfilesAdminReadClient(supabase);
  const reporterIds = list.rows
    .map((r) => String((r as Record<string, unknown>).reporter_id ?? (r as Record<string, unknown>).user_id ?? "").trim())
    .filter(Boolean);
  const userMap = await fetchAdminUsersDisplayByIds(readDb, reporterIds);
  const userById: Record<string, { nickname: string | null; full_name: string | null }> = {};
  userMap.forEach((v, k) => {
    userById[k] = v;
  });

  return (
    <div className="space-y-4">
      {flashOk ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{flashOk}</p> : null}
      {flashErr ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">{flashErr}</p> : null}
      <AdminListToolbar
        basePath={MODERATION_BASE_PATH}
        params={params}
        searchPlaceholder="신고/대상/사유/메모 검색"
        statusTabs={statusTabs}
      />
      <AdminModerationWorkspace list={list} userById={userById} />
      <AdminListPagination
        basePath={MODERATION_BASE_PATH}
        params={params}
        totalCount={list.totalCount}
        rowsOnPage={list.rows.length}
      />
    </div>
  );
}
