import { AdminDisputesWorkspace } from "@/components/admin/AdminDisputesWorkspace";
import { requireRole } from "@/lib/auth/routeGuard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadDisputesListForAdmin } from "@/lib/disputes/disputeListQueries";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminDisputesListPage(props: PageProps) {
  await requireRole("admin");
  const sp = (await props.searchParams) ?? {};
  const flashErrRaw = typeof sp.error === "string" ? sp.error : null;
  const flashErr = flashErrRaw ? (toAdminDisplayError(flashErrRaw, "disputes") ?? "처리에 실패했습니다.") : null;
  const flashOk = sp.ok === "sanction" ? "조치를 기록했습니다." : null;

  const supabase = await createClient();
  let adminBypass: ReturnType<typeof createServiceRoleClient> | undefined;
  // [보안 주석] service_role로 RLS 우회
  // 이 페이지는 (admin)/layout.tsx + (admin)/(console)/layout.tsx
  // 이중 requireRole("admin") 가드로 보호됨.
  // service_role 사용은 관리자 업무상 의도된 것임.
  try {
    adminBypass = createServiceRoleClient();
  } catch {
    adminBypass = undefined;
  }
  const { table, items, error } = await loadDisputesListForAdmin(supabase, 50, {
    adminBypassClient: adminBypass,
  });

  return (
    <div className="space-y-4">
      {flashOk ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{flashOk}</p> : null}
      {flashErr ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">{flashErr}</p> : null}
      <AdminDisputesWorkspace items={items} listError={error} table={table} />
    </div>
  );
}
