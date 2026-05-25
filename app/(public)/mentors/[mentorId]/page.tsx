import { MentorRecentRecorder } from "@/components/mentor/MentorRecentRecorder";
import { PublicMentorDetailBody, PublicMentorNotFoundBody } from "@/components/mentor/PublicMentorDetailBody";
import { buildMentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { loadFavoriteMentorIdsForUser } from "@/lib/mentor/mentorFavorites";
import { loadPublicMentorBundle } from "@/lib/mentor/publicMentorBundle";
import { createClient } from "@/lib/supabase/server";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { loadFreeQuestionRemainingForMentor } from "@/lib/qna/freeQuestionUsage";
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

  let initialFavorited = false;
  let freeQuestionRemaining: number | null = null;
  if (user) {
    const fav = await loadFavoriteMentorIdsForUser(supabase, user.id);
    initialFavorited = fav.ids.has(mentorId);
    if (profile?.role === "student") {
      freeQuestionRemaining = await loadFreeQuestionRemainingForMentor(supabase, user.id, mentorId);
    }
  }

  if (bundle.kind === "not_found") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <PublicMentorNotFoundBody title="404" message={bundle.message} />
      </div>
    );
  }

  if (bundle.kind === "not_mentor") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <PublicMentorNotFoundBody title="표시 불가" message={bundle.message} />
      </div>
    );
  }

  const display = buildMentorProfileDisplay(bundle.profileRow, bundle.userRow);

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-6 sm:py-8">
      <MentorRecentRecorder mentorId={mentorId} />
      <PublicMentorDetailBody
        mentorId={mentorId}
        userRow={bundle.userRow}
        display={display}
        bundle={bundle}
        viewer={viewer}
        reviewEligibility={reviewEligibility}
        isLoggedIn={Boolean(user)}
        initialFavorited={initialFavorited}
        freeQuestionRemaining={freeQuestionRemaining}
      />
    </div>
  );
}
