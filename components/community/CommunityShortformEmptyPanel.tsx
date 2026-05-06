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
        <p className={`mx-auto max-w-md text-xs leading-relaxed text-slate-600 ${props.compact ? "mt-4" : "mt-5"}`}>
          {props.compact ? (
            <>
              첫 숏폼 영상은 화면 상단의 작성 버튼으로 들어가 숏폼 항목을 고르거나, 멘토 메뉴의 커뮤니티 작성에서 이어가면 돼요.
            </>
          ) : (
            <>
              업로드는 숏폼 목록 상단의 <span className="font-semibold text-slate-800">업로드</span> 버튼 또는 멘토 메뉴의 커뮤니티 작성에서
              숏폼 항목을 선택해 진행하면 돼요.
            </>
          )}
        </p>
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
