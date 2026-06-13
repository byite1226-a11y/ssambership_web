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
            <>첫 숏폼 영상은 화면 우측 하단의 「숏폼 올리기」 버튼으로 업로드할 수 있어요.</>
          ) : (
            <>
              업로드는 숏폼 목록 우측 하단의 <span className="font-semibold text-slate-800">숏폼 올리기</span> 버튼으로
              진행하면 돼요.
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}
