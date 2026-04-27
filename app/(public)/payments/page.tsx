import { redirect } from "next/navigation";

/** 결제 랜딩 흡수: 캐시 충전은 /cash 단일 진입 */
export default function PublicPaymentsAliasPage() {
  redirect("/cash");
}
