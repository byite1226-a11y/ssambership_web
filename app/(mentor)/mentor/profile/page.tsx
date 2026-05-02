import { PageScaffold } from "@/components/shell/PageScaffold";

export default function MentorProfilePage() {
  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="멘토"
      title="멘토 프로필"
      description="소개, 전공, 검증 상태를 정리하고 학생에게 보이는 정보를 관리합니다."
      ctas={[
        { href: "/mentor/profile/edit", label: "프로필 편집", tone: "blue" },
        { href: "/mentors", label: "공개 프로필 보기", tone: "slate" },
        { href: "/mentor/dashboard", label: "멘토 홈", tone: "green" },
      ]}
      sections={[]}
    />
  );
}
