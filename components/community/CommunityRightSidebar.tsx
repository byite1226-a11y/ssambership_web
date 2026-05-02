import Link from "next/link";
import type { CommunityRightAsidePromo } from "@/components/community/CommunityNavTypes";

const TOPICS = ["학습 루틴 나누기", "포트폴리오 피드백", "면접 질문 모음", "자격증 후기", "이직 준비 팁"];

export function CommunityRightSidebar(props: { promo: CommunityRightAsidePromo }) {
  const ctaHref = props.promo === "shortform" ? "/community/shortform" : "/community/board";
  const ctaLabel = props.promo === "shortform" ? "숏폼 보기" : "게시판 보기";

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">빠른 이동</h3>
        <ul className="mt-3 space-y-2 text-sm font-semibold text-blue-800">
          <li>
            <Link href="/community" className="hover:underline">
              커뮤니티 홈
            </Link>
          </li>
          <li>
            <Link href="/community/board" className="hover:underline">
              게시판 보기
            </Link>
          </li>
          <li>
            <Link href="/community/shortform" className="hover:underline">
              숏폼 보기
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">실시간 인기 주제</h3>
        <ol className="mt-3 space-y-2 text-sm text-slate-700">
          {TOPICS.map((t, i) => (
            <li key={t} className="flex gap-2">
              <span className="font-black text-blue-600">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">주간 인기 멘토</h3>
        <p className="mt-2 text-xs font-semibold text-slate-700">인기 멘토 데이터 준비 중</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">활동이 쌓이면 주간 인기 멘토가 표시됩니다.</p>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">우수 활동자 도전</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">이번 주 활동으로 배지와 노출 기회를 노려 보세요.</p>
        <Link
          href={ctaHref}
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-2 text-center text-xs font-bold text-white shadow-sm hover:bg-blue-700"
        >
          {ctaLabel}
        </Link>
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-600">
          <Link href="/community" className="hover:text-blue-800 hover:underline">
            커뮤니티 홈
          </Link>
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <Link href="/community/board" className="hover:text-blue-800 hover:underline">
            게시판
          </Link>
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <Link href="/community/shortform" className="hover:text-blue-800 hover:underline">
            숏폼
          </Link>
        </div>
      </section>
    </div>
  );
}
