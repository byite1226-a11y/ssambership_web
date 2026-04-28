import { PageScaffold } from "@/components/shell/PageScaffold";
import { CommunityMainHub } from "@/components/community/CommunityMainHub";
import { createClient } from "@/lib/supabase/server";
import { listBoardPosts, listShortformPosts } from "@/lib/community/communityQueries";

export default async function CommunityLandingPage() {
  const supabase = await createClient();
  const [sh, br] = await Promise.all([listShortformPosts(supabase, 6), listBoardPosts(supabase, 8)]);

  return (
    <PageScaffold
      eyebrow="커뮤니티"
      title="함께 읽는 콘텐츠"
      description="짧은 숏폼과 게시판 글을 나눠 보여 드려요. 관심 있는 루트로 이동해 전체 글을 살펴보세요."
      ctas={[
        { href: "/question-room", label: "질문하기", tone: "blue" },
        { href: "/community/shorts", label: "숏폼", tone: "slate" },
        { href: "/community/board", label: "게시판", tone: "slate" },
        { href: "/mentor/community/new", label: "멘토 · 글쓰기", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
    >
      <CommunityMainHub
        activeTab="home"
        shortRows={sh.rows}
        shortError={sh.error}
        boardRows={br.rows}
        boardError={br.error}
        writeCta={{ href: "/mentor/community/new", label: "멘토 · 글쓰기" }}
        uploadCta={{ href: "/community/shorts", label: "숏폼 피드" }}
      />
    </PageScaffold>
  );
}
