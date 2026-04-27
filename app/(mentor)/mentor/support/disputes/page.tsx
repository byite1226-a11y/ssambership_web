import { PageScaffold } from "@/components/shell/PageScaffold";
import { DisputesListView } from "@/components/disputes/DisputesListView";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { DISPUTE_LIST_DATA_MODEL, DISPUTE_W22_DATA_MODEL } from "@/lib/disputes/disputeDataModel";
import { loadDisputesListForUser } from "@/lib/disputes/disputeListQueries";

/**
 * 멘토 본인 관련 disputes 계열 — FK 후보(mentor_id, mentor_user_id, …)와 loadDisputesListForUser(kind: mentor)
 * 상세 권한은 canPartyViewDispute(mentor)가 /mentor/support/disputes/[id]에서 별도 검증.
 */
export default async function MentorDisputesListPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const { table, items, error, usedColumn, probe } = await loadDisputesListForUser(
    supabase,
    user.id,
    "mentor",
    40
  );

  return (
    <PageScaffold
      eyebrow="Mentor / Support / Disputes"
      title="분쟁·환불(내 건)"
      description="disputes 계열 · 멘토 FK(후보) 필터. 학생 목록과 동일 list 쿼리, 상세만 /mentor/support/disputes/[id]."
      ctas={[
        { href: "/mentor/dashboard", label: "대시보드", tone: "green" },
        { href: "/mentor/payouts", label: "정산", tone: "slate" },
      ]}
      sections={[
        {
          title: "목록",
          body: table ? `테이블: ${table} · ${probe}` : (error ?? "—"),
          status: table ? "connected" : "skeleton",
        },
        { title: "권한", body: "requireRole(mentor) + 목록용 mentor FK", status: "connected" },
        { title: "상세", body: "canPartyViewDispute(mentor) — [id] 페이지(기존)에서 검증.", status: "connected" },
      ]}
      emptyState="담당 분쟁·신청 0건(또는 RLS)."
      loadingState="loading.tsx"
      errorState={error && !items.length ? error : "—"}
      dataPoints={[...DISPUTE_LIST_DATA_MODEL, ...DISPUTE_W22_DATA_MODEL]}
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
