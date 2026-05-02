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
      eyebrow="Mentor / Payouts"
      title="정산 · 수익"
      description="맞춤의뢰 정산 예정·완료 금액과 주문별 내역을 확인하세요. 구독·기타 요약은 참고용입니다."
      ctas={[
        { href: "/mentor/dashboard", label: "대시보드", tone: "slate" },
        { href: "/mentor/support/disputes", label: "분쟁 현황 보기", tone: "slate" },
        { href: "/mentor/profile", label: "프로필", tone: "green" },
        { href: "/mentor/profile/edit", label: "프로필 편집", tone: "slate" },
      ]}
      sections={[
        {
          title: "맞춤의뢰 정산",
          body: bundle.settlementPayouts.error
            ? bundle.settlementPayouts.error
            : `정산 내역 ${bundle.settlementPayouts.totals.count}건 · 예정 ${bundle.settlementPayouts.totals.expectedMentorAmount.toLocaleString("ko-KR")}원 · 완료 ${bundle.settlementPayouts.totals.paidMentorAmount.toLocaleString("ko-KR")}원`,
          status: bundle.settlementPayouts.error ? "skeleton" : "connected",
        },
        {
          title: "기타 정산·지급",
          body: bundle.payoutTable ? "연결된 지급 내역 소스가 있습니다." : (bundle.payoutError ?? "추가 지급 내역을 찾지 못했습니다."),
          status: bundle.payoutTable ? "connected" : "skeleton",
        },
        {
          title: "캐시·분쟁·환불",
          body: "캐시 충전·환불은 지갑 메뉴에서, 접수된 분쟁은 분쟁 현황에서 확인할 수 있어요.",
          status: "skeleton",
        },
      ]}
      emptyState={!hasAny ? "아직 표시할 정산·수익 정보가 없습니다." : "아래에서 상세를 확인하세요."}
      loadingState="정산 정보를 불러오는 중입니다."
      errorState="일부 정보를 불러오지 못했을 수 있습니다. 잠시 후 다시 시도해 주세요."
      dataPoints={[...MENTOR_PAYOUTS_DATA_MODEL]}
    >
      <MentorPayoutsBody bundle={bundle} />
    </PageScaffold>
  );
}
