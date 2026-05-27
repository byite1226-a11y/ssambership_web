import { AdminModerationWorkspace } from "@/components/admin/AdminModerationWorkspace";
import { createClient } from "@/lib/supabase/server";
import { fetchAdminUsersDisplayByIds, loadAdminReportsList } from "@/lib/admin/adminQueries";
import { mentorProfilesAdminReadClient } from "@/lib/admin/mentorProfilesAdminRead";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

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
  const list = await loadAdminReportsList(supabase, 50);
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
      <AdminModerationWorkspace list={list} userById={userById} />
    </div>
  );
}
