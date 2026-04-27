import { PageScaffold } from "@/components/shell/PageScaffold";
import {
  CommunityCategoryFilterSkeleton,
  CommunityMainHub,
  CommunityRecommendToggleSkeleton,
} from "@/components/community/CommunityMainHub";
import { createClient } from "@/lib/supabase/server";
import { COMMUNITY_DATA_POINTS, listBoardPosts, listShortformPosts } from "@/lib/community/communityQueries";

export default async function CommunityLandingPage() {
  const supabase = await createClient();
  const [sh, br] = await Promise.all([listShortformPosts(supabase, 6), listBoardPosts(supabase, 8)]);

  return (
    <PageScaffold
      eyebrow="Public / Community"
      title="커뮤니티"
      description="숏폼(shortform_posts)과 게시판(community_posts)을 라우트·쿼리로 분리합니다. 댓글·신고·알림은 공통 모듈로 연결 예정입니다."
      ctas={[
        { href: "/community/shorts", label: "숏폼", tone: "blue" },
        { href: "/community/board", label: "게시판", tone: "blue" },
        { href: "/mentor/community/new", label: "멘토 글쓰기(작성)", tone: "slate" },
        { href: "/login", label: "로그인", tone: "slate" },
      ]}
      sections={[
        { title: "탭·필터", body: "홈/숏/게시판 + 추천·최신 + 카테고리.", status: "skeleton" },
        { title: "숏폼 대표", body: "shortform_posts 상위 3.", status: "skeleton" },
        { title: "게시판 대표", body: "community_posts 상위 5.", status: "skeleton" },
        { title: "댓글/신고", body: "comments, reports (다음 단계).", status: "skeleton" },
      ]}
      emptyState="피드가 비면 가이드와 작성 CTA로 유도합니다."
      loadingState="RSC 1회 조회(이후 탭 전환·Suspense 확장 가능)."
      errorState="shortform / board 별로 오류 배너를 구분합니다."
      dataPoints={[...COMMUNITY_DATA_POINTS]}
    >
      <CommunityMainHub
        activeTab="home"
        shortRows={sh.rows}
        shortError={sh.error}
        boardRows={br.rows}
        boardError={br.error}
        recommendSlot={<CommunityRecommendToggleSkeleton />}
        categoryFilterSlot={<CommunityCategoryFilterSkeleton />}
        writeCta={{ href: "/mentor/community/new", label: "멘토 · 글쓰기" }}
        uploadCta={{ href: "/community/shorts", label: "숏폼 피드로" }}
      />
    </PageScaffold>
  );
}
