import Link from "next/link";
import { StateBanner } from "@/components/community/StateBanner";
import { AuthorRoleBadge } from "@/components/community/AuthorRoleBadge";
import { pickTitle } from "@/lib/community/communityQueries";

function bodyText(row: Record<string, unknown> | null): string {
  if (!row) return "";
  for (const k of ["body", "content", "text", "description"] as const) {
    if (typeof row[k] === "string") return row[k] as string;
  }
  return "";
}

function authorLabel(row: Record<string, unknown>): string {
  for (const k of ["author_name", "nickname", "display_name", "full_name", "name", "username", "writer_name"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const role = (typeof row.author_role === "string" && row.author_role) || (typeof row.role === "string" && row.role) || "";
  const low = String(role).toLowerCase();
  if (low === "mentor" || role === "멘토") return "쌤버십 멘토";
  return "작성자";
}

export function CommunityPostDetail(props: {
  variant: "shortform" | "board";
  title: string;
  row: Record<string, unknown> | null;
  error: string | null;
  backHref: string;
  listLabel: string;
}) {
  const t = props.row ? pickTitle(props.row) : props.title;
  const body = bodyText(props.row);
  const author = props.row ? authorLabel(props.row) : "작성자";

  return (
    <div className="space-y-6">
      <Link href={props.backHref} className="text-sm font-bold text-slate-600">
        ← {props.listLabel}
      </Link>

      {props.error ? <StateBanner kind="error" message={props.error} /> : null}
      {!props.error && !props.row ? <StateBanner kind="empty" message="글이 없거나 접근할 수 없습니다." /> : null}

      {props.row ? (
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-black text-slate-900">{t}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{author}</span>
            <AuthorRoleBadge row={props.row} />
          </div>
          {body ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-800">{body}</p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">등록된 본문이 없습니다.</p>
          )}

          {props.variant === "shortform" ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p>영상 콘텐츠가 준비 중입니다.</p>
            </div>
          ) : null}
        </article>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">댓글</h2>
        <p className="mt-2 text-sm text-slate-600">댓글 기능은 준비 중입니다. 곧 이곳에서 소통하실 수 있어요.</p>
      </section>

      {props.variant === "shortform" ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled className="cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
            좋아요 (준비 중)
          </button>
          <button type="button" disabled className="cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
            댓글 (준비 중)
          </button>
        </div>
      ) : null}

      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800"
        >
          신고하기 (준비 중)
        </button>
      </div>
    </div>
  );
}
