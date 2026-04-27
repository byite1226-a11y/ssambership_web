import { PageScaffold } from "@/components/shell/PageScaffold";
import { DisputeMentorPageBody } from "@/components/disputes/DisputeMentorPageBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { canPartyViewDispute, loadDisputeById } from "@/lib/disputes/disputeQueries";
import { DISPUTE_W22_DATA_MODEL } from "@/lib/disputes/disputeDataModel";

type PageProps = { params: Promise<{ id: string }> };

export default async function MentorDisputeDetailPage(props: PageProps) {
  const { id } = await props.params;
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const bundle = await loadDisputeById(supabase, id);
  const row = bundle.dispute.row;
  const access = canPartyViewDispute(user.id, "mentor", row);
  return (
    <PageScaffold
      eyebrow="Mentor / Support / Dispute"
      title="분쟁·환불 상세(멘토)"
      description="책정·응·피·주문(맞춤) 연동은 FK·RLS(학생/관리자 상세 라우트·파일은 변경 없음)."
      ctas={[
        { href: "/mentor/dashboard", label: "대시보드", tone: "green" },
        { href: "/mentor/payouts", label: "정산", tone: "slate" },
      ]}
      sections={[
        {
          title: "권한",
          body: !row ? "row 없음" : access.ok ? `멘토/당사자: ${access.detail}` : "거부",
          status: !row || access.ok ? "connected" : "skeleton",
        },
        { title: "로드", body: row ? bundle.probe : (bundle.dispute.error ?? "—"), status: row ? "connected" : "skeleton" },
        { title: "액션", body: "승인/환불(후속).", status: "skeleton" },
      ]}
      emptyState="사건 id 없음."
      loadingState="RSC"
      errorState="RLS/오류"
      dataPoints={[...DISPUTE_W22_DATA_MODEL]}
    >
      {row && !access.ok ? (
        <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-sm font-bold text-amber-950">이 사건(멘토) 조회 권한이 없습니다. ({access.detail})</p>
      ) : null}
      {row && access.ok ? <DisputeMentorPageBody bundle={bundle} /> : !row && bundle.dispute.error ? (
        <p className="text-sm text-amber-900">Supabase: {bundle.dispute.error}</p>
      ) : !row && !bundle.dispute.error ? (
        <p className="text-sm text-slate-600">id `{id}` 없음</p>
      ) : null}
    </PageScaffold>
  );
}
