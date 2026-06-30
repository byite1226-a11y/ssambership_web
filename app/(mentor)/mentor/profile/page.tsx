import { redirect } from "next/navigation";

/**
 * 멘토 프로필은 편집 화면 하나로 통일(중복 요약 대시보드 제거).
 * 기존 요약 정보(완성도·공개 상태)는 편집 화면 상단 배너로 흡수됨.
 */
export default function MentorProfilePage() {
  redirect("/mentor/profile/edit");
}
