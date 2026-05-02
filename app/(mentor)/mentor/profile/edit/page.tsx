import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorProfileEditForm } from "@/components/mentor/MentorProfileEditForm";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { MENTOR_PROFILE_DATA_MODEL } from "@/lib/mentor/mentorDataModel";
import { buildMentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { fetchMentorMediaSample, fetchMentorProfileRow } from "@/lib/mentor/mentorProfileQueries";
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
  };

  const hasRow = Boolean(row);
  if (re) {
    console.error("[mentor/profile/edit] profile row fetch", re);
  }
  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="Mentor / Profile / Edit"
      title="프로필·채널 편집"
      description="소개·학력·과목 등 프로필과 채널 정보를 수정할 수 있습니다."
      ctas={[
        { href: "/mentor/profile", label: "프로필(요약)", tone: "slate" },
        { href: "/mentor/dashboard", label: "대시보드", tone: "green" },
        { href: "/mentor/channel", label: "채널", tone: "slate" },
      ]}
      sections={[
        {
          title: "프로필",
          body: hasRow ? "저장된 프로필을 불러왔습니다." : re ? USER_UI_LOAD_FAILED : "새 프로필을 만들 수 있어요.",
          status: re && !hasRow ? "skeleton" : "connected",
        },
        {
          title: "미디어",
          body: media.table
            ? "대표 콘텐츠를 불러왔습니다."
            : "채널 자료는 아직 준비 중이거나, 등록된 미디어가 없습니다.",
          status: "connected",
        },
        {
          title: "검수",
          body: "학생증·검수 상태는 별도 절차에 따라 표시됩니다.",
          status: "skeleton",
        },
      ]}
      emptyState="아래 폼에서 프로필을 작성·저장할 수 있습니다."
      loadingState="불러오는 중입니다."
      errorState={re && !row ? USER_UI_OPS_ISSUE : "저장 결과는 화면 상단 안내를 확인해 주세요."}
      dataPoints={[...MENTOR_PROFILE_DATA_MODEL]}
    >
      <MentorProfileEditForm
        initial={initial}
        query={{ row, err: re, media: { table: media.table, error: null } }}
        accountEmail={userRow?.email ?? user.email ?? null}
        ok={ok}
        errorMessage={err ? mapDataErrorMessage(err) : null}
      />
    </PageScaffold>
  );
}
