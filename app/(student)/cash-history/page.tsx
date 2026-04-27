import { redirect } from "next/navigation";

/**
 * W20/21: 사용 내역은 `/wallet/ledger` 로 정리(기존 경로는 redirect)
 */
export default function StudentCashHistoryPage() {
  redirect("/wallet/ledger");
}
