import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";

export default function SubscribeCancelledPage() {
  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="구독·결제"
      title="결제를 취소했습니다"
      description="진행 중이던 결제 창을 닫았거나 사용자가 취소한 경우 이 화면으로 돌아올 수 있어요."
      ctas={[
        { href: "/subscribe", label: "요금제로 돌아가기", tone: "blue" },
        { href: "/mentors", label: "멘토 찾기", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
    >
      <p className="text-sm text-slate-600">
        맞춤의뢰 주문과 혼동되지 않도록, 구독 결제는 이 메뉴에서만 진행됩니다.{" "}
        <Link href="/custom-request" className="font-bold text-blue-700 underline">
          맞춤의뢰
        </Link>
      </p>
    </PageScaffold>
  );
}
