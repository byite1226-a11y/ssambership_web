import { PageScaffold } from "@/components/shell/PageScaffold";

export default function StudentSubscriptionsPage() {
  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="Student / Subscriptions"
      title="구독 관리"
      description="학생 구독, 결제, 환불 신청 흐름을 운영 데이터와 함께 미리 고정합니다."
      ctas={[
        { href: "/mentors", label: "멘토·플랜(구독/결제)", tone: "blue" },
        { href: "/mypage", label: "내 정보", tone: "slate" },
      ]}
      sections={[
        { title: "현재 플랜", body: "subscriptions 상태/만료일/자동갱신 정보.", status: "skeleton" },
        { title: "결제 내역", body: "payments 영수증/상태 목록.", status: "skeleton" },
        { title: "환불 요청", body: "refunds 신청/처리상태.", status: "skeleton" },
        { title: "감사 로그 연결", body: "중요 변경을 audit_logs에 기록.", status: "skeleton" },
      ]}
      emptyState="구독이 없으면 무료 체험 또는 유료 플랜 전환 CTA를 보여줍니다."
      dataPoints={["subscriptions", "payments", "refunds", "audit_logs"]}
    />
  );
}
