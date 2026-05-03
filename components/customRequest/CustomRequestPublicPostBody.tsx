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

import { CustomRequestFlowStepper } from "@/components/customRequest/CustomRequestFlowStepper";

type Row = Record<string, unknown>;

function formatPostCreated(row: Row): string {
  const raw = row.created_at;
  if (raw == null) return "—";
  const d = new Date(typeof raw === "string" || typeof raw === "number" ? raw : String(raw));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

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
  const appCount = applications.error ? null : applications.rows.length;

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {isStudent && isAuthor ? <CustomRequestFlowStepper activeStep={2} className="mb-1" /> : null}

      {isStudent && isAuthor && appCount != null && appCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-sm font-bold text-emerald-950">
            <span className="font-extrabold">{appCount}건</span>의 멘토 제안이 있어요.
          </p>
          <Link
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-500"
            href={`/custom-request/${postId}/applications`}
          >
            제안 비교·선택하기
          </Link>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-sky-50/20 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 text-balance text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{d.title}</h1>
          {author.ok ? (
            <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-emerald-100 px-3 text-xs font-extrabold text-emerald-900">
              내 의뢰
            </span>
          ) : null}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryPill label="분야" value={d.category !== "—" ? d.category : "—"} />
          <SummaryPill label="희망 전공·과목" value={d.subject} />
          <SummaryPill label="예산" value={d.budgetLine} />
          <SummaryPill label="희망 마감" value={d.deadline} />
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">상태</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <MentorPostStatusBadge row={row} />
            </div>
          </div>
          <SummaryPill label="등록일" value={formatPostCreated(row)} />
          {d.goal && d.goal !== "—" ? <SummaryPill label="목표" value={d.goal} /> : null}
        </div>
        <div className="mt-4 rounded-xl border border-slate-100 bg-white/80 px-3 py-2.5 text-sm text-slate-600">
          <span className="font-extrabold text-slate-800">연락 (선정 전)</span>{" "}
          <span className="break-words">{d.contactMasked}</span>
        </div>
        {applications.error ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm font-semibold text-amber-950">
            지원 건수를 모두 불러오지 못했을 수 있어요. 잠시 후 다시 열어 주세요.
          </p>
        ) : (
          <p className="mt-3 text-sm font-medium text-slate-600">
            <span className="font-extrabold text-slate-800">제출된 지원</span> {applications.rows.length}건
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-extrabold text-slate-900">요청 내용</h2>
        <p className="mt-0.5 text-sm font-medium text-slate-500">희망 범위·세부 사항</p>
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-slate-800">{d.body}</p>
        </div>
        {d.deliverableFormat && d.deliverableFormat !== "—" ? (
          <p className="mt-4 text-sm text-slate-700">
            <span className="font-extrabold text-slate-900">결과물 형식</span> {d.deliverableFormat}
          </p>
        ) : null}
        {canViewAttachments ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 sm:p-5">
            <p className="text-sm font-extrabold text-slate-900">첨부 파일</p>
            {attachmentLoadError ? (
              <p className="mt-2 text-sm font-medium text-amber-900">첨부를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
            ) : attachments.length === 0 ? (
              <p className="mt-2 text-sm font-medium text-slate-600">등록된 첨부가 없어요.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-bold text-slate-900">{a.original_filename}</p>
                      <p className="text-xs font-medium text-slate-500">
                        {formatBytes(a.file_size_bytes)} · {formatUploadedAt(a.created_at)}
                      </p>
                    </div>
                    <form action={downloadCustomRequestPostAttachmentAction} className="shrink-0">
                      <input type="hidden" name="postId" value={postId} />
                      <input type="hidden" name="attachmentId" value={a.id} />
                      <button
                        type="submit"
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-800 hover:bg-slate-50 sm:w-auto"
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

      <section className="rounded-2xl border border-sky-100/90 bg-sky-50/40 p-5 text-sm text-slate-800 sm:p-6">
        <p className="font-extrabold text-slate-900">이용 안내</p>
        <ul className="mt-2 list-disc space-y-2 pl-4 font-medium leading-relaxed text-slate-700 marker:text-sky-500">
          <li>의뢰 등록은 학생 계정에서 진행돼요.</li>
          <li>멘토가 제안을 내면 비교한 뒤 한 분을 골라 주문·진행으로 이어갈 수 있어요.</li>
        </ul>
      </section>

      {isStudent && isAuthor && appCount === 0 ? (
        <div className="rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/90 to-white p-5 shadow-sm sm:p-6">
          <p className="font-extrabold text-slate-900">멘토 지원을 기다리고 있어요</p>
          <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-600">
            제안이 도착하면 비교·선택 화면에서 확인할 수 있어요. 가끔 이 페이지를 열어 봐 주세요.
          </p>
          <Link
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-blue-500 bg-white px-5 text-sm font-extrabold text-blue-800 shadow-sm hover:bg-sky-50"
            href={`/custom-request/${postId}/applications`}
          >
            지원 현황 화면 열기
          </Link>
        </div>
      ) : null}

      {isMentor && !isAuthor && allowsApply && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-extrabold text-slate-900">이 의뢰에 지원해 보세요</p>
          <MentorApplicationForm postId={postId} returnContext="public" />
        </div>
      )}

      {isMentor && isAuthor ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-950">
          멘토 계정으로는 본인이 올린 의뢰에 지원할 수 없어요.
        </p>
      ) : null}

      {!profile ? (
        <p className="text-sm font-medium text-slate-600">
          <Link
            className="min-h-[44px] font-extrabold text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-blue-800"
            href={`/login/mentor?next=${encodeURIComponent(`/custom-request/${postId}`)}`}
          >
            멘토로 로그인
          </Link>
          {` `}
          하시면 지원을 제출할 수 있어요.
        </p>
      ) : null}

      {isMentor && !isAuthor && !allowsApply ? (
        <p className="text-sm font-medium text-slate-600">지금은 새 지원을 받지 않는 단계예요. 모집이 끝났거나 조건이 맞지 않을 수 있어요.</p>
      ) : null}
    </div>
  );
}

function SummaryPill(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-sm">
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
