import Link from "next/link";
import { mapPostRowToPublicDetail, isMentorApplicablePostStatus } from "@/lib/customRequest/customRequestPostMappers";
import { MentorPostStatusBadge } from "@/components/customRequest/MentorPostStatusBadge";

type Row = Record<string, unknown>;

function Item(props: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs font-extrabold uppercase text-slate-500">{props.k}</dt>
      <dd className="mt-0.5 font-bold text-slate-900">{props.v}</dd>
    </div>
  );
}

export function MentorCustomRequestDetailCard(props: { postId: string; row: Row; alreadyApplied: boolean }) {
  const d = mapPostRowToPublicDetail(props.row);
  const open = isMentorApplicablePostStatus(props.row);
  const canApply = !props.alreadyApplied && open;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h1 className="text-2xl font-black text-slate-900">{d.title}</h1>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <Item k="분야" v={d.category} />
        <Item k="과목·주제" v={d.subject} />
        <Item k="희망 예산" v={d.budgetLine} />
        <Item k="희망 납기" v={d.deadline} />
        <Item k="납품 형식" v={d.deliverableFormat} />
        <div>
          <dt className="text-xs font-extrabold uppercase text-slate-500">의뢰 상태</dt>
          <dd className="mt-0.5">
            <MentorPostStatusBadge row={props.row} />
          </dd>
        </div>
      </dl>
      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
        <p className="text-xs font-extrabold text-slate-500">의뢰 내용</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{d.body}</p>
      </div>
      {props.alreadyApplied ? (
        <p className="mt-4 text-sm text-slate-600">이미 이 의뢰에 지원을 제출하셨습니다. 동일한 의뢰에는 한 번만 제출할 수 있습니다.</p>
      ) : canApply ? null : (
        <p className="mt-4 text-sm text-slate-600">현재 지원할 수 없는 의뢰입니다. (모집이 종료되었거나, 조건이 맞지 않는 단계일 수 있어요.)</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {canApply ? (
          <Link
            href={`/mentor/custom-request/posts/${props.postId}/apply`}
            className="inline-block rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-500"
          >
            지원서 작성
          </Link>
        ) : null}
        <Link
          href="/mentor/custom-request/posts"
          className="inline-block rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
        >
          목록으로
        </Link>
      </div>
    </section>
  );
}
