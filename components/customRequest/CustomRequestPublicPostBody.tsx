import Link from "next/link";
import { isAuthorOfPost, type CustomListResult } from "@/lib/customRequest/customRequestQueries";
import { mapPostRowToPublicDetail, attachmentNote } from "@/lib/customRequest/customRequestPostMappers";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
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
}) {
  void props.postTable;
  const d = mapPostRowToPublicDetail(props.row);
  const att = attachmentNote(props.row);
  const author = isAuthorOfPost(props.userId ?? "", props.row);
  /* 멘토 지원/학생 CTA: 역할은 post row·RPC가 아닌 서버 profile.role 기준 */
  const isMentor = props.profile?.role === "mentor";
  const isStudent = props.profile?.role === "student";
  const isAuthor = props.userId ? author.ok : false;
  const statusLower = (d.status || "").toLowerCase();
  const allowsApply = statusLower.includes("open") || statusLower.includes("모집") || statusLower.includes("recruit") || d.status === "—";

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
          <Item k="상태" v={d.status} />
        </dl>
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-xs font-extrabold text-slate-500">본문</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{d.body}</p>
        </div>
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-600">
          <span className="font-extrabold">첨부</span> · {att} · <span className="text-xs">제출된 첨부는 주문·진행 단계에서 안내됩니다.</span>
        </div>
        <div className="mt-4 text-sm text-slate-600">
          <p>
            <span className="font-extrabold">작성자</span> ·{" "}
            {author.ok ? "이 의뢰는 내가 등록한 요청입니다." : "다른 참가자에게는 식별 정보가 제한될 수 있습니다."}
          </p>
          <p className="mt-2">
            <span className="font-extrabold">선택 전 연락처</span> · {d.contactMasked}
          </p>
        </div>
        {props.applications.error ? (
          <p className="mt-2 text-sm text-amber-800">지원 정보: {mapDataErrorMessage(String(props.applications.error))}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">이 의뢰에 제출된 지원: {props.applications.rows.length}건</p>
        )}
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-950">
        <p className="font-extrabold">정책(요약)</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-blue-900/90">
          <li>의뢰 등록은 학생 계정으로 할 수 있습니다.</li>
          <li>지원은 멘토만 제출할 수 있으며, 선정 후 주문·결제는 단계별로 안내됩니다.</li>
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
        <MentorApplicationForm postId={props.postId} appTableHint={props.applications.table} />
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
        <p className="text-sm text-slate-500">현재는 모집이 마감되었거나 지원을 받지 않는 상태입니다.</p>
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
