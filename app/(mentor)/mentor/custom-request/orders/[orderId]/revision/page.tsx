import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

/**
 * 동선 통합(300): 수정 요청 단계는 별도 페이지 대신 주문방(OrderRoom)에서 단계별로 확인한다.
 * 라우트는 깨진 고리 방지를 위해 남겨두고 주문방으로 redirect만 한다.
 */
export const dynamic = "force-dynamic";

export default async function MentorOrderRevisionPage(props: PageProps) {
  const { orderId } = await props.params;
  redirect(`/custom-request/orders/${encodeURIComponent(orderId)}`);
}
