import Link from "next/link";
import {
  formatCommunityPostDate,
  pickAuthorRoleSummary,
  pickExcerpt,
  pickMediaThumbnailUrl,
  pickTitle,
} from "@/lib/community/communityQueries";

type Row = Record<string, unknown>;

function PlayGlyph() {
  return (
    <svg className="h-11 w-11 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function CommunityShortformVideoCard(props: { row: Row; href: string; linkLabel?: string }) {
  const title = pickTitle(props.row);
  const excerpt = pickExcerpt(props.row);
  const thumb = pickMediaThumbnailUrl(props.row);
  const dateStr = formatCommunityPostDate(props.row);
  const role = pickAuthorRoleSummary(props.row);
  const linkLabel = props.linkLabel ?? "영상 보기";

  return (
    <li className="h-full min-w-0 list-none">
      <Link
        href={props.href}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
      >
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden bg-slate-200">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element -- 외부 썸네일 URL 동적 표시
            <img src={thumb} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 text-center">
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">숏폼 영상</p>
              <p className="mt-1 px-4 text-xs font-semibold text-slate-600">영상 준비 중</p>
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 opacity-90 transition group-hover:bg-black/35"
            aria-hidden
          >
            <span className="rounded-full bg-black/45 p-2 ring-2 ring-white/30">
              <PlayGlyph />
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h2 className="line-clamp-2 text-sm font-extrabold leading-snug text-slate-900">{title}</h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            {role ? <span className="font-bold text-slate-600">{role}</span> : null}
            {role && dateStr ? <span aria-hidden>·</span> : null}
            {dateStr ? <time>{dateStr}</time> : null}
          </div>
          {excerpt ? (
            <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-slate-600">{excerpt}</p>
          ) : (
            <p className="line-clamp-2 flex-1 text-xs text-slate-500">멘토가 올린 짧은 영상 클립입니다.</p>
          )}
          <span className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-2 text-center text-xs font-bold text-white shadow-sm group-hover:bg-blue-700">
            {linkLabel}
          </span>
        </div>
      </Link>
    </li>
  );
}
