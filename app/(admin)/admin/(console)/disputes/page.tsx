import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminDisputesListView } from "@/components/disputes/AdminDisputesListView";
import { requireRole } from "@/lib/auth/routeGuard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadDisputesListForAdmin } from "@/lib/disputes/disputeListQueries";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminDisputesListPage(props: PageProps) {
  await requireRole("admin");
  const sp = (await props.searchParams) ?? {};
  const errRaw = sp.error;
  const flashErrRaw = typeof errRaw === "string" ? errRaw : Array.isArray(errRaw) ? errRaw[0] : null;
  const flashErr = flashErrRaw ? (toAdminDisplayError(flashErrRaw, "disputes") ?? "처리에 실패했습니다.") : null;

  const supabase = await createClient();
  let adminBypass: ReturnType<typeof createServiceRoleClient> | undefined;
  try {
    adminBypass = createServiceRoleClient();
  } catch {
    adminBypass = undefined;
  }
  const { table, items, error, probe } = await loadDisputesListForAdmin(supabase, 50, {
    adminBypassClient: adminBypass,
  });

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="관리자 / 분쟁"
      title="분쟁 관리"
      description="맞춤의뢰 등 접수된 분쟁을 조회하고, 검토·운영 메모·해결·종결 처리를 합니다. 환불·정산·주문 상태는 이 화면에서 자동으로 바뀌지 않으며, 필요 시 환불 관리 등에서 수동으로 처리합니다. 기술적인 오류 메시지는 표시하지 않습니다."
      ctas={[
        { href: "/admin/refunds", label: "환불 관리", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "blue" },
        { href: "/admin", label: "대시보드", tone: "slate" },
      ]}
      sections={[
        {
          title: "분쟁 목록",
          body: "표준 분쟁 기록 기준 최근 접수 순으로 표시합니다. 진행 중·검토 중·에스컬레이션은 대시보드 집계와 동일한 상태값을 사용합니다.",
          status: table ? "connected" : "skeleton",
        },
        {
          title: "상세·조치",
          body: "행별 상세 보기에서 검토 중 전환, 운영 메모, 해결·종결을 진행합니다. 금전 처리는 환불 관리 등 후속 작업이 필요할 수 있습니다.",
          status: "connected",
        },
      ]}
      emptyState=""
      loadingState=""
      errorState=""
      dataPoints={[]}
    >
      <div className="space-y-4">
        {flashErr ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 p-3 text-sm font-semibold text-red-950">{flashErr}</p>
        ) : null}
        <AdminDisputesListView items={items} listError={error} table={table} probe={probe} />
      </div>
    </PageScaffold>
  );
}
