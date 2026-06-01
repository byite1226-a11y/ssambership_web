import Link from "next/link";
import type { ShortformCard } from "@/lib/community/communityShortformQueries";
import { AuthorRoleBadge } from "@/components/community/AuthorRoleBadge";

function PlayGlyph() {
  return (
    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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
        className="group flex flex-col overflow-hidden rounded-2xl border border-[#eef0f3] bg-white transition hover:border-slate-300"
      >
        <div className="relative aspect-[9/15] w-full overflow-hidden bg-slate-200">
          {v.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-slate-300 to-slate-100 text-xs font-bold text-slate-600">
              {"\uC601\uC0C1"}
            </div>
          )}
          <div className="pointer-events-none absolute right-3 top-3">
            <span className="inline-flex rounded-full bg-black/45 p-1.5">
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
            조회 {v.viewCount.toLocaleString("ko-KR")} · {v.createdAtLabel}
          </p>
        </div>
      </Link>
    </li>
  );
}
