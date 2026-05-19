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
      hideFooterPlaceholderCards
      eyebrow="멘토"
      title="정산 · 수익"
      description="맞춤의뢰 정산 예정·완료 금액과 주문별 내역을 확인하세요. 구독·기타 요약은 참고용입니다."
      ctas={[
        { href: "/mentor/dashboard", label: "대시보드", tone: "slate" },
        { href: "/mentor/support/disputes", label: "분쟁 현황", tone: "slate" },
        { href: "/mentor/profile", label: "프로필", tone: "slate" },
      ]}
      sections={[]}
      emptyState={!hasAny ? "아직 표시할 정산·수익 정보가 없습니다." : "아래에서 상세를 확인하세요."}
      loadingState="정산 정보를 불러오는 중입니다."
      errorState="일부 정보를 불러오지 못했을 수 있습니다. 잠시 후 다시 시도해 주세요."
      dataPoints={[...MENTOR_PAYOUTS_DATA_MODEL]}
    >
      <MentorPayoutsBody bundle={bundle} />
    </PageScaffold>
  );
}
