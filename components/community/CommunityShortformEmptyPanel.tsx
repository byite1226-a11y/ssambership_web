import Link from "next/link";
import type { AppRole } from "@/lib/types/user";

export function CommunityShortformEmptyPanel(props: {
  role: AppRole | null | undefined;
  loggedIn: boolean;
  /** 홈 섹션 등 좁은 영역 */
  compact?: boolean;
}) {
  const isMentor = props.role === "mentor";
  const title = "아직 등록된 숏폼 영상이 없습니다.";
  const desc = isMentor
    ? "첫 숏폼 영상을 업로드해 학습 팁을 공유해보세요."
    : "멘토가 올린 짧은 학습 영상이 등록되면 이곳에서 확인할 수 있어요.";

  const pad = props.compact ? "p-5" : "p-8";

  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 text-center ${pad}`}
    >
      <p className="text-base font-extrabold text-slate-900">{title}</p>
      <p className={`mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 ${props.compact ? "" : "text-[15px]"}`}>
        {desc}
      </p>
      {isMentor ? (
        <Link
          href="/mentor/community/new"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
        >
          숏폼 업로드
        </Link>
      ) : null}
      {!props.loggedIn && !isMentor ? (
        <p className="mt-4 text-xs text-slate-500">
          <Link href={`/login?next=${encodeURIComponent("/community/shortform")}`} className="font-bold text-blue-800 underline">
            로그인
          </Link>
          후 댓글·스크랩을 이용할 수 있어요.
        </p>
      ) : null}
    </div>
  );
}
