import Link from "next/link";
import { StateBanner } from "@/components/community/StateBanner";
import { AuthorRoleBadge } from "@/components/community/AuthorRoleBadge";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  formatCommunityPostDate,
  pickExcerpt,
  pickMediaThumbnailUrl,
  pickTitle,
  type CommunityCommentListItem,
} from "@/lib/community/communityQueries";
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

function PlayGlyph() {
  return (
    <svg className="h-16 w-16 text-white drop-shadow-md sm:h-[4.5rem] sm:w-[4.5rem]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function pickShortformExtraTags(row: Record<string, unknown>): string | null {
  for (const k of ["tags", "hashtags", "keywords", "topic"] as const) {
    const v = row[k];
    if (Array.isArray(v) && v.length) {
      const s = v.map(String).filter(Boolean).slice(0, 5).join(" · ");
      return s || null;
    }
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 160);
  }
  return null;
}

function ShortformMoreHint() {
  return (
    <p className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
      다른 영상은 위의 목록으로 돌아가거나, 왼쪽 메뉴의 <span className="font-bold text-slate-800">숏폼</span>에서 이어서 살펴볼 수
      있어요.
    </p>
  );
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
  const dateStr = props.row ? formatCommunityPostDate(props.row) : null;
  const thumb = props.row ? pickMediaThumbnailUrl(props.row) : null;
  const teaser = props.row ? pickExcerpt(props.row) : "";
  const postType = props.variant === "board" ? "board" : "shortform";
  const bodyOrTeaser = body || teaser;
  const tagLine = props.row && props.variant === "shortform" ? pickShortformExtraTags(props.row) : null;
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

      {props.row && props.variant === "shortform" ? (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950/[0.04] via-white to-blue-50/25 shadow-md">
          <div className="grid gap-6 p-5 sm:gap-8 sm:p-6 lg:grid-cols-[minmax(0,min(440px,46%))_minmax(0,1fr)] lg:items-start">
            <div className="flex min-w-0 flex-col">
              <div className="relative mx-auto aspect-[9/16] w-full max-w-[440px] overflow-hidden rounded-2xl border-2 border-slate-300/80 bg-gradient-to-b from-slate-300 via-slate-100 to-slate-200 shadow-inner lg:mx-0 lg:max-w-none lg:sticky lg:top-24">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 외부 썸네일 URL 동적 표시
                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-slate-600">숏폼 영상</p>
                    <p className="mt-2 text-base font-bold text-slate-800">영상 준비 중</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">세로(9:16) 클립 형태로 표시됩니다.</p>
                  </div>
                )}
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/35 via-black/10 to-transparent"
                  aria-hidden
                >
                  <span className="rounded-full bg-black/50 p-4 ring-2 ring-white/40 shadow-lg">
                    <PlayGlyph />
                  </span>
                </div>
              </div>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500 lg:text-left">
                재생은 준비 중입니다. 오른쪽에서 소개와 댓글을 확인해 주세요.
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  숏폼
                </span>
                {typeof props.row.category === "string" && props.row.category.trim() ? (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-800 ring-1 ring-blue-100">
                    {props.row.category.trim()}
                  </span>
                ) : null}
                <AuthorRoleBadge row={props.row} />
              </div>

              <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{t}</h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{author}</span>
                {dateStr ? (
                  <>
                    <span className="text-slate-300" aria-hidden>
                      ·
                    </span>
                    <time>{dateStr}</time>
                  </>
                ) : null}
              </div>

              <p className="text-xs leading-relaxed text-slate-500">
                짧은 영상으로 학습 팁·후기·포트폴리오 노하우를 빠르게 전합니다. 긴 글보다 핵심만 담았다고 생각하고
                봐 주세요.
              </p>

              {tagLine ? (
                <p className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700">
                  {tagLine}
                </p>
              ) : null}

              <section aria-labelledby="sf-intro-heading">
                <h2 id="sf-intro-heading" className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  소개
                </h2>
                {bodyOrTeaser ? (
                  <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-white/90 p-3 text-sm leading-relaxed text-slate-700 shadow-sm">
                    <p className="whitespace-pre-wrap">{bodyOrTeaser}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">등록된 소개 문구가 없습니다.</p>
                )}
              </section>

              <ShortformMoreHint />
            </div>
          </div>
        </article>
      ) : props.row ? (
        <SurfaceCard
          tone="neutral"
          header={
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {typeof props.row.category === "string" && props.row.category.trim() ? (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-800 ring-1 ring-blue-100">
                    {props.row.category.trim()}
                  </span>
                ) : null}
                <AuthorRoleBadge row={props.row} />
              </div>
              <h1 className="mt-3 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{t}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{author}</span>
                {dateStr ? (
                  <>
                    <span className="text-slate-300" aria-hidden>
                      ·
                    </span>
                    <time>{dateStr}</time>
                  </>
                ) : null}
              </div>
            </div>
          }
        >
          <section aria-labelledby="bd-body-heading">
            <h2 id="bd-body-heading" className="text-sm font-extrabold text-slate-900">
              본문
            </h2>
            {bodyOrTeaser ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800">{bodyOrTeaser}</p>
            ) : (
              <p className="mt-3 text-sm text-slate-500">등록된 본문이 없습니다.</p>
            )}
          </section>
        </SurfaceCard>
      ) : null}

      {props.row && props.variant === "board" ? (
        <SurfaceCard tone="neutral" title="관련 콘텐츠">
          <p className="text-sm leading-relaxed text-slate-600">
            관련 숏폼·게시글 추천 데이터를 준비 중입니다. 다른 글은 왼쪽 메뉴의 <span className="font-bold text-slate-800">숏폼</span>·
            <span className="font-bold text-slate-800">게시판</span>에서 이어서 둘러보세요.
          </p>
        </SurfaceCard>
      ) : null}

      {props.row ? (
        <SurfaceCard
          tone="neutral"
          header={<h2 className="text-base font-extrabold text-slate-900">댓글</h2>}
          headerAction={<span className="text-sm text-slate-500">{n}개</span>}
        >
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

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
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
        </SurfaceCard>
      ) : null}

      {props.row ? (
        <SurfaceCard tone="neutral" title="신고">
          <p className="text-sm leading-6 text-slate-600">
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
        </SurfaceCard>
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
