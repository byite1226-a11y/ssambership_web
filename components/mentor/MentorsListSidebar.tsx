import Link from "next/link";
import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";

export function MentorsListSidebar(props: {
  favoriteCards: MentorPublicListCard[];
}) {
  const favorites = props.favoriteCards.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-black text-slate-900">구독제 이용 안내</h2>
        <ul className="mt-3 space-y-2.5 text-xs font-medium leading-relaxed text-slate-600">
          <li className="flex gap-2">
            <span className="text-[#1A56DB]">•</span>
            정해진 질문 횟수 내에서 자유롭게 질문하고 답변을 받아보세요
          </li>
          <li className="flex gap-2">
            <span className="text-[#1A56DB]">•</span>
            요금제에 따라 주간 질문 한도가 달라집니다
          </li>
          <li className="flex gap-2">
            <span className="text-[#1A56DB]">•</span>
            모든 질문과 답변은 질문방에서 확인할 수 있어요
          </li>
        </ul>
        <Link
          href="/subscribe"
          className="mt-4 inline-flex text-xs font-extrabold text-[#1A56DB] hover:underline"
        >
          자세히 보기 &gt;
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-black text-slate-900">찜한 멘토</h2>
        {favorites.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">아직 찜한 멘토가 없어요. 카드의 하트를 눌러 저장해 보세요.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {favorites.map((c) => {
              const minPrice = c.minPriceKrw;
              const priceText =
                minPrice != null ? `${minPrice.toLocaleString("ko-KR")}캐시~` : "요금 확인";
              return (
                <li key={c.mentorId}>
                  <Link
                    href={`/mentors/${c.mentorId}`}
                    className="block rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 transition hover:border-[#1A56DB]/30"
                  >
                    <p className="text-xs font-black text-slate-900">{c.display.displayName}</p>
                    <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
                      {c.display.university || "학교 정보 준비 중"} · {priceText}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/mentors?view=list"
          className="mt-4 inline-flex text-xs font-extrabold text-[#1A56DB] hover:underline"
        >
          찜 보기 &gt;
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-md">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/80">이벤트</p>
        <h3 className="mt-1 text-base font-black leading-snug">친구 초대하고 무제한 질문 이용권 받자!</h3>
        <p className="mt-2 text-xs font-medium leading-relaxed text-violet-100">
          친구가 가입하면 양쪽 모두 보너스 질문권을 드려요. (준비 중)
        </p>
        <span className="mt-4 inline-flex rounded-lg bg-white/20 px-3 py-1.5 text-[11px] font-bold">
          곧 오픈
        </span>
      </div>
    </div>
  );
}
