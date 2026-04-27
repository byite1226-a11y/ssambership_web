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

export function CommunityPostDetail(props: {
  variant: "shortform" | "board";
  postId: string;
  title: string;
  row: Record<string, unknown> | null;
  error: string | null;
  table: string | null;
  backHref: string;
  listLabel: string;
}) {
  const t = props.row ? pickTitle(props.row) : props.title;
  const body = bodyText(props.row);

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
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AuthorRoleBadge row={props.row} />
            {typeof props.row.author_id === "string" ? (
              <span className="text-xs text-slate-500">author_id: {props.row.author_id.slice(0, 8)}…</span>
            ) : null}
            {props.table ? <span className="text-xs text-slate-400">source: {props.table}</span> : null}
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-800">{body || "(본문 컬럼: body / content / text)"}</p>

          {props.variant === "shortform" ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-extrabold text-slate-800">동영상/썸네일 자리(업로드 아직)</p>
            </div>
          ) : null}
        </article>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">댓글 (comments — insert 미구현)</h2>
        <StateBanner kind="info" message="댓글 조회/작성은 다음 단계에서 comments 테이블과 연결합니다." />
      </section>

      {props.variant === "shortform" ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled className="cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
            좋아요 (자리)
          </button>
          <button type="button" disabled className="cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
            댓글 (자리)
          </button>
        </div>
      ) : null}

      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800"
        >
          신고하기 (reports 연결 예정) — {props.postId}
        </button>
      </div>
    </div>
  );
}
