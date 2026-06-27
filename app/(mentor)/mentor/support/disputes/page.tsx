import { PageScaffold } from "@/components/shell/PageScaffold";
import { DisputesListView } from "@/components/disputes/DisputesListView";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadDisputesListForUser } from "@/lib/disputes/disputeListQueries";

export default async function MentorDisputesListPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const { table, items, error, usedColumn, probe } = await loadDisputesListForUser(supabase, user.id, "mentor", 40);

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="지원 · 분쟁"
      title="분쟁·환불 현황"
      description="맞춤의뢰 등으로 접수된 분쟁을 확인하고, 진행 상태를 살펴볼 수 있습니다. 목록에서 상세 보기를 누르면 진행 상태를 확인할 수 있어요."
      ctas={[
        { href: "/mentor/mypage", label: "마이페이지", tone: "green" },
        { href: "/mentor/payouts", label: "정산", tone: "slate" },
      ]}
    >
      <DisputesListView
        items={items}
        detailHref={(id) => `/mentor/support/disputes/${id}`}
        listError={error}
        usedColumn={usedColumn}
        table={table}
        probe={probe}
      />
    </PageScaffold>
  );
}
