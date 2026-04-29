import Link from "next/link";
import {
  isAuthorOfPost,
  type CustomListResult,
  type PostAttachmentListItem,
} from "@/lib/customRequest/customRequestQueries";
import { isMentorApplicablePostStatus, mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { MentorPostStatusBadge } from "@/components/customRequest/MentorPostStatusBadge";
import { downloadCustomRequestPostAttachmentAction } from "@/lib/customRequest/postAttachmentDownloadActions";
import { MentorApplicationForm } from "@/components/customRequest/MentorApplicationForm";
import type { UserRow } from "@/lib/types/user";

type Row = Record<string, unknown>;

export function CustomRequestPublicPostBody(props: {
  postId: string;
  row: Row;
  postTable: string;
  userId: string | null;
  profile: UserRow | null;
  /** 앱이 지원을 로드한 결과(서버에서 await 후 전달) */
  applications: CustomListResult & { postTable: string | null };
  canViewAttachments: boolean;
  attachments: PostAttachmentListItem[];
  attachmentLoadError: string | null;
}) {
  const { postId, row, postTable: _unusedPostTable, userId, profile, applications, canViewAttachments, attachments, attachmentLoadError } =
    props;
  void _unusedPostTable;
  const d = mapPostRowToPublicDetail(row);
  const author = isAuthorOfPost(userId ?? "", row);
  const isMentor = profile?.role === "mentor";
  const isStudent = profile?.role === "student";
  const isAuthor = userId ? author.ok : false;
  const allowsApply = isMentorApplicablePostStatus(row);

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/30 p-4 shadow-sm sm:p-6">
        <h1 className="text-balance break-words text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{d.title}</h1>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryPill label="과목" value={d.subject} />
          <SummaryPill label="예산" value={d.budgetLine} />
          <SummaryPill label="마감" value={d.deadline} />
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 sm:col-span-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">상태</p>
            <div className="mt-1.5">
              <MentorPostStatusBadge row={row} />
            </div>
          </div>
          {d.goal && d.goal !== "—" ? <SummaryPill label="목표" value={d.goal} /> : null}
        </ul>
        {d.category && d.category !== "—" ? (
          <p className="mt-3 text-sm text-slate-600">
            <span className="font-extrabold text-slate-800">분야</span> {d.category}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
          {author.ok ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900">내가 등록한 의뢰</span> : null}
          <p className="min-w-0 text-balance break-words">
            <span className="font-extrabold text-slate-800">연락(선정 전)</span> {d.contactMasked}
          </p>
        </div>
        {applications.error ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
            지원 건수를 모두 불러오지 못했을 수 있어요. 잠시 후 다시 열어 주세요.
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            <span className="font-extrabold text-slate-800">제출된 지원</span> {applications.rows.length}건
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-extrabold text-slate-900">요청 내용</h2>
        <p className="mt-1 text-sm text-slate-500">희망 범위·세부 사항</p>
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{d.body}</p>
        </div>
        {d.deliverableFormat && d.deliverableFormat !== "—" ? (
          <p className="mt-3 text-sm text-slate-700">
            <span className="font-extrabold">결과물 형식</span> {d.deliverableFormat}
          </p>
        ) : null}
        {canViewAttachments ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3.5 sm:p-4">
            <p className="text-sm font-extrabold text-slate-800">첨부 파일</p>
            {attachmentLoadError ? (
              <p className="mt-2 text-sm text-amber-900">첨부를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
            ) : attachments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">등록된 첨부가 없어요.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-bold break-words text-slate-900">{a.original_filename}</p>
                      <p className="text-xs text-slate-500">
                        {formatBytes(a.file_size_bytes)} · {formatUploadedAt(a.created_at)}
                      </p>
                    </div>
                    <form action={downloadCustomRequestPostAttachmentAction} className="shrink-0">
                      <input type="hidden" name="postId" value={postId} />
                      <input type="hidden" name="attachmentId" value={a.id} />
                      <button
                        type="submit"
                        className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 sm:min-w-[5.5rem] sm:py-2"
                      >
                        다운로드
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-slate-800 sm:p-5">
        <p className="font-extrabold text-slate-900">이용 안내</p>
        <ul className="mt-2 list-inside list-disc space-y-1.5 break-words text-slate-700">
          <li>의뢰 등록은 학생 계정에서 진행돼요.</li>
          <li>지원은 멘토가 제출하며, 한 분을 정하면 이후 주문·진행 단계로 이어질 수 있어요.</li>
        </ul>
      </section>

      {isStudent && isAuthor ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5">
          <p className="font-extrabold text-emerald-950">의뢰하신 입장</p>
          <p className="mt-1.5 text-sm text-emerald-900/90">지원을 비교하고, 한 분을 선택한 뒤 절차를 이어갈 수 있어요.</p>
          <Link
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white hover:bg-emerald-500"
            href={`/custom-request/${postId}/applications`}
          >
            지원서 비교·선택하기
          </Link>
        </div>
      ) : null}

      {isMentor && !isAuthor && allowsApply && (
        <div className="space-y-2">
          <p className="text-sm font-extrabold text-slate-800">이 의뢰에 지원해 보세요</p>
          <MentorApplicationForm postId={postId} returnContext="public" />
        </div>
      )}

      {isMentor && isAuthor ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50/90 px-3.5 py-2.5 text-sm text-amber-950">멘토 계정으로는 본인이 올린 의뢰에 지원할 수 없어요.</p>
      ) : null}

      {!profile ? (
        <p className="text-sm text-slate-600">
          <Link
            className="min-h-[44px] font-extrabold text-blue-700 underline"
            href={`/login/mentor?next=${encodeURIComponent(`/custom-request/${postId}`)}`}
          >
            멘토로 로그인
          </Link>
          {` `}
          하시면 지원을 제출할 수 있어요.
        </p>
      ) : null}

      {isMentor && !isAuthor && !allowsApply ? (
        <p className="text-sm text-slate-600">지금은 새 지원을 받지 않는 단계예요. 모집이 끝났거나 조건이 맞지 않을 수 있어요.</p>
      ) : null}
    </div>
  );
}

function SummaryPill(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{props.label}</p>
      <p className="mt-0.5 break-words text-sm font-bold text-slate-900">{props.value || "—"}</p>
    </div>
  );
}

function formatBytes(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "크기 정보 없음";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadedAt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}
