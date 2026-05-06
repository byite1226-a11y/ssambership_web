import { redirect } from "next/navigation";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { buildCommunityHeroPrimaryAction } from "@/lib/community/communityHeroActions";

export default async function CommunityNewPage() {
  const { user, profile } = await getServerUserWithProfile();

  if (profile?.role === "mentor") {
    redirect("/mentor/community/new");
  }
  if (user) {
    redirect("/community");
  }

  const primaryAction = buildCommunityHeroPrimaryAction({
    surface: "compose_gate",
    role: null,
    loggedIn: false,
    nextPath: "/community",
  });

  return (
    <CommunityLayoutShell
      activeNav="none"
      hero={
        <CommunityPageHero
          eyebrow="커뮤니티"
          title="새 글 작성"
          description="커뮤니티 게시글·숏폼 영상 등록은 멘토 로그인 후 멘토 메뉴에서만 가능합니다. 댓글·스크랩·신고는 커뮤니티에서 로그인 후 이용해 주세요."
          primaryAction={primaryAction}
        />
      }
    >
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm">
        <p>
          공개 커뮤니티에서 바로 글을 쓰는 기능은 제공되지 않습니다. 멘토 회원은 <strong className="text-slate-900">멘토 로그인</strong> 뒤 멘토
          메뉴의 커뮤니티 작성에서 등록할 수 있어요.
        </p>
        <p className="text-slate-600">
          로그인 후에도 학생·관리자 화면에서는 작성 메뉴가 보이지 않습니다. 글·숏폼 등록은 멘토 계정으로 로그인했을 때만 가능합니다.
        </p>
      </div>
    </CommunityLayoutShell>
  );
}
