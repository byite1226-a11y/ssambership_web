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
    <aside className="w-full space-y-4 lg:w-[280px]" aria-label={"\uCEE4\uBAE0\uB2C8\uD2F0 \uC0AC\uC774\uB4DC"}>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">{"\uC778\uAE30 \uBA58\uD1A0 \uB791\uD0B9"}</h3>
        <ol className="mt-3 space-y-2">
          {mentors.length ? (
            mentors.slice(0, 5).map((m) => (
              <li key={m.id}>
                <Link href={`/mentors/${m.id}`} className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-50">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: PRIMARY }}>
                    {m.rank}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900">{m.name}</span>
                    {m.subject ? <span className="block truncate text-[10px] text-slate-500">{m.subject}</span> : null}
                  </span>
                </Link>
              </li>
            ))
          ) : (
            <li className="text-xs text-slate-500">{"\uBA58\uD1A0 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC774\uC5D0\uC694."}</li>
          )}
        </ol>
        <Link href="/mentors" className="mt-3 inline-flex text-xs font-bold text-[#1A56DB] hover:underline">
          {"\uBA58\uD1A0 \uCC3E\uAE30 \u2192"}
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">{"\uC774\uBC88 \uC8FC \uC778\uAE30 \uAC8C\uC2DC\uAE00"}</h3>
        <ul className="mt-3 space-y-2">
          {posts.slice(0, 3).map((p, i) => (
            <li key={p.id}>
              <Link href={`/community/board/${p.id}`} className="block rounded-lg p-1 hover:bg-slate-50">
                <span className="text-[10px] font-bold text-[#1A56DB]">TOP {i + 1}</span>
                <p className="line-clamp-2 text-xs font-bold text-slate-800">{p.title}</p>
                <p className="text-[10px] text-slate-500">
                  {"\uC870\uD68C"} {p.viewCount} {"\u00B7"} {"\uC88B\uC544\uC694"} {p.likeCount}
                </p>
              </Link>
            </li>
          ))}
          {!posts.length ? <li className="text-xs text-slate-500">{"\uC778\uAE30 \uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}</li> : null}
        </ul>
      </section>

      <Link
        href={props.promo === "shortform" ? "/community/shortform" : "/community/new"}
        className="block rounded-2xl p-4 text-center text-white shadow-md"
        style={{ backgroundColor: PRIMARY }}
      >
        <p className="text-sm font-extrabold">{"\uC877\uD3FC \uC5C5\uB85C\uB4DC"}</p>
        <p className="mt-1 text-xs opacity-90">{"\uC9E7\uC740 \uD559\uC2B5 \uC601\uC0C1\uC744 \uC62C\uB824 \uBCF4\uC138\uC694."}</p>
      </Link>
    </aside>
  );
}
