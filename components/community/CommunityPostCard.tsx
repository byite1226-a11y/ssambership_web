import Link from "next/link";
import type { CommunityBoardPostCard } from "@/lib/community/communityBoardQueries";
import { AuthorRoleBadge } from "@/components/community/AuthorRoleBadge";

const PRIMARY = "#1A56DB";

export function CommunityPostCard(props: { post: CommunityBoardPostCard }) {
  const p = props.post;
  const thumb = p.imageUrls[0] ?? null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:p-5">
      <div className="flex gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
          style={{ backgroundColor: PRIMARY }}
          aria-hidden
        >
          {p.authorLabel.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{p.authorLabel}</span>
            {p.authorRole ? <AuthorRoleBadge row={{ author_role: p.authorRole }} /> : null}
            <span className="text-xs text-slate-400">{p.createdAtLabel}</span>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
              {p.categoryLabel}
            </span>
          </div>
          <Link href={`/community/board/${p.id}`} className="mt-2 block group">
            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#1A56DB]">{p.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{p.excerpt}</p>
          </Link>
          {thumb ? (
            <Link href={`/community/board/${p.id}`} className="mt-3 block overflow-hidden rounded-xl border border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="" className="h-40 w-full object-cover sm:h-48" />
            </Link>
          ) : null}
          {p.hashtags.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.hashtags.map((tag) => (
                <span key={tag} className="text-xs font-semibold text-[#1A56DB]">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
            <span>{"\uC88B\uC544\uC694"} {p.likeCount}</span>
            <span>{"\uB313\uAE00"} {p.commentCount}</span>
            <span>{"\uC870\uD68C"} {p.viewCount}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
