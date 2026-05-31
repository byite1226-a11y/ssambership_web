import { redirect } from "next/navigation";

/** (구) 학생 대시보드 폐기 — 마이페이지로 일원화. 기존 링크·북마크는 여기서 흡수해 redirect. */
export default function StudentHomeRedirectPage() {
  redirect("/mypage");
}
