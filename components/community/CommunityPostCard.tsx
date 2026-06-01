import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { CommunityBoardPostCard } from "@/lib/community/communityBoardQueries";
import { AuthorRoleBadge } from "@/components/community/AuthorRoleBadge";

const PRIMARY = "#1A56DB";

export function CommunityPostCard(props: { post: CommunityBoardPostCard }) {
  const p = props.post;
  const thumb = p.imageUrls[0] ?? null;
  const detailHref = `/community/board/${p.id}`;

  return (
    <article className="rounded-2xl border border-[#eef0f3] bg-white p-4 transition hover:border-slate-300 sm:p-5">
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
          <Link href={detailHref} className="mt-2 block group">
            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#1A56DB]">{p.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{p.excerpt}</p>
          </Link>
          {thumb ? (
            <Link href={detailHref} className="mt-3 block overflow-hidden rounded-xl border border-slate-100">
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
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
              <span>좋아요 {p.likeCount.toLocaleString("ko-KR")}</span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <MessageCircle className="h-3.5 w-3.5" />
                {p.commentCount.toLocaleString("ko-KR")}
              </span>
              <span>조회 {p.viewCount.toLocaleString("ko-KR")}</span>
            </div>
            <Link
              href={detailHref}
              className="inline-flex min-h-[36px] items-center rounded-lg bg-[#1A56DB] px-4 text-xs font-extrabold text-white hover:bg-[#1648c0]"
            >
              읽기
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
