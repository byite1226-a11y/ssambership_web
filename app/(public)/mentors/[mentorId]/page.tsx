import { PageScaffold } from "@/components/shell/PageScaffold";
import { PublicMentorDetailBody, PublicMentorNotFoundBody } from "@/components/mentor/PublicMentorDetailBody";
import { buildMentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { PUBLIC_MENTOR_DATA_MODEL } from "@/lib/mentor/mentorDataModel";
import { loadPublicMentorBundle } from "@/lib/mentor/publicMentorBundle";
import { createClient } from "@/lib/supabase/server";
import { USER_UI_LOAD_FAILED, USER_UI_OPS_ISSUE } from "@/lib/constants/userFacingMessages";

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
        hideFooterPlaceholderCards
        eyebrow="멤버십"
        title="멘토를 찾을 수 없어요"
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
        hideFooterPlaceholderCards
        eyebrow="멤버십"
        title="멘토 프로필이 아니에요"
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

  if (bundle.profileError) {
    console.error("[mentors/[mentorId]] profileError", bundle.profileError);
  }
  if (bundle.media.error) console.error("[mentors/[mentorId]] media", bundle.media.error);
  if (bundle.reviews.error) console.error("[mentors/[mentorId]] reviews", bundle.reviews.error);
  if (bundle.plans.error) console.error("[mentors/[mentorId]] plans", bundle.plans.error);

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="멤버십"
      title={display.displayName}
      description="멘토 소개·콘텐츠·리뷰·플랜을 한곳에서 확인하세요. 구독·결제는 기존 구독 화면 흐름을 따릅니다."
      ctas={[
        { href: "/mentors", label: "목록으로", tone: "slate" },
        { href: studentLoginForSubscribe, label: "학생 로그인(구독)", tone: "blue" },
        { href: subscribePath, label: "구독/결제", tone: "green" },
      ]}
      sections={[
        {
          title: "프로필",
          body: bundle.profileError ? USER_UI_LOAD_FAILED : "프로필 정보를 불러왔습니다.",
          status: "connected",
        },
        {
          title: "미디어",
          body: bundle.media.error ? USER_UI_LOAD_FAILED : `${bundle.media.rows.length}개 항목`,
          status: bundle.media.error ? "skeleton" : "connected",
        },
        {
          title: "리뷰",
          body: bundle.reviews.error ? USER_UI_LOAD_FAILED : `리뷰 ${bundle.reviews.count ?? 0}건`,
          status: bundle.reviews.table ? "connected" : "skeleton",
        },
        {
          title: "요금제",
          body: bundle.plans.error ? USER_UI_LOAD_FAILED : `${bundle.plans.rows.length}개 요금제`,
          status: bundle.plans.rows.length ? "connected" : "skeleton",
        },
      ]}
      emptyState="표시할 콘텐츠가 없을 수 있어요. 프로필은 아래에서 계속 확인할 수 있습니다."
      loadingState="불러오는 중입니다."
      errorState={
        bundle.profileError || bundle.media.error || bundle.reviews.error || bundle.plans.error
          ? USER_UI_OPS_ISSUE
          : "—"
      }
      dataPoints={[...PUBLIC_MENTOR_DATA_MODEL]}
    >
      <PublicMentorDetailBody mentorId={mentorId} userRow={bundle.userRow} display={display} bundle={bundle} />
    </PageScaffold>
  );
}
