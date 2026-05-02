import { PageScaffold } from "@/components/shell/PageScaffold";
import { DisputesListView } from "@/components/disputes/DisputesListView";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadDisputesListForUser } from "@/lib/disputes/disputeListQueries";
import { DISPUTE_LIST_DATA_MODEL, DISPUTE_W22_DATA_MODEL } from "@/lib/disputes/disputeDataModel";

const EMPTY_COPY = "현재 확인할 분쟁이 없습니다.";
const LOAD_ERROR_COPY = "분쟁 내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";

export default async function StudentDisputesListPage() {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const { table, items, error, usedColumn, probe } = await loadDisputesListForUser(supabase, user.id, "student", 40);

  if (error) {
    console.error("[student/support/disputes] list load failed", error);
  }

  const listFailed = Boolean(error && !items.length);
  const hasRows = items.length > 0;

  return (
    <PageScaffold
      eyebrow="지원 · 분쟁"
      title="분쟁 접수 및 처리 현황"
      description="맞춤의뢰 진행 중 접수한 분쟁과 처리 상태를 확인할 수 있습니다."
      ctas={[
        { href: "/home", label: "홈", tone: "slate" },
        { href: "/mypage", label: "마이페이지", tone: "slate" },
      ]}
      sections={[
        {
          title: "안내",
          body: "목록에서 상세를 누르면 해당 건의 진행 내용을 확인할 수 있어요.",
          status: hasRows ? "connected" : listFailed ? "skeleton" : "connected",
        },
      ]}
      emptyState={EMPTY_COPY}
      loadingState="목록을 불러오는 중입니다."
      errorState={listFailed ? LOAD_ERROR_COPY : "—"}
      dataPoints={[...DISPUTE_LIST_DATA_MODEL, ...DISPUTE_W22_DATA_MODEL]}
    >
      <DisputesListView
        items={items}
        detailHref={(id) => `/support/disputes/${id}`}
        listError={error}
        usedColumn={usedColumn}
        table={table}
        probe={probe}
      />
    </PageScaffold>
  );
}
