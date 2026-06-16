import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorProfileEditForm } from "@/components/mentor/MentorProfileEditForm";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { MENTOR_PROFILE_DATA_MODEL } from "@/lib/mentor/mentorDataModel";
import { buildMentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { fetchMentorMediaSample, fetchMentorProfileRow } from "@/lib/mentor/mentorProfileQueries";
import { fetchMentorIndividualQuestionPrice } from "@/lib/individualQuestion/individualQuestionPricing";
import { fetchPlansForMentor } from "@/lib/mentor/publicMentorBundle";
import { assignPlansByTier } from "@/lib/subscribe/subscribePageQueries";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import { USER_UI_LOAD_FAILED, USER_UI_OPS_ISSUE } from "@/lib/constants/userFacingMessages";

type PageProps = { searchParams?: Promise<{ error?: string; ok?: string }> };

export default async function MentorProfileEditPage(props: PageProps) {
  const { user } = await requireRole("mentor");
  const sp = (await props.searchParams) ?? {};
  const err = typeof sp.error === "string" && sp.error.length ? sp.error : null;
  const ok = sp.ok === "1";

  const supabase = await createClient();
  const { row, error: re } = await fetchMentorProfileRow(supabase, user.id);
  const { data: userRow } = await getUserProfileById(supabase, user.id);
  const media = await fetchMentorMediaSample(supabase, user.id, 8);
  const plans = await fetchPlansForMentor(supabase, user.id);
  const { byTier } = assignPlansByTier(plans.rows);
  const iqPrice = await fetchMentorIndividualQuestionPrice(supabase, user.id);

  const display = buildMentorProfileDisplay(row, userRow ?? null);
  const initial = {
    intro: display.intro,
    university: display.university,
    department: display.department,
    subjects: display.subjects,
    highSchool: display.highSchool,
    tags: display.tags,
    subOpen: display.subOpen,
    photoUrl: display.photoUrl,
    verification: display.verification,
    displayName: display.displayName,
    grade: display.grade,
    individualQuestionPriceCash: iqPrice.amountCents,
  };

  const hasRow = Boolean(row);
  if (re) {
    console.error("[mentor/profile/edit] profile row fetch", re);
  }
  return (
    <PageScaffold
      hideHero
      hideFooterPlaceholderCards
      sections={[]}
    >
      <MentorProfileEditForm
        initial={initial}
        query={{ row, err: re, media: { rows: media.rows, table: media.table, error: null }, byTier }}
        accountEmail={userRow?.email ?? user.email ?? null}
        ok={ok}
        errorMessage={err ? mapDataErrorMessage(err) : null}
      />
    </PageScaffold>
  );
}
