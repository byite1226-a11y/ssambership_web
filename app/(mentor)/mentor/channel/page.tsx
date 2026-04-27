import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorChannelPageBody } from "@/components/mentor/MentorChannelPageBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { MENTOR_CHANNEL_DATA_MODEL, MENTOR_PROFILE_DATA_MODEL } from "@/lib/mentor/mentorDataModel";
import { loadMentorChannelMedia } from "@/lib/mentor/mentorChannelQueries";
import { createClient } from "@/lib/supabase/server";

export default async function MentorChannelPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const { items, error, probe } = await loadMentorChannelMedia(supabase, user.id);

  return (
    <PageScaffold
      eyebrow="Mentor / Channel"
      title="멘토 채널 · 대표 콘텐츠"
      description="mentor_media 계열에서 내 콘텐츠를 읽고, 숏폼/해설/자료 구간에 나눕니다. 타입 컬럼이 없으면 기타 구간에 쌓입니다. 업로드는 후속."
      ctas={[
        { href: "/mentor/profile/edit", label: "프로필·연결 편집", tone: "slate" },
        { href: "/mentor/dashboard", label: "대시보드", tone: "green" },
      ]}
      sections={[
        {
          title: "데이터 연결",
          body: error ? `목록 오류: ${error}` : `${items.length}건 로드 · ${probe}`,
          status: error ? "skeleton" : "connected",
        },
        {
          title: "업로드/추가",
          body: "Storage·shortform_posts·에디터 — 본문 CTA 자리만.",
          status: "skeleton",
        },
        {
          title: "공개 상태",
          body: "각 행 is_public / visibility — 채널 목록 배지로 표시.",
          status: "connected",
        },
        {
          title: "성과",
          body: "조회·좋아요 — 이번 단계 범위 밖.",
          status: "skeleton",
        },
      ]}
      emptyState="미디어 행이 없을 때 안내 + Supabase 연결 포인트를 표시합니다."
      loadingState="route loading.tsx에서 스켈레톤."
      errorState="목록 쿼리 실패 시 본문에 오류 박스."
      dataPoints={[...MENTOR_PROFILE_DATA_MODEL, ...MENTOR_CHANNEL_DATA_MODEL]}
    >
      <MentorChannelPageBody items={items} listError={error} probe={probe} />
    </PageScaffold>
  );
}
