import Link from "next/link";
import { AuthorRoleBadge } from "@/components/community/AuthorRoleBadge";
import type { ShortformCard } from "@/lib/community/communityShortformQueries";
import type { CommunityCommentListItem } from "@/lib/community/communityQueries";
import { submitCommunityCommentAction } from "@/lib/community/commentActions";

const PRIMARY = "#1A56DB";

export function CommunityShortformDetailView(props: {
  item: ShortformCard;
  postId: string;
  returnPath: string;
  comments: CommunityCommentListItem[];
  canComment: boolean;
}) {
  const v = props.item;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
      <div className="mx-auto w-full max-w-[320px]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-lg">
          {v.videoUrl ? (
            <video
              src={v.videoUrl}
              controls
              playsInline
              poster={v.thumbnailUrl ?? undefined}
              className="h-full w-full object-contain"
            />
          ) : v.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-bold text-white/80">{"\uC601\uC0C1 \uC900\uBE44 \uC911"}</div>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <header className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-black text-slate-900">{v.title}</h1>
          {v.authorRole ? <AuthorRoleBadge row={{ author_role: v.authorRole }} /> : null}
        </header>
        <p className="text-sm font-semibold text-slate-600">
          {v.authorLabel} {"\u00B7"} {v.createdAtLabel}
        </p>
        {v.description ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{v.description}</p> : null}
        {v.tags.length ? (
          <p className="flex flex-wrap gap-2 text-sm font-semibold text-[#1A56DB]">
            {v.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 text-sm font-bold text-slate-600">
          <span>{"\uC88B\uC544\uC694"} {v.likeCount}</span>
          <span>{"\uC870\uD68C"} {v.viewCount}</span>
          <button type="button" disabled className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
            {"\uACF5\uC720 (\uC900\uBE44 \uC911)"}
          </button>
        </div>

        <section className="space-y-3 border-t border-slate-100 pt-4">
          <h2 className="text-base font-extrabold text-slate-900">{"\uB313\uAE00"}</h2>
          {props.canComment ? (
            <form action={submitCommunityCommentAction} className="space-y-2">
              <input type="hidden" name="postType" value="shortform" />
              <input type="hidden" name="postId" value={props.postId} />
              <input type="hidden" name="returnPath" value={props.returnPath} />
              <textarea name="body" required maxLength={1000} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <button type="submit" className="rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: PRIMARY }}>
                {"\uB4F1\uB85D"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">
              <Link href={`/login?next=${encodeURIComponent(props.returnPath)}`} className="font-bold text-[#1A56DB]">
                {"\uB85C\uADF8\uC778"}
              </Link>
              {" \uD6C4 \uB313\uAE00\uC744 \uC791\uC131\uD560 \uC218 \uC788\uC5B4\uC694."}
            </p>
          )}
          <ul className="space-y-2">
            {props.comments.map((c) => (
              <li key={c.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm">
                <p className="text-xs font-bold text-slate-700">{c.authorLabel}</p>
                <p className="mt-1 text-slate-800">{c.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <Link href="/community/shortform" className="inline-flex text-sm font-bold text-[#1A56DB] hover:underline">
          {"\u2190 숏폼 \uBAA9\uB85D"}
        </Link>
      </div>
    </div>
  );
}
