import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorRecentRecorder } from "@/components/mentor/MentorRecentRecorder";
import { PublicMentorDetailBody, PublicMentorNotFoundBody } from "@/components/mentor/PublicMentorDetailBody";
import { buildMentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { loadPublicMentorBundle } from "@/lib/mentor/publicMentorBundle";
import { createClient } from "@/lib/supabase/server";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { checkReviewEligibility } from "@/lib/reviews/checkReviewEligibility";
type Props = {
  params: Promise<{ mentorId: string }>;
};

export default async function MentorDetailByIdPage(props: Props) {
  const { mentorId } = await props.params;
  const supabase = await createClient();
  const bundle = await loadPublicMentorBundle(supabase, mentorId);

  const { user, profile } = await getServerUserWithProfile();
  const viewer =
    user && profile?.role
      ? { userId: user.id, role: profile.role as "student" | "mentor" | "admin" }
      : null;

  let reviewEligibility = null;
  if (viewer?.role === "student" && viewer.userId) {
    reviewEligibility = await checkReviewEligibility(supabase, viewer.userId, mentorId);
  }

  if (bundle.kind === "not_found") {
    return (
      <PageScaffold
        hideFooterPlaceholderCards
        eyebrow="멤버십"
        title="멘토를 찾을 수 없어요"
        description={bundle.message}
        ctas={[{ href: "/mentors", label: "멘토 찾기", tone: "slate" }]}
        sections={[]}
        emptyState=""
        dataPoints={[]}
      >
        <PublicMentorNotFoundBody title="404" message={bundle.message} />
      </PageScaffold>
    );
  }

  if (bundle.kind === "not_mentor") {
    return (
      <PageScaffold
        hideFooterPlaceholderCards
        eyebrow="멤버십"
        title="멘토 프로필이 아니에요"
        description={bundle.message}
        ctas={[{ href: "/mentors", label: "멘토 찾기", tone: "slate" }]}
        sections={[]}
        emptyState=""
        dataPoints={[]}
      >
        <PublicMentorNotFoundBody title="표시 불가" message={bundle.message} />
      </PageScaffold>
    );
  }

  const display = buildMentorProfileDisplay(bundle.profileRow, bundle.userRow);

  return (
    <PageScaffold
      compactHero
      hideHero
      hideFooterPlaceholderCards
      eyebrow="멘토"
      title={display.displayName}
      description="멘토 소개·콘텐츠·리뷰·멤버십 플랜을 확인할 수 있어요."
      ctas={[]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
      loadingState=""
      errorState=""
    >
      <MentorRecentRecorder mentorId={mentorId} />
      <PublicMentorDetailBody
        mentorId={mentorId}
        userRow={bundle.userRow}
        display={display}
        bundle={bundle}
        viewer={viewer}
        reviewEligibility={reviewEligibility}
      />
    </PageScaffold>
  );
}
