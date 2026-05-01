import Link from "next/link";
import { redirect } from "next/navigation";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import type { CommunityHeroCta } from "@/components/community/CommunityPageHero";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";

export default async function CommunityNewPage() {
  const { user, profile } = await getServerUserWithProfile();
  if (profile?.role === "mentor") {
    redirect("/mentor/community/new");
  }

  const loggedIn = user != null;
  const isStudent = profile?.role === "student";
  const nextHere = encodeURIComponent("/community/new");

  const ctas: CommunityHeroCta[] = [
    { href: "/community", label: "커뮤니티 홈", tone: "slate" },
    { href: "/community/board", label: "게시판", tone: "slate" },
    { href: "/community/shortform", label: "숏폼", tone: "slate" },
    { href: "/question-room", label: "질문하기", tone: "blue" },
  ];
  if (!loggedIn) {
    ctas.push(
      { href: `/login?next=${nextHere}`, label: "로그인", tone: "blue" },
      { href: "/signup", label: "회원가입", tone: "slate" }
    );
  }

  const description = !loggedIn
    ? "새 글 작성은 멘토 회원 전용입니다. 질문·토론은 질문방과 게시판을 이용해 주세요."
    : isStudent
      ? "멘토 전용 작성 화면에서만 커뮤니티 글을 등록할 수 있어요. 질문방·게시판·숏폼에서 활동해 보세요."
      : "이 경로에서는 바로 글을 올리지 않습니다. 커뮤니티 콘텐츠는 멘토 작성으로 등록됩니다.";

  return (
    <CommunityLayoutShell
      activeNav="none"
      hero={
        <CommunityPageHero eyebrow="커뮤니티" title="새 글 작성" description={description} ctas={ctas} />
      }
    >
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm">
        <p>
          공개 커뮤니티에서 바로 글을 쓰는 기능은 제공되지 않습니다. 멘토는{" "}
          <Link href="/mentor/community/new" className="font-bold text-blue-800 underline">
            멘토 · 커뮤니티 작성
          </Link>
          메뉴를 이용해 주세요.
        </p>
        {loggedIn && isStudent ? (
          <p className="text-slate-600">
            학생 회원은 질문방에서 멘토에게 질문하거나, 게시판과 숏폼 글을 읽고 댓글로 소통할 수 있어요.
          </p>
        ) : null}
      </div>
    </CommunityLayoutShell>
  );
}
