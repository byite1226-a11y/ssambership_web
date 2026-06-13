import { PageScaffold } from "@/components/shell/PageScaffold";
import { EmptyState } from "@/components/common/EmptyState";
import { ReportDialog } from "@/components/reports/ReportDialog";

export default function StudentSupportReportsPage() {
  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="고객지원"
      title="내 신고 내역"
      description="접수·검토·처리 결과를 한곳에서 보는 기능은 아직 목록 API가 연결되어 있지 않습니다."
      ctas={[
        { href: "/support/disputes", label: "분쟁 내역", tone: "blue" },
        { href: "/notifications", label: "알림 센터", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={["content_reports (reporter_id 기준 조회 필요)"]}
    >
      <EmptyState
        title="아직 연결된 신고 목록이 없습니다"
        description="커뮤니티 게시글·숏폼은 해당 글 화면에서 신고할 수 있어요. 아래는 연결 예시 폼입니다(대상 ID가 없으면 제출되지 않습니다)."
      />
      <div className="mt-6 max-w-md">
        <ReportDialog targetType="community_post" returnPath="/support/reports" />
      </div>
      <p className="mt-6 text-xs text-slate-500">처리 상태는 알림·이메일·고객지원 정책이 확정되는 대로 이 페이지에도 연결할 수 있어요.</p>
    </PageScaffold>
  );
}
