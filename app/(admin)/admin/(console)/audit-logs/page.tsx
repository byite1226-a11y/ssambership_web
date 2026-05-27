import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminUnifiedActivityLogView } from "@/components/admin/AdminUnifiedActivityLogView";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/routeGuard";
import { loadAdminUnifiedActivityLog } from "@/lib/admin/adminUnifiedActivityLog";

export default async function AdminAuditLogsPage() {
  await requireRole("admin");

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

  let fatalMessage: string | null = null;
  let activity: Awaited<ReturnType<typeof loadAdminUnifiedActivityLog>>;
  try {
    activity = await loadAdminUnifiedActivityLog(supabase, {
      adminBypassClient: adminBypass,
      limit: 50,
    });
  } catch {
    fatalMessage = "운영 로그를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    activity = { entries: [], partial: false, loadWarning: null };
  }

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="관리자 / 감사 로그"
      title="감사 로그"
      description="신고·분쟁·환불·리뷰·주문 이벤트·공지 등 최근 흐름을 한 화면에서 확인합니다. 결제·환불·정산·주문 상태는 이 화면에서 바뀌지 않으며, 필요 시 환불·분쟁 등 각 메뉴에서 수동으로 처리합니다. 기술적인 오류 메시지는 표시하지 않습니다."
      ctas={[
        { href: "/admin", label: "대시보드", tone: "slate" },
        { href: "/admin/refunds", label: "환불 관리", tone: "blue" },
        { href: "/admin/disputes", label: "분쟁 관리", tone: "blue" },
      ]}
      sections={[
        {
          title: "통합 표시",
          body: "여러 업무에서 나온 최근 변경·접수를 시간순으로 합쳐 보여 줍니다. 소스마다 가져오는 건수에 한도가 있어 전체 이력과는 다를 수 있습니다.",
          status: "connected",
        },
        {
          title: "보관·검색",
          body: "기간·키워드 검색은 이 화면에서 아직 사용할 수 없습니다. 필요한 경우 각 메뉴에서 해당 건을 직접 찾아 주세요.",
          status: "skeleton",
        },
      ]}
      emptyState="표시할 운영 로그가 없습니다."
      dataPoints={[]}
      loadingState=""
      errorState=""
    >
      <div className="space-y-4">
        {fatalMessage ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-sm font-semibold text-amber-950">{fatalMessage}</p>
        ) : null}
        <AdminUnifiedActivityLogView entries={activity.entries} loadWarning={fatalMessage ? null : activity.loadWarning} />
      </div>
    </PageScaffold>
  );
}
