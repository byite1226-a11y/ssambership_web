import Link from "next/link";
import type { CommunityRightAsidePromo } from "@/components/community/CommunityNavTypes";

/** 실데이터 연결 후 `true` 로 전환해 주간 랭킹 패널을 노출하세요 */
const WEEKLY_CREATOR_SIDEBAR_ENABLED = false;

function boardLines(): string[] {
  return [
    "많이 읽힌 게시글과 댓글이 활발한 주제를 확인해 보세요.",
    "공부법, 해설, 후기, 학습 팁을 게시글로 나눠볼 수 있어요.",
  ];
}

function shortformLines(): string[] {
  return ["짧은 영상으로 핵심만 훑어보기", "탭 전환으로 추천·최신·인기를 나눠 볼 수 있어요"];
}

export function CommunityRightSidebar(props: { promo: CommunityRightAsidePromo }) {
  if (props.promo === "board") {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900">인기 주제</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {boardLines().map((t) => (
              <li key={t} className="text-xs leading-relaxed text-slate-600">
                {t}
              </li>
            ))}
          </ul>
          <Link
            href="/community/board"
            className="mt-4 inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100"
          >
            게시판 보기
          </Link>
        </section>

        {WEEKLY_CREATOR_SIDEBAR_ENABLED ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900">주간 인기 멘토·크리에이터</h3>
            <p className="mt-2 text-xs font-semibold text-slate-700">인기 멘토 데이터 준비 중</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              활동이 쌓이면 멘토·크리에이터 랭킹을 이 영역에 표시할 예정이에요.
            </p>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">인기 숏폼 탐색</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          실시간 랭킹 연결 전이라, 우선 목록 화면에서 인기 순·최신 영상을 둘러보는 동선을 안내해요.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {shortformLines().map((t) => (
            <li key={t} className="leading-snug">
              {t}
            </li>
          ))}
        </ul>
        <Link
          href="/community/shortform"
          className="mt-4 inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100"
        >
          숏폼 목록 보기
        </Link>
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
