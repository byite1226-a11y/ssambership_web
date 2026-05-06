import type { CommunityRightAsidePromo } from "@/components/community/CommunityNavTypes";

/** 실데이터 연결 후 `true` 로 전환해 주간 랭킹 패널을 노출하세요 */
const WEEKLY_CREATOR_SIDEBAR_ENABLED = false;

function popularLines(promo: CommunityRightAsidePromo): string[] {
  if (promo === "shortform") {
    return ["짧은 영상으로 핵심만 훑어보기", "탭 전환으로 추천·최신·인기를 나눠 볼 수 있어요"];
  }
  return ["텍스트로 깊게 읽는 학습 팁", "카드 목록에서 댓글·역할 정보를 확인해 보세요"];
}

export function CommunityRightSidebar(props: { promo: CommunityRightAsidePromo }) {
  const lines = popularLines(props.promo);
  const title = props.promo === "shortform" ? "인기 숏폼 탐색" : "인기 게시글 탐색";

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          실시간 랭킹 연결 전이라, 우선 목록 화면에서 인기 순·최신 글을 둘러보는 동선을 안내해요.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {lines.map((t) => (
            <li key={t} className="leading-snug">
              {t}
            </li>
          ))}
        </ul>
      </section>

      {WEEKLY_CREATOR_SIDEBAR_ENABLED ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900">주간 인기 멘토·크리에이터</h3>
          <p className="mt-2 text-xs font-semibold text-slate-700">인기 멘토 데이터 준비 중</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">활동이 쌓이면 멘토·크리에이터 랭킹을 이 영역에 표시할 예정이에요.</p>
        </section>
      ) : null}
    </div>
  );
}
