import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorProfileEditForm } from "@/components/mentor/MentorProfileEditForm";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { MENTOR_PROFILE_DATA_MODEL } from "@/lib/mentor/mentorDataModel";
import { buildMentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { fetchMentorMediaSample, fetchMentorProfileRow } from "@/lib/mentor/mentorProfileQueries";

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
  return (
    <PageScaffold
      eyebrow="Mentor / Profile / Edit"
      title="프로필·채널 편집"
      description="mentor_profiles upsert(핵심) + tags/구독토글 컬럼은 후보만(스키마 맞지 않으면 무시). 검증/학생증 URL은 읽기만(업로드 후속). 질문·커뮤·캐시·맞춤·마이페이지·어드민 미변경."
      ctas={[
        { href: "/mentor/profile", label: "프로필(요약)", tone: "slate" },
        { href: "/mentor/dashboard", label: "대시보드", tone: "green" },
        { href: "/mentor/channel", label: "채널", tone: "slate" },
      ]}
      sections={[
        { title: "데이터", body: hasRow ? "mentor_profiles: 읽기 성공" : re ? `읽기 실패: ${re}` : "빈 행(upsert로 생성)", status: re ? "skeleton" : "connected" },
        { title: "미디어", body: media.table ? `${media.table}` : "mentor_media 없음/오류", status: media.error ? "skeleton" : media.table ? "connected" : "skeleton" },
        { title: "검수", body: "verification_status / student_id_image_url 유지.", status: "skeleton" },
      ]}
      emptyState="프로필 행이 없을 때도 저장(upsert)로 생성·갱신합니다."
      loadingState="RSC에서 users·mentor_profiles를 로딩(클라이언트 SWR·스켈은 후속)."
      errorState={re && !row ? re : "저장/RLS 오류는 배너·?error= 로 표시."}
      dataPoints={[...MENTOR_PROFILE_DATA_MODEL]}
    >
      <MentorProfileEditForm
        initial={initial}
        query={{ row, err: re, media: { table: media.table, error: media.error } }}
        accountEmail={userRow?.email ?? user.email ?? null}
        ok={ok}
        errorMessage={err}
      />
    </PageScaffold>
  );
}
