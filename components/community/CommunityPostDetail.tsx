import Link from "next/link";
import { StateBanner } from "@/components/community/StateBanner";
import { AuthorRoleBadge } from "@/components/community/AuthorRoleBadge";
import { pickTitle, type CommunityCommentListItem } from "@/lib/community/communityQueries";
import { submitCommunityCommentAction } from "@/lib/community/commentActions";
import { submitCommunityContentReportAction } from "@/lib/community/communityReportActions";

const REPORT_REASONS = ["부적절한 내용", "스팸·광고", "욕설·비방", "개인정보 노출", "기타"] as const;

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

function mapReportError(code: string | null | undefined): string | null {
  if (!code) return null;
  if (code === "invalid") return "요청을 처리하지 못했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.";
  return "신고를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export function CommunityPostDetail(props: {
  variant: "shortform" | "board";
  postId: string;
  returnPath: string;
  title: string;
  row: Record<string, unknown> | null;
  /** 조회 실패 시에만(원문 DB 메시지 금지) */
  loadError: string | null;
  /** 잘못된 id 형식 또는 존재하지 않는 글 */
  missingPost: boolean;
  backHref: string;
  listLabel: string;
  comments: CommunityCommentListItem[];
  commentsQueryError: string | null;
  canComment: boolean;
  canReport: boolean;
  commentErrorCode: string | null;
  reportOk: boolean;
  reportErrorCode: string | null;
}) {
  const t = props.row ? pickTitle(props.row) : props.title;
  const body = bodyText(props.row);
  const author = props.row ? authorLabel(props.row) : "작성자";
  const postType = props.variant === "board" ? "board" : "shortform";
  const commentErrMsg = mapCommentError(props.commentErrorCode);
  const reportErrMsg = mapReportError(props.reportErrorCode);
  const n = props.comments.length;
  const postVariant = props.variant;
  const notFoundMsg = props.variant === "board" ? "게시글을 찾을 수 없습니다." : "숏폼을 찾을 수 없습니다.";

  return (
    <div className="space-y-6">
      <Link href={props.backHref} className="text-sm font-bold text-slate-600">
        ← {props.listLabel}
      </Link>

      {props.loadError ? <StateBanner kind="error" message={props.loadError} /> : null}
      {props.missingPost && !props.loadError ? <StateBanner kind="empty" message={notFoundMsg} /> : null}

      {props.reportOk ? <StateBanner kind="success" message="신고가 접수되었습니다." /> : null}
      {reportErrMsg ? <StateBanner kind="error" message={reportErrMsg} /> : null}

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
              <p>숏폼 영상 플레이어는 준비 중입니다. 제목·설명으로 내용을 먼저 확인해 주세요.</p>
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

      {props.row ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900">신고</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            이 글은 즉시 삭제·숨김·블라인드 처리되지 않습니다. 운영 정책에 따라{" "}
            <span className="font-semibold text-slate-800">관리자 검토 요청</span>으로 접수되며, 확인 후 필요한 조치가
            이뤄질 수 있습니다.
          </p>

          {props.canReport ? (
            <form action={submitCommunityContentReportAction} className="mt-4 space-y-4">
              <input type="hidden" name="postVariant" value={postVariant} />
              <input type="hidden" name="postId" value={props.postId} />
              <input type="hidden" name="returnPath" value={props.returnPath} />

              <div>
                <label htmlFor="community-report-reason" className="block text-xs font-bold text-slate-700">
                  사유
                </label>
                <select
                  id="community-report-reason"
                  name="reason"
                  defaultValue={REPORT_REASONS[0]}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="community-report-desc" className="block text-xs font-bold text-slate-700">
                  추가 메모 (선택, 최대 500자)
                </label>
                <textarea
                  id="community-report-desc"
                  name="description"
                  maxLength={500}
                  rows={3}
                  placeholder="관리자가 참고할 내용이 있으면 적어 주세요."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-900 hover:bg-red-100"
              >
                신고하기
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              로그인한 회원만 신고할 수 있어요.{" "}
              <Link
                className="font-bold text-blue-800 underline"
                href={`/login?next=${encodeURIComponent(props.returnPath)}`}
              >
                로그인
              </Link>
            </p>
          )}
        </section>
      ) : null}

      {props.variant === "shortform" && props.row ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled className="cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
            좋아요 (준비 중)
          </button>
        </div>
      ) : null}
    </div>
  );
}
