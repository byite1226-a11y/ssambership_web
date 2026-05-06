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
          {d.category !== "—" ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-700">{d.category}</span>
          ) : null}
        </div>
        {d.subject !== "—" ? (
          <p className="mt-3 text-sm font-semibold text-slate-800">
            희망 전공·분야 <span className="font-bold text-slate-900">{d.subject}</span>
          </p>
        ) : null}
        <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <P label="희망 예산" value={d.budgetLine} />
          <P label="희망 납기" value={d.deadline} />
        </ul>
        {d.deliverableFormat !== "—" ? (
          <p className="mt-2 text-xs text-slate-600">
            납품 형식 참고: <span className="font-semibold text-slate-800">{d.deliverableFormat}</span>
          </p>
        ) : null}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 sm:p-4">
          <p className="text-xs font-extrabold text-slate-500">의뢰 내용</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{d.body}</p>
        </div>
      </div>
      {props.alreadyApplied ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
          <p>이미 제안서를 제출했어요. 같은 의뢰에는 한 번만 제출할 수 있습니다.</p>
          <Link href="/mentor/custom-request/posts" className="mt-2 inline-block text-sm font-semibold text-blue-800 underline underline-offset-2 hover:no-underline">
            제안한 의뢰 목록에서 상태 확인하기
          </Link>
        </div>
      ) : canApply ? null : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
          지금은 이 의뢰에 제안할 수 없는 단계예요. 모집이 끝났거나 조건이 맞지 않을 수 있어요.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {canApply ? (
          <Link
            href={`/mentor/custom-request/posts/${props.postId}/apply`}
            className="inline-flex min-h-[48px] max-w-md items-center justify-center rounded-xl bg-emerald-600 px-5 text-center text-sm font-extrabold text-white hover:bg-emerald-500 sm:min-h-[44px]"
          >
            제안서 작성하기
          </Link>
        ) : null}
        <Link href="/mentor/custom-request/posts" className="text-sm font-semibold text-slate-600 underline-offset-2 hover:text-blue-800 hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    </section>
  );
}
