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
    (bundle.payoutTable && bundle.tableRows.length > 0) || bundle.subSummary.n > 0 || bundle.customSummary.n > 0;
  return (
    <PageScaffold
      eyebrow="Mentor / Payouts"
      title="정산 · 수익"
      description="payouts/구독/custom_request_orders(읽기 전용)에서 집계. 정산확정·캐시/환불 로직·관리자 화면은 손대지 않음(포인트만 표시)."
      ctas={[
        { href: "/mentor/dashboard", label: "대시보드", tone: "slate" },
        { href: "/mentor/profile", label: "프로필", tone: "green" },
        { href: "/mentor/profile/edit", label: "프로필 편집", tone: "slate" },
      ]}
      sections={[
        { title: "정산", body: bundle.payoutTable ? `payout: ${bundle.payoutTable}` : (bundle.payoutError ?? "—"), status: bundle.payoutTable ? "connected" : "skeleton" },
        { title: "지급 상태", body: "상태·배치는 테이블 컬럼 확정 후(이번: 행·카운트만).", status: "skeleton" },
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
