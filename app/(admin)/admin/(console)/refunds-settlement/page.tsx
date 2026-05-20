import { redirect } from "next/navigation";

/** 환불·정산 통합 경로 별칭 */
export default function RefundsSettlementRedirect() {
  redirect("/admin/refunds");
}
