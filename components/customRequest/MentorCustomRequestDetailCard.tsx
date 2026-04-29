import Link from "next/link";
import { mapPostRowToPublicDetail, isMentorApplicablePostStatus } from "@/lib/customRequest/customRequestPostMappers";
import { MentorPostStatusBadge } from "@/components/customRequest/MentorPostStatusBadge";

type Row = Record<string, unknown>;

function P(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{props.label}</p>
      <p className="mt-0.5 break-words text-sm font-bold text-slate-900">{props.value || "—"}</p>
    </div>
  );
}

export function MentorCustomRequestDetailCard(props: { postId: string; row: Row; alreadyApplied: boolean }) {
  const d = mapPostRowToPublicDetail(props.row);
  const open = isMentorApplicablePostStatus(props.row);
  const canApply = !props.alreadyApplied && open;

  return (
    <section className="space-y-4 sm:space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/40 p-4 shadow-sm sm:p-6">
        <h1 className="text-balance break-words text-2xl font-black text-slate-900 sm:text-3xl">{d.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-slate-500">상태</span>
          <MentorPostStatusBadge row={props.row} />
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <P label="과목" value={d.subject} />
          <P label="희망 예산" value={d.budgetLine} />
          <P label="희망 납기" value={d.deadline} />
          <P label="분야" value={d.category} />
          <P label="납품 형식" value={d.deliverableFormat} />
        </ul>
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 sm:p-4">
          <p className="text-xs font-extrabold text-slate-500">의뢰 내용</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{d.body}</p>
        </div>
      </div>
      {props.alreadyApplied ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
          이미 이 의뢰에 지원을 보내셨어요. 같은 의뢰에는 한 번만 제출할 수 있어요.
        </p>
      ) : canApply ? null : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
          지금은 이 의뢰에 지원할 수 없는 단계예요. 모집이 끝났거나 조건이 맞지 않을 수 있어요.
        </p>
      )}

      <div className="flex flex-col gap-2.5 min-[400px]:flex-row min-[400px]:flex-wrap">
        {canApply ? (
          <Link
            href={`/mentor/custom-request/posts/${props.postId}/apply`}
            className="inline-flex min-h-[48px] min-w-0 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white hover:bg-emerald-500 min-[400px]:min-h-[44px] min-[400px]:max-w-xs"
          >
            지원서 작성하기
          </Link>
        ) : null}
        <Link
          href="/mentor/custom-request/posts"
          className="inline-flex min-h-[48px] min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-800 hover:bg-slate-50 min-[400px]:min-h-[44px] min-[400px]:w-auto"
        >
          목록으로
        </Link>
      </div>
    </section>
  );
}
