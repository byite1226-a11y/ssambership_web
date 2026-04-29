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
  const d = mapPostRowToPublicDetail(props.row);
  const author = isAuthorOfPost(props.userId ?? "", props.row);
  const isMentor = props.profile?.role === "mentor";
  const isStudent = props.profile?.role === "student";
  const isAuthor = props.userId ? author.ok : false;
  const allowsApply = isMentorApplicablePostStatus(props.row);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black text-slate-900">{d.title}</h1>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Item k="카테고리" v={d.category} />
          <Item k="과목" v={d.subject} />
          <Item k="목표" v={d.goal} />
          <Item k="기한" v={d.deadline} />
          <Item k="예산 범위" v={d.budgetLine} />
          <Item k="결과물 형식" v={d.deliverableFormat} />
          <div>
            <dt className="text-xs font-extrabold uppercase text-slate-500">상태</dt>
            <dd className="mt-0.5">
              <MentorPostStatusBadge row={props.row} />
            </dd>
          </div>
        </dl>
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-xs font-extrabold text-slate-500">본문</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{d.body}</p>
        </div>
        {props.canViewAttachments ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-700">
            <p className="font-extrabold text-slate-800">등록 첨부</p>
            {props.attachmentLoadError ? (
              <p className="mt-2 text-amber-800">목록을 불러오지 못했습니다: {props.attachmentLoadError}</p>
            ) : props.attachments.length === 0 ? null : (
              <ul className="mt-2 space-y-2">
                {props.attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs sm:text-sm"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{a.original_filename}</p>
                      <p className="text-slate-500">
                        {formatBytes(a.file_size_bytes)} · {formatUploadedAt(a.created_at)}
                      </p>
                    </div>
                    <form action={downloadCustomRequestPostAttachmentAction}>
                      <input type="hidden" name="postId" value={props.postId} />
                      <input type="hidden" name="attachmentId" value={a.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-800 hover:bg-slate-50"
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
        <div className="mt-4 text-sm text-slate-600">
          {author.ok ? <p>작성하신 맞춤의뢰입니다.</p> : null}
          <p className="mt-2">
            <span className="font-extrabold">선정 전</span> · {d.contactMasked}
          </p>
        </div>
        {props.applications.error ? (
          <p className="mt-2 text-sm text-amber-800">지원서 정보를 모두 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">이 의뢰에 대해 제출된 지원 {props.applications.rows.length}건</p>
        )}
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-950">
        <p className="font-extrabold">정책(요약)</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-blue-900/90">
          <li>의뢰 등록은 학생 계정만(별도 /custom-request/new).</li>
          <li>지원 제출은 멘토만. 멘토 1명 선정 후 custom_request_orders·결제(후속)로 이어집니다.</li>
        </ul>
      </section>

      {isStudent && isAuthor ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
          <p className="font-extrabold">의뢰자(학생) — 지원 비교·주문</p>
          <Link
            className="mt-2 inline-block font-bold text-emerald-800 underline"
            href={`/custom-request/${props.postId}/applications`}
          >
            지원서 목록으로 (학생) →
          </Link>
        </div>
      ) : null}

      {isMentor && !isAuthor && allowsApply && (
        <MentorApplicationForm postId={props.postId} returnContext="public" />
      )}

      {isMentor && isAuthor ? (
        <p className="text-sm text-amber-800">멘토 계정으로는 본인이 의뢰자로 등록한 글에 지원할 수 없습니다.</p>
      ) : null}

      {!props.profile ? (
        <p className="text-sm text-slate-600">
          <Link
            className="font-bold text-blue-700 underline"
            href={`/login/mentor?next=${encodeURIComponent(`/custom-request/${props.postId}`)}`}
          >
            멘토로 로그인
          </Link>{" "}
          후 지원을 제출할 수 있습니다.
        </p>
      ) : null}

      {isMentor && !isAuthor && !allowsApply ? (
        <p className="text-sm text-slate-500">모집 종료 등 open 이외 상태 — 새 지원 UI 비활성(스키마·상태명 확정 후 조정).</p>
      ) : null}
    </div>
  );
}

function Item(props: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs font-extrabold uppercase text-slate-500">{props.k}</dt>
      <dd className="mt-0.5 font-bold text-slate-900">{props.v}</dd>
    </div>
  );
}

function formatBytes(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "크기 미상";
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
