import Link from "next/link";
import { redirect } from "next/navigation";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";

export default async function CommunityNewPage() {
  const { user, profile } = await getServerUserWithProfile();
  if (profile?.role === "mentor") {
    redirect("/mentor/community/new");
  }

  const loggedIn = user != null;
  const nextHere = encodeURIComponent("/community/new");

  const ctas: { href: string; label: string; tone?: "blue" | "green" | "slate" }[] = [
    { href: "/community", label: "커뮤니티 홈", tone: "slate" },
    { href: "/community/board", label: "게시판", tone: "slate" },
  ];
  if (!loggedIn) {
    ctas.push({ href: `/login?next=${nextHere}`, label: "로그인", tone: "blue" }, { href: "/signup", label: "회원가입", tone: "slate" });
  }

  return (
    <CommunityLayoutShell
      activeNav="none"
      hero={
        <CommunityPageHero
          eyebrow="커뮤니티"
          title="새 글 작성"
          description={
            loggedIn
              ? "멘토 회원은 멘토 전용 작성 화면에서 글을 등록할 수 있어요. 이 경로에서는 학생·일반 회원이 바로 글을 올리지는 않습니다."
              : "로그인 후 이용 안내를 확인할 수 있어요. 멘토 회원은 멘토 전용 작성 메뉴를 이용해 주세요."
          }
          ctas={ctas}
        />
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm">
        <p>
          공개 커뮤니티에서 바로 글을 쓰는 기능은 제공되지 않습니다. 멘토는{" "}
          <Link href="/mentor/community/new" className="font-bold text-blue-800 underline">
            멘토 · 커뮤니티 작성
          </Link>
          메뉴를 이용해 주세요.
        </p>
      </div>
    </CommunityLayoutShell>
  );
}
