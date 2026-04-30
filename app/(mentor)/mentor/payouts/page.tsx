import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorPayoutsBody } from "@/components/mentor/MentorPayoutsBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadMentorPayoutsPageData } from "@/lib/mentor/mentorPayoutsQueries";
import { MENTOR_PAYOUTS_DATA_MODEL } from "@/lib/mentor/mentorDataModel";

export default async function MentorPayoutsPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const bundle = await loadMentorPayoutsPageData(supabase, user.id);

  const hasAny =
    bundle.settlementPayouts.lines.length > 0 ||
    bundle.settlementPayouts.totals.count > 0 ||
    (bundle.payoutTable && bundle.tableRows.length > 0) ||
    bundle.subSummary.n > 0 ||
    bundle.customSummary.n > 0 ||
    bundle.customOrderSettlements.rows.length > 0;
  return (
    <PageScaffold
      eyebrow="Mentor / Payouts"
      title="정산 · 수익"
      description="맞춤의뢰는 custom_order_settlement_items(멘토 본인 행)을 기준으로 표시합니다. payouts·구독 요약은 보조입니다."
      ctas={[
        { href: "/mentor/dashboard", label: "대시보드", tone: "slate" },
        { href: "/mentor/profile", label: "프로필", tone: "green" },
        { href: "/mentor/profile/edit", label: "프로필 편집", tone: "slate" },
      ]}
      sections={[
        {
          title: "맞춤의뢰 정산",
          body: bundle.settlementPayouts.error
            ? bundle.settlementPayouts.error
            : `정산 행 ${bundle.settlementPayouts.totals.count}건 · 예정 ${bundle.settlementPayouts.totals.expectedMentorAmount.toLocaleString("ko-KR")}원 · 완료 ${bundle.settlementPayouts.totals.paidMentorAmount.toLocaleString("ko-KR")}원`,
          status: bundle.settlementPayouts.error ? "skeleton" : "connected",
        },
        { title: "payouts 후보", body: bundle.payoutTable ? `payout: ${bundle.payoutTable}` : (bundle.payoutError ?? "—"), status: bundle.payoutTable ? "connected" : "skeleton" },
        { title: "캐시/환불", body: "이 모듈 외 /wallet /cash 연계(수정 없음).", status: "skeleton" },
      ]}
      emptyState={!hasAny ? "아직 수익·지급 행이 없거나 RLS로 0입니다." : "요약/테이블은 아래."}
      loadingState="RSC. 기간·필터(클라) 후속."
      errorState="조회·RLS 오류는 summary 오류란·테이블 비움."
      dataPoints={[...MENTOR_PAYOUTS_DATA_MODEL]}
    >
      <MentorPayoutsBody bundle={bundle} />
    </PageScaffold>
  );
}
