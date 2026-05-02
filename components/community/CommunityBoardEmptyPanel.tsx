import Link from "next/link";
import type { AppRole } from "@/lib/types/user";

export function CommunityBoardEmptyPanel(props: { role: AppRole | null | undefined; loggedIn: boolean }) {
  const isMentor = props.role === "mentor";
  const title = "아직 등록된 게시글이 없습니다.";
  const desc = isMentor
    ? "첫 게시글을 작성해 공부법·학습 팁을 공유해 보세요."
    : "멘토가 공유하는 공부법·해설·학습 팁 글이 올라오면 이곳에서 읽을 수 있어요.";

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50/20 p-8 text-center">
      <p className="text-base font-extrabold text-slate-900">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{desc}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {isMentor ? (
          <Link
            href="/mentor/community/new"
            className="inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            게시글 작성
          </Link>
        ) : null}
        <Link
          href="/community"
          className="inline-flex rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-sm hover:border-slate-300"
        >
          커뮤니티 홈
        </Link>
      </div>
      {!props.loggedIn ? (
        <p className="mt-4 text-xs text-slate-500">
          <Link href={`/login?next=${encodeURIComponent("/community/board")}`} className="font-bold text-blue-800 underline">
            로그인
          </Link>
          후 댓글·스크랩을 이용할 수 있어요.
        </p>
      ) : null}
    </div>
  );
}
