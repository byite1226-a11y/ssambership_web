import Link from "next/link";
import type { CommunityBoardPostCard } from "@/lib/community/communityBoardQueries";
import type { CommunityPopularMentor, CommunityRightAsidePromo } from "@/components/community/CommunityNavTypes";

const PRIMARY = "#1A56DB";

export function CommunityRightSidebar(props: {
  promo: CommunityRightAsidePromo;
  popularPosts?: CommunityBoardPostCard[];
  popularMentors?: CommunityPopularMentor[];
}) {
  const posts = props.popularPosts ?? [];
  const mentors = props.popularMentors ?? [];

  return (
    <aside className="w-full space-y-4 lg:w-[280px]" aria-label="커뮤니티 사이드">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">인기 멘토 랭킹</h3>
        <ol className="mt-3 space-y-2.5">
          {mentors.length ? (
            mentors.slice(0, 5).map((m) => (
              <li key={m.id}>
                <Link
                  href={`/mentors/${m.id}`}
                  className="flex items-start gap-2 rounded-lg px-1 py-1 hover:bg-slate-50"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {m.rank}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900">{m.name}</span>
                    {m.school ? (
                      <span className="block truncate text-[10px] text-slate-500">{m.school}</span>
                    ) : null}
                    {m.priceLabel ? (
                      <span className="block text-[10px] font-bold text-[#1A56DB]">{m.priceLabel}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))
          ) : (
            <li className="text-xs text-slate-500">멘토 데이터를 불러오는 중이에요.</li>
          )}
        </ol>
        <Link href="/mentors" className="mt-3 inline-flex text-xs font-bold text-[#1A56DB] hover:underline">
          멘토 찾기 →
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">이번 주 인기 게시글</h3>
        <ul className="mt-3 space-y-2">
          {posts.slice(0, 3).map((p) => (
            <li key={p.id}>
              <Link href={`/community/board/${p.id}`} className="block rounded-lg p-1 hover:bg-slate-50">
                <p className="line-clamp-2 text-xs font-bold text-slate-800">{p.title}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  조회 {p.viewCount.toLocaleString("ko-KR")}
                </p>
              </Link>
            </li>
          ))}
          {!posts.length ? <li className="text-xs text-slate-500">인기 글이 없어요.</li> : null}
        </ul>
      </section>

      <div
        className="rounded-2xl p-4 text-center text-white shadow-md"
        style={{ backgroundColor: PRIMARY }}
      >
        <p className="text-sm font-extrabold">짧고 유익한 영상을 올려 보세요.</p>
        <Link
          href="/community/shortform/new"
          className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-xl bg-white px-5 text-xs font-extrabold text-[#1A56DB] hover:bg-blue-50"
        >
          숏폼 업로드
        </Link>
      </div>
    </aside>
  );
}
