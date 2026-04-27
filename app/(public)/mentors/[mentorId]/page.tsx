import { PageScaffold } from "@/components/shell/PageScaffold";
import { PublicMentorDetailBody, PublicMentorNotFoundBody } from "@/components/mentor/PublicMentorDetailBody";
import { buildMentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { PUBLIC_MENTOR_DATA_MODEL } from "@/lib/mentor/mentorDataModel";
import { loadPublicMentorBundle } from "@/lib/mentor/publicMentorBundle";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ mentorId: string }>;
};

export default async function MentorDetailByIdPage(props: Props) {
  const { mentorId } = await props.params;
  const supabase = await createClient();
  const bundle = await loadPublicMentorBundle(supabase, mentorId);

  if (bundle.kind === "not_found") {
    return (
      <PageScaffold
        eyebrow="Public / Mentor Detail"
        title="멘토를 찾을 수 없음"
        description={bundle.message}
        ctas={[{ href: "/mentors", label: "멘토 찾기", tone: "slate" }]}
        sections={[]}
        emptyState=""
        dataPoints={[...PUBLIC_MENTOR_DATA_MODEL]}
      >
        <PublicMentorNotFoundBody title="404" message={bundle.message} />
      </PageScaffold>
    );
  }

  if (bundle.kind === "not_mentor") {
    return (
      <PageScaffold
        eyebrow="Public / Mentor Detail"
        title="멘토 프로필이 아닙니다"
        description={bundle.message}
        ctas={[{ href: "/mentors", label: "멘토 찾기", tone: "slate" }]}
        sections={[]}
        emptyState=""
        dataPoints={[...PUBLIC_MENTOR_DATA_MODEL]}
      >
        <PublicMentorNotFoundBody title="표시 불가" message={bundle.message} />
      </PageScaffold>
    );
  }

  const display = buildMentorProfileDisplay(bundle.profileRow, bundle.userRow);
  const subscribePath = `/subscribe?mentorId=${encodeURIComponent(mentorId)}`;
  const studentLoginForSubscribe = `/login/student?next=${encodeURIComponent(subscribePath)}`;

  return (
    <PageScaffold
      eyebrow="Public / Mentor Detail"
      title={display.displayName}
      description="mentor_profiles + users 필드는 편집 화면과 동일 매퍼(buildMentorProfileDisplay). 리뷰·요금제는 테이블 probe."
      ctas={[
        { href: "/mentors", label: "목록으로", tone: "slate" },
        { href: studentLoginForSubscribe, label: "학생 로그인(구독)", tone: "blue" },
        { href: subscribePath, label: "구독/결제", tone: "green" },
      ]}
      sections={[
        { title: "프로필", body: bundle.profileError ? `경고: ${bundle.profileError}` : "mentor_profiles 연결", status: "connected" },
        { title: "미디어", body: bundle.media.probe, status: bundle.media.error ? "skeleton" : "connected" },
        { title: "리뷰", body: bundle.reviews.probe, status: bundle.reviews.table ? "connected" : "skeleton" },
        { title: "요금제", body: bundle.plans.probe, status: bundle.plans.rows.length ? "connected" : "skeleton" },
      ]}
      emptyState="미디어·요금제가 비어 있어도 프로필 블록은 표시합니다."
      loadingState="route loading.tsx"
      errorState="섹션별 probe 메시지 참고"
      dataPoints={[...PUBLIC_MENTOR_DATA_MODEL]}
    >
      <PublicMentorDetailBody mentorId={mentorId} userRow={bundle.userRow} display={display} bundle={bundle} />
    </PageScaffold>
  );
}
