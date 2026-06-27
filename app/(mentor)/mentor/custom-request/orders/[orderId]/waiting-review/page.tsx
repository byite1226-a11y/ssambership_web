import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

/**
 * 동선 통합(300): 납품 후 학생 검토 대기 단계는 별도 페이지 대신 주문방(OrderRoom)에서
 * 검토 카운트다운까지 함께 확인한다. 라우트는 남겨두고 주문방으로 redirect만 한다.
 */
export const dynamic = "force-dynamic";

export default async function MentorOrderWaitingReviewPage(props: PageProps) {
  const { orderId } = await props.params;
  redirect(`/custom-request/orders/${encodeURIComponent(orderId)}`);
}
