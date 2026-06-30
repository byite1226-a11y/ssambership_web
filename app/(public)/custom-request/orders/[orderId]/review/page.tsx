import { redirect } from "next/navigation";

type Props = { params: Promise<{ orderId: string }> };

/**
 * (입구 일원화) 납품 확인·수락·수정 요청은 주문방(OrderRoomView)에서 모두 처리한다.
 * 기존 `/review` 전용 진입점은 중복이므로 주문방으로 보낸다.
 * 로그인·접근 권한 검사는 주문방 페이지가 그대로 수행한다(가드·서버 로직 불변).
 */
export default async function CustomRequestOrderReviewPage(props: Props) {
  const { orderId } = await props.params;
  redirect(`/custom-request/orders/${orderId}`);
}
