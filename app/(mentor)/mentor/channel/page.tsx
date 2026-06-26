import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";

// 멘토 채널(공개 미디어 모아보기)은 미완성(준비 중)으로 출시에서 숨김.
// 북마크·구 링크 대비 멘토 마이페이지로 리다이렉트. 채널 기능 완성 시 복구.
export default async function MentorChannelPage() {
  await requireRole("mentor");
  redirect("/mentor/mypage");
}
