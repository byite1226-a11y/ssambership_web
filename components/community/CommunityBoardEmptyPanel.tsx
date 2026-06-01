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
      {isMentor ? (
        <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-slate-600">
          첫 게시글은 게시판 상단의 <span className="font-semibold text-slate-800">게시글 작성</span> 버튼 또는 멘토 메뉴의 커뮤니티 작성에서
          이어가면 돼요.
        </p>
      ) : null}
    </div>
  );
}
