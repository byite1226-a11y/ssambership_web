import { PageScaffold } from "@/components/shell/PageScaffold";
import { StudentDisputesFilterableList } from "@/components/disputes/StudentDisputesFilterableList";
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
      description={
        <>
          <span className="md:hidden">접수된 분쟁의 진행 상태를 확인하세요.</span>
          <span className="hidden md:inline">맞춤의뢰 등으로 접수된 분쟁의 진행 상태를 상세 보기에서 확인할 수 있습니다.</span>
        </>
      }
    >
      <StudentDisputesFilterableList
        items={items}
        detailHrefBase="/mentor/support/disputes"
        listError={error}
        usedColumn={usedColumn}
        table={table}
        probe={probe}
        accent="green"
      />
    </PageScaffold>
  );
}
