import { PageScaffold } from "@/components/shell/PageScaffold";

export default function StudentSubscriptionsPage() {
  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="구독"
      title="구독 관리"
      description="이용 중인 플랜, 결제·환불 신청 흐름을 한곳에서 정리할 예정이에요. 지금은 멘토 선택 후 구독 화면으로 이동해 주세요."
      ctas={[
        { href: "/mentors", label: "멘토·플랜(구독/결제)", tone: "blue" },
        { href: "/mypage", label: "내 정보", tone: "slate" },
      ]}
      sections={[
        { title: "현재 플랜", body: "이용 중인 요금제·갱신 일정을 여기서 확인할 수 있도록 준비 중입니다.", status: "skeleton" },
        { title: "결제 내역", body: "영수증·결제 상태 목록은 순차적으로 연결됩니다.", status: "skeleton" },
        { title: "환불 요청", body: "환불 신청과 처리 상태를 한곳에서 볼 수 있게 정비할 예정입니다.", status: "skeleton" },
        { title: "변경 기록", body: "중요한 계정·결제 변경은 안전하게 남기도록 연결할 예정입니다.", status: "skeleton" },
      ]}
      emptyState="아직 구독이 없다면 멘토를 선택한 뒤 플랜을 시작해 보세요."
      dataPoints={["현재 플랜·갱신 안내", "결제·영수증", "환불 신청", "계정 변경 기록"]}
    />
  );
}
