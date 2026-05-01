import { moderateAdminReviewAction } from "@/lib/admin/adminReviewActions";
import type { AdminListResult, AdminReviewsPageMeta } from "@/lib/admin/adminQueries";
import { adminListFetchFailedCopy } from "@/lib/admin/adminDisplayError";
import {
  adminReviewExposureLabel,
  adminReviewRowIsBlinded,
  adminReviewRowIsHidden,
  adminReviewRowIsReviewed,
} from "@/lib/admin/reviewLabels";

type Row = Record<string, unknown>;

const ID_PREVIEW_LEN = 10;

function previewId(raw: unknown, maxLen = ID_PREVIEW_LEN): { display: string; title: string | undefined } {
  const s = raw == null ? "" : String(raw).trim();
  if (!s) return { display: "—", title: undefined };
  if (s.length <= maxLen) return { display: s, title: s };
  return { display: `${s.slice(0, maxLen)}…`, title: s };
}

function formatTs(v: unknown): string {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function pickRating(row: Row, meta: AdminReviewsPageMeta): string {
  const k = meta.ratingColumn;
  if (!k) return "—";
  const v = row[k];
  if (v === null || v === undefined || String(v).trim() === "") return "—";
  return String(v);
}

function pickBody(row: Row, meta: AdminReviewsPageMeta): { display: string; title: string | undefined } {
  const k = meta.bodyColumn;
  if (!k) return { display: "—", title: undefined };
  const raw = row[k];
  if (raw == null || String(raw).trim() === "") return { display: "—", title: undefined };
  const line = String(raw).trim();
  if (line.length <= 100) return { display: line, title: line };
  return { display: `${line.slice(0, 97)}…`, title: line };
}

function userLabel(map: Map<string, { nickname: string | null; full_name: string | null }>, id: string | null): string {
  if (!id) return "—";
  const u = map.get(id);
  const who = u?.full_name?.trim() || u?.nickname?.trim() || id;
  return who;
}

/** 사용자 열: 닉네임·이름이 있으면 축약 표시, 없으면 UUID 10자 규칙. title에 전체 식별자 */
function authorOrTargetCell(
  map: Map<string, { nickname: string | null; full_name: string | null }>,
  id: string
): { display: string; title: string | undefined } {
  if (!id) return { display: "—", title: undefined };
  const label = userLabel(map, id);
  if (label !== id) {
    const short = label.length > 14 ? `${label.slice(0, 11)}…` : label;
    return { display: short, title: `${label} · ${id}` };
  }
  return previewId(id);
}

export function AdminReviewsTable(props: {
  list: AdminListResult;
  meta: AdminReviewsPageMeta;
  userById: Map<string, { nickname: string | null; full_name: string | null }>;
}) {
  const { list, meta, userById } = props;

  if (list.error && !list.rows.length) {
    const { title, description } = adminListFetchFailedCopy("reviews");
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-950">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs text-amber-900/90">{description}</p>
      </div>
    );
  }

  if (!list.rows.length) {
    return <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">표시할 리뷰가 없습니다.</p>;
  }

  const { plan } = meta;
  const hasAnyAction = Boolean(plan.hide || plan.blind || plan.reviewDone);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="px-3 py-2 font-extrabold text-slate-800">리뷰 ID</th>
            <th className="px-3 py-2 font-extrabold text-slate-800">작성자</th>
            <th className="px-3 py-2 font-extrabold text-slate-800">대상 멘토</th>
            <th className="px-3 py-2 font-extrabold text-slate-800">평점</th>
            <th className="px-3 py-2 font-extrabold text-slate-800">내용</th>
            <th
              className="px-3 py-2 font-extrabold text-slate-800"
              title="표시 우선순위: 블라인드 > 숨김 > 검토 완료 > 공개. 숨김·블라인드는 공개 화면에서 비노출은 같고 운영 의미가 다릅니다."
            >
              노출·상태
            </th>
            <th className="px-3 py-2 font-extrabold text-slate-800">작성일</th>
            <th className="min-w-[260px] px-3 py-2 font-extrabold text-slate-800">처리</th>
          </tr>
        </thead>
        <tbody>
          {(list.rows as Row[]).map((row, i) => {
            const idPrev = previewId(row.id);
            const authorId =
              meta.authorColumn && row[meta.authorColumn] != null ? String(row[meta.authorColumn]).trim() : "";
            const mentorId =
              meta.mentorColumn && row[meta.mentorColumn] != null ? String(row[meta.mentorColumn]).trim() : "";
            const authorCell = authorId ? authorOrTargetCell(userById, authorId) : { display: "—" as const, title: undefined };
            const mentorCell = mentorId ? authorOrTargetCell(userById, mentorId) : { display: "—" as const, title: undefined };
            const exposure = adminReviewExposureLabel(row, plan);
            const hidden = adminReviewRowIsHidden(row, plan);
            const blind = adminReviewRowIsBlinded(row, plan);
            const reviewed = adminReviewRowIsReviewed(row, plan);
            const rating = pickRating(row, meta);
            const body = pickBody(row, meta);

            const showHide = Boolean(plan.hide && !hidden && !blind);
            const showBlind = Boolean(plan.blind && !blind);
            const showRestore = Boolean((plan.hide && hidden) || (plan.blind && blind));
            const showReview = Boolean(plan.reviewDone && !reviewed);

            return (
              <tr key={idPrev.title ?? String(i)} className="border-b border-slate-100 last:border-0">
                <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs text-slate-800" title={idPrev.title}>
                  {idPrev.display}
                </td>
                <td className="max-w-[120px] truncate px-3 py-2 text-slate-800" title={authorCell.title}>
                  {authorCell.display}
                </td>
                <td className="max-w-[120px] truncate px-3 py-2 text-slate-800" title={mentorCell.title}>
                  {mentorCell.display}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-800">{rating}</td>
                <td className="max-w-[220px] truncate px-3 py-2 text-slate-700" title={body.title}>
                  {body.display}
                </td>
                <td
                  className="whitespace-nowrap px-3 py-2 text-slate-800"
                  title="숨김·블라인드는 공개 화면에서 비노출은 같고, 집계·기록 의미가 다릅니다."
                >
                  {exposure}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">{formatTs(row.created_at)}</td>
                <td className="px-3 py-2 align-top">
                  {!hasAnyAction ? (
                    <span className="text-xs text-slate-500">—</span>
                  ) : showHide || showBlind || showRestore || showReview ? (
                    <form className="flex flex-wrap gap-2" action={moderateAdminReviewAction}>
                      <input type="hidden" name="reviewId" value={String(row.id ?? "")} />
                      {showHide ? (
                        <button
                          type="submit"
                          name="action"
                          value="hide"
                          title="리뷰를 공개 화면과 공개 집계에서 제외합니다. 스팸, 테스트, 중복, 무관한 리뷰 등 노출하지 않을 리뷰에 사용합니다."
                          aria-label="숨김. 리뷰를 공개 화면과 공개 집계에서 제외합니다. 스팸, 테스트, 중복, 무관한 리뷰 등 노출하지 않을 리뷰에 사용합니다."
                          className="rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                        >
                          숨김
                        </button>
                      ) : null}
                      {showBlind ? (
                        <button
                          type="submit"
                          name="action"
                          value="blind"
                          title="민감하거나 위반 가능성이 있는 리뷰를 공개 화면에서 제외하고 블라인드 상태로 기록합니다. 개인정보, 욕설, 외부 연락처, 정책 위반 가능 리뷰. 현재 버전에서는 블라인드도 공개 화면에서 비노출됩니다."
                          aria-label="블라인드. 민감하거나 위반 가능성이 있는 리뷰를 공개 화면에서 제외하고 블라인드 상태로 기록합니다. 개인정보, 욕설, 외부 연락처, 정책 위반 가능 리뷰. 현재 버전에서는 블라인드도 공개 화면에서 비노출됩니다."
                          className="rounded-lg bg-amber-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-amber-800"
                        >
                          블라인드
                        </button>
                      ) : null}
                      {showRestore ? (
                        <button
                          type="submit"
                          name="action"
                          value="restore"
                          title="숨김·블라인드를 해제하고 공개·집계에 다시 포함할 수 있는 상태로 되돌립니다."
                          aria-label="복원: 숨김·블라인드를 해제하고 공개·집계에 다시 포함할 수 있는 상태로 되돌립니다."
                          className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          복원
                        </button>
                      ) : null}
                      {showReview ? (
                        <button
                          type="submit"
                          name="action"
                          value="review"
                          title="현재 노출 상태를 유지한 채 검토 완료로 표시합니다."
                          aria-label="검토 완료. 현재 노출 상태를 유지한 채 검토 완료로 표시합니다."
                          className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                        >
                          검토 완료
                        </button>
                      ) : null}
                    </form>
                  ) : (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
