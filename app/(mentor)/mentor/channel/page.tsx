import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorChannelPageBody } from "@/components/mentor/MentorChannelPageBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { MENTOR_CHANNEL_DATA_MODEL, MENTOR_PROFILE_DATA_MODEL } from "@/lib/mentor/mentorDataModel";
import { loadMentorChannelMedia } from "@/lib/mentor/mentorChannelQueries";
import { createClient } from "@/lib/supabase/server";
import {
  USER_UI_MENTOR_CHANNEL_EMPTY,
  USER_UI_MENTOR_CHANNEL_LOAD_FAILED,
} from "@/lib/constants/userFacingMessages";

export default async function MentorChannelPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const { items, error, probe } = await loadMentorChannelMedia(supabase, user.id);

  if (error) {
    console.error("[mentor/channel] list load", error, probe);
  }

  const listFailed = Boolean(error);
  const hasItems = items.length > 0;

  return (
    <PageScaffold
      eyebrow="멘토 · 채널"
      title="멘토 채널 · 대표 콘텐츠"
      description="등록한 대표 콘텐츠를 유형별로 모아 보여 줍니다. 새 자료는 프로필·연결 메뉴에서 준비할 수 있어요."
      ctas={[
        { href: "/mentor/profile/edit", label: "프로필·연결 편집", tone: "slate" },
        { href: "/mentor/dashboard", label: "대시보드", tone: "green" },
      ]}
      sections={[
        {
          title: "목록",
          body: listFailed
            ? USER_UI_MENTOR_CHANNEL_LOAD_FAILED
            : hasItems
              ? `${items.length}건의 콘텐츠를 불러왔습니다.`
              : "표시할 콘텐츠가 없습니다.",
          status: listFailed ? "skeleton" : "connected",
        },
        {
          title: "추가·편집",
          body: "자료 추가와 편집은 프로필·연결 화면과 이후 업데이트에서 안내될 예정이에요.",
          status: "skeleton",
        },
        {
          title: "공개 상태",
          body: "각 항목의 공개 설정에 따라 노출 여부가 달라질 수 있어요.",
          status: "connected",
        },
        {
          title: "성과",
          body: "조회·반응 등 지표는 추후 제공될 수 있어요.",
          status: "skeleton",
        },
      ]}
      emptyState={USER_UI_MENTOR_CHANNEL_EMPTY}
      loadingState="불러오는 중입니다."
      errorState={listFailed ? USER_UI_MENTOR_CHANNEL_LOAD_FAILED : "—"}
      dataPoints={[...MENTOR_PROFILE_DATA_MODEL, ...MENTOR_CHANNEL_DATA_MODEL]}
    >
      <MentorChannelPageBody items={items} listError={error} probe={probe} />
    </PageScaffold>
  );
}
