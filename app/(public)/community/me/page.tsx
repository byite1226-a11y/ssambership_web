import Link from "next/link";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import type { CommunityHeroCta } from "@/components/community/CommunityPageHero";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";

export default async function CommunityMePage() {
  const { user } = await getServerUserWithProfile();
  const loggedIn = user != null;

  const ctas: CommunityHeroCta[] = [
    { href: "/community", label: "커뮤니티 홈", tone: "slate" },
    { href: "/community/board", label: "게시판", tone: "slate" },
  ];
  if (!loggedIn) {
    ctas.push({ href: `/login?next=${encodeURIComponent("/community/me")}`, label: "로그인", tone: "blue" });
  }

  return (
    <CommunityLayoutShell
      activeNav="me"
      hero={
        <CommunityPageHero
          eyebrow="커뮤니티"
          title="내 공간"
          description="활동 요약, 스크랩, 팔로우 등 개인화 기능은 로그인 후 이용할 수 있어요."
          ctas={ctas}
        />
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
        {loggedIn ? (
          <p>로그인되었습니다. 커뮤니티 홈·게시판·숏폼에서 콘텐츠를 둘러보실 수 있어요.</p>
        ) : (
          <p>
            <Link href={`/login?next=${encodeURIComponent("/community/me")}`} className="font-bold text-blue-800 underline">
              로그인
            </Link>
            후 이 영역에서 개인화 기능을 이용할 수 있습니다.
          </p>
        )}
      </div>
    </CommunityLayoutShell>
  );
}
