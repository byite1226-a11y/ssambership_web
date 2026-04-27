import { PageScaffold } from "@/components/shell/PageScaffold";
import { DisputesListView } from "@/components/disputes/DisputesListView";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadDisputesListForUser } from "@/lib/disputes/disputeListQueries";
import { DISPUTE_LIST_DATA_MODEL, DISPUTE_W22_DATA_MODEL } from "@/lib/disputes/disputeDataModel";

export default async function StudentDisputesListPage() {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const { table, items, error, usedColumn, probe } = await loadDisputesListForUser(supabase, user.id, "student", 40);
  return (
    <PageScaffold
      eyebrow="Support / Disputes"
      title="내 분쟁·환불"
      description="disputes 계열 · 학생(원고) FK로 필터. QnA·캐시·맞춤·멘토·어드민·(기존 상세 페이지) 미변경."
      ctas={[
        { href: "/home", label: "홈", tone: "slate" },
        { href: "/mypage", label: "마이페이지", tone: "slate" },
      ]}
      sections={[
        { title: "목록", body: table ? `테이블: ${table} · ${probe}` : (error ?? "—"), status: table ? "connected" : "skeleton" },
        { title: "권한", body: "requireRole(student)", status: "connected" },
        { title: "상세", body: "행의 상세 → /support/disputes/[id] (기존).", status: "connected" },
      ]}
      emptyState="분쟁/신청이 없을 때(또는 RLS) 안내."
      loadingState="RSC."
      errorState={error && !items.length ? error : "—"}
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
