import { redirect } from "next/navigation";

type Props = { params: Promise<{ orderId: string }> };

/** 멘토 작업방 — 공통 주문방 UI로 연결 */
export default async function MentorCustomRequestOrderRoomPage(props: Props) {
  const { orderId } = await props.params;
  redirect(`/custom-request/orders/${encodeURIComponent(orderId)}`);
}
