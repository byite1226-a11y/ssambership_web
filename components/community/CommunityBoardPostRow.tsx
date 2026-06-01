import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { AuthorRoleBadge } from "@/components/community/AuthorRoleBadge";
import {
  formatCommunityPostDate,
  pickCommentCountDisplay,
  pickExcerpt,
  pickTitle,
} from "@/lib/community/communityQueries";

type Row = Record<string, unknown>;

export function CommunityBoardPostRow(props: { row: Row; index: number; dense?: boolean }) {
  const { row: r, index: i } = props;
  const id = typeof r.id === "string" ? r.id : null;
  const excerpt = pickExcerpt(r);
  const dateStr = formatCommunityPostDate(r);
  const comments = pickCommentCountDisplay(r);
  const pad = props.dense ? "p-4" : "p-5";

  return (
    <li
      key={id ?? `b-${i}`}
      className={`list-none rounded-2xl border border-[#eef0f3] bg-white transition hover:border-slate-300 ${pad}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {typeof r.category === "string" && r.category.trim() ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-800 ring-1 ring-blue-100">
                {r.category.trim()}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">일반</span>
            )}
            <AuthorRoleBadge row={r} />
          </div>
          <h3 className="text-base font-extrabold leading-snug text-slate-900">{pickTitle(r)}</h3>
          {excerpt ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{excerpt}</p>
          ) : (
            <p className="text-xs text-slate-500">미리보기가 없는 글입니다.</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {dateStr ? <time>{dateStr}</time> : <span>날짜 정보 없음</span>}
            <span className="inline-flex items-center gap-1 text-slate-400">
              <MessageCircle className="h-3.5 w-3.5" />
              {comments}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center lg:flex-col lg:items-end">
          {id ? (
            <Link
              href={`/community/board/${id}`}
              className="inline-flex w-full min-w-[88px] items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 lg:w-auto"
            >
              읽기
            </Link>
          ) : (
            <span className="text-xs font-medium text-slate-400">읽기 불가</span>
          )}
        </div>
      </div>
    </li>
  );
}
