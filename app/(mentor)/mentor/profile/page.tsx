import { PageScaffold } from "@/components/shell/PageScaffold";

export default function MentorProfilePage() {
  return (
    <PageScaffold
      eyebrow="Mentor / Profile"
      title="멘토 프로필 관리"
      description="멘토 소개/전공/검증서류 상태를 관리하고 Public 노출 정보와 연결합니다."
      ctas={[
        { href: "/mentor/profile/edit", label: "프로필 편집", tone: "blue" },
        { href: "/mentors", label: "공개 프로필 확인", tone: "slate" },
        { href: "/mentor/dashboard", label: "대시보드", tone: "green" },
      ]}
      sections={[
        { title: "기본 프로필", body: "상세: /mentor/profile/edit", status: "connected" },
        { title: "검증 상태", body: "verification_status 및 심사 코멘트.", status: "skeleton" },
        { title: "노출 설정", body: "검색 노출/응답 가능 상태 토글.", status: "skeleton" },
        { title: "구독 정책 연결", body: "가격/플랜 설정과 pricing 연계.", status: "skeleton" },
      ]}
      emptyState="검증 대기/반려 상태를 명확히 보여주고 재제출 CTA를 제공합니다."
      dataPoints={["mentor_profiles", "users", "subscriptions"]}
    />
  );
}
