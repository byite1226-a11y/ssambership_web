import { redirect } from "next/navigation";

/**
 * W20/21: 정식 진입은 `/wallet/charge` (기존 URL 유지 + redirect)
 */
export default function StudentWalletIndexPage() {
  redirect("/wallet/charge");
}
