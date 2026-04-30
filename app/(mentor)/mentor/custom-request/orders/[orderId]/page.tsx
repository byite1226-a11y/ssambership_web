import { redirect } from "next/navigation";

type Props = { params: Promise<{ orderId: string }> };

/**
 * 멘토 앱 경로 호환: 실제 주문방은 (public)의 공통 URL을 사용한다.
 */
export default async function MentorCustomRequestOrderAliasPage(props: Props) {
  const { orderId } = await props.params;
  redirect(`/custom-request/orders/${encodeURIComponent(orderId)}`);
}
