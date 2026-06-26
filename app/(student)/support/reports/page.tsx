import { redirect } from "next/navigation";

// "내 신고 내역 조회"는 목록 API 미연결(미완성)으로 출시에서 숨김.
// 신고 제출(신고하기) 기능은 각 게시글·숏폼 화면의 신고 버튼에서 계속 사용 가능.
// 북마크·구 링크 대비 분쟁 현황으로 리다이렉트.
export default function StudentSupportReportsPage() {
  redirect("/support/disputes");
}
