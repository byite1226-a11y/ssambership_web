import { CommunityHomeContent } from "@/components/community/CommunityHomeContent";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { createClient } from "@/lib/supabase/server";
import { listBoardPosts, listShortformPosts } from "@/lib/community/communityQueries";

export default async function CommunityLandingPage() {
  const supabase = await createClient();
  const [sh, br] = await Promise.all([listShortformPosts(supabase, 12), listBoardPosts(supabase, 16)]);
  if (sh.error) console.error("[community] listShortformPosts", sh.error);
  if (br.error) console.error("[community] listBoardPosts", br.error);

  return (
    <CommunityLayoutShell
      activeNav="home"
      hero={
        <CommunityPageHero
          eyebrow="커뮤니티"
          title="함께 읽는 콘텐츠"
          description="짧은 숏폼과 게시판 글을 한곳에서 만나 보세요. 사이드 메뉴에서 원하는 영역으로 이동할 수 있어요."
          ctas={[
            { href: "/question-room", label: "질문하기", tone: "blue" },
            { href: "/community/shortform", label: "숏폼", tone: "slate" },
            { href: "/community/board", label: "게시판", tone: "slate" },
            { href: "/mentor/community/new", label: "멘토 · 글쓰기", tone: "slate" },
          ]}
        />
      }
    >
      <CommunityHomeContent
        shortRows={sh.rows}
        shortFetchFailed={Boolean(sh.error)}
        boardRows={br.rows}
        boardFetchFailed={Boolean(br.error)}
      />
    </CommunityLayoutShell>
  );
}
