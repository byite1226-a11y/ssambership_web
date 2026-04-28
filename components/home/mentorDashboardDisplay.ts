import type { MentorDashboardData } from "@/lib/home/mentorDashboardQueries";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

/** UI 전용. 서버/쿼리 응답의 기술 문자열을 사용자용 한 줄로 정리. */
export function mentorNotifyLine(n: MentorDashboardData["notifyProbe"]): string {
  if (n.status === "skeleton") {
    return mapDataErrorMessage(n.detail);
  }
  const m = n.detail.match(/(\d+)\s*건/);
  const count = m ? Number.parseInt(m[1], 10) : 0;
  if (n.status === "empty" || count === 0) {
    return "새 알림이 없습니다.";
  }
  return `확인할 알림이 ${count}건 있을 수 있습니다. 알림 센터에서 자세히 볼 수 있어요.`;
}

export function friendlyPayoutLoadError(payoutError: string | null | undefined): string | null {
  if (payoutError == null || payoutError === "" || payoutError === "—") {
    return null;
  }
  return "정산 정보는 현재 불러올 수 없습니다. 잠시 후 [정산] 메뉴에서 다시 확인해 주세요.";
}
