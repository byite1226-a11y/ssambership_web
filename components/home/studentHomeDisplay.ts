import type { MypageMetric } from "@/lib/mypage/mypageQueries";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

/** UI 전용. 마이페이지 count probe 결과를 사용자용 문장으로. */
export function studentMypageKorean(m: MypageMetric, area: "subscriptions" | "payments" | "notifications"): string {
  if (m.status === "skeleton") {
    const rest = m.detail.replace(/^[^:：]+[：:]\s*/u, "");
    return mapDataErrorMessage(rest || m.detail);
  }
  if (m.status === "empty") {
    if (area === "notifications") {
      return "새 알림이 없습니다.";
    }
    if (area === "subscriptions") {
      return "아직 구독 중인 멘토가 없습니다.";
    }
    return "최근 결제·주문이 없습니다.";
  }
  const n = m.valueText;
  if (area === "notifications") {
    return `읽을 알림이 ${n}건 있을 수 있습니다(참고).`;
  }
  if (area === "subscriptions") {
    return `구독·멤버십 관련 기록이 ${n}건 보입니다(참고).`;
  }
  return `결제·주문 관련 기록이 ${n}건 보입니다(참고).`;
}
