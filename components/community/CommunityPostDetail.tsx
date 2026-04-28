import Link from "next/link";
import { StateBanner } from "@/components/community/StateBanner";
import { AuthorRoleBadge } from "@/components/community/AuthorRoleBadge";
import { pickTitle, type CommunityCommentListItem } from "@/lib/community/communityQueries";
import { submitCommunityCommentAction } from "@/lib/community/commentActions";

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

function formatCommentTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

function mapCommentError(code: string | null | undefined): string | null {
  if (!code) return null;
  if (code === "length") return "댓글은 1자 이상 1,000자 이하로 입력해 주세요.";
  if (code === "save") return "댓글을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.";
  if (code === "invalid") return "요청을 처리하지 못했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.";
  return "요청을 처리하지 못했어요.";
}

export function CommunityPostDetail(props: {
  variant: "shortform" | "board";
  postId: string;
  returnPath: string;
  title: string;
  row: Record<string, unknown> | null;
  error: string | null;
  backHref: string;
  listLabel: string;
  comments: CommunityCommentListItem[];
  commentsQueryError: string | null;
  canComment: boolean;
  commentErrorCode: string | null;
}) {
  const t = props.row ? pickTitle(props.row) : props.title;
  const body = bodyText(props.row);
  const author = props.row ? authorLabel(props.row) : "작성자";
  const postType = props.variant === "board" ? "board" : "shortform";
  const commentErrMsg = mapCommentError(props.commentErrorCode);
  const n = props.comments.length;

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

      {props.row ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-extrabold text-slate-900">댓글</h2>
            <span className="text-sm text-slate-500">{n}개</span>
          </div>

          {props.commentsQueryError ? (
            <p className="mt-2 text-sm text-amber-800">{props.commentsQueryError}</p>
          ) : null}
          {commentErrMsg ? <p className="mt-2 text-sm text-amber-800">{commentErrMsg}</p> : null}

          {!props.commentsQueryError && n === 0 ? (
            <p className="mt-3 text-sm text-slate-600">아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.</p>
          ) : null}

          {n > 0 ? (
            <ul className="mt-4 space-y-3">
              {props.comments.map((c) => (
                <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-slate-500">
                    <span className="font-extrabold text-slate-800">{c.authorLabel}</span>
                    <time dateTime={c.createdAt}>{formatCommentTime(c.createdAt)}</time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap leading-6">{c.body}</p>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-5 border-t border-slate-200 pt-4">
            {props.canComment ? (
              <form action={submitCommunityCommentAction} className="space-y-3">
                <input type="hidden" name="postType" value={postType} />
                <input type="hidden" name="postId" value={props.postId} />
                <input type="hidden" name="returnPath" value={props.returnPath} />
                <label className="sr-only" htmlFor="community-comment-body">
                  댓글 내용
                </label>
                <textarea
                  id="community-comment-body"
                  name="body"
                  required
                  minLength={1}
                  maxLength={1000}
                  rows={4}
                  placeholder="댓글을 입력하세요 (1~1,000자)"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  등록
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-600">
                로그인 후 댓글을 남길 수 있어요.{" "}
                <Link
                  className="font-bold text-blue-800 underline"
                  href={`/login?next=${encodeURIComponent(props.returnPath)}`}
                >
                  로그인
                </Link>
              </p>
            )}
          </div>
        </section>
      ) : null}

      {props.variant === "shortform" ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled className="cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
            좋아요 (준비 중)
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
