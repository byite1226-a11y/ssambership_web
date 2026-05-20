import Link from "next/link";
import type { ShortformCard } from "@/lib/community/communityShortformQueries";
import { AuthorRoleBadge } from "@/components/community/AuthorRoleBadge";

function PlayGlyph() {
  return (
    <svg className="h-10 w-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function CommunityShortformVideoCard(props: { item: ShortformCard; href: string }) {
  const v = props.item;
  return (
    <li className="list-none">
      <Link
        href={props.href}
        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
      >
        <div className="relative aspect-[9/16] w-full overflow-hidden bg-slate-200">
          {v.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-slate-300 to-slate-100 text-xs font-bold text-slate-600">
              {"\uC601\uC0C1"}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="rounded-full bg-black/40 p-2">
              <PlayGlyph />
            </span>
          </div>
        </div>
        <div className="space-y-1.5 p-3">
          <h2 className="line-clamp-2 text-sm font-extrabold text-slate-900">{v.title}</h2>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-slate-700">{v.authorLabel}</span>
            {v.authorRole ? <AuthorRoleBadge row={{ author_role: v.authorRole }} /> : null}
          </div>
          <p className="text-[11px] font-semibold text-slate-500">
            {"\uC870\uD68C"} {v.viewCount.toLocaleString("ko-KR")} {"\u00B7"} {"\uC88B\uC544\uC694"} {v.likeCount.toLocaleString("ko-KR")}
          </p>
        </div>
      </Link>
    </li>
  );
}
