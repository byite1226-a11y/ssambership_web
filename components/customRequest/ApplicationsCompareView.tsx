import type { CustomListResult, EnrichedApplication } from "@/lib/customRequest/customRequestQueries";
import {
  pickDisplayField,
  maskContact,
  formatApplicationPriceKrwDisplay,
  formatApplicationDueDateDisplay,
  formatApplicationStatusForStudent,
  getApplicationTextBlocksForCompare,
} from "@/lib/customRequest/customRequestQueries";
import { SelectMentorApplicationForm } from "@/components/customRequest/SelectMentorApplicationForm";
import Link from "next/link";

type Row = Record<string, unknown>;

function maskRowContact(row: Row) {
  const e = pickDisplayField(row, ["mentor_email", "email", "contact_email", "kakao_id", "phone", "tel"]);
  if (e === "—" || e.length < 2) {
    return "—";
  }
  return maskContact(e);
}

export function ApplicationsCompareView(props: {
  list: CustomListResult;
  postId: string;
  enriched: EnrichedApplication[];
  /** 이미 이 의뢰로 주문이 열린 경우 주문 링크만 표시 */
  existingOrderId: string | null;
}) {
  const { list, postId, enriched, existingOrderId } = props;
  if (list.error && !list.rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm text-slate-700 sm:px-5 sm:py-5">
        <p className="font-extrabold text-slate-900">지원서를 불러오지 못했어요</p>
        <p className="mt-1.5">잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }
  if (!list.rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-center sm:px-6">
        <p className="text-sm font-extrabold text-slate-800">아직 제출된 지원이 없어요</p>
        <p className="mt-2 text-sm text-slate-600">
          멘토가 지원을 올리면 이곳에서 가격·납기·제안을 비교할 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {existingOrderId ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950 sm:p-5">
          <p className="font-extrabold">이미 이 의뢰에 대한 주문이 열려 있어요. 이전에 선택·진행하신 주문이 있을 수 있어요.</p>
          <Link
            className="mt-3 inline-flex min-h-[44px] items-center font-extrabold text-emerald-800 underline"
            href={`/custom-request/orders/${existingOrderId}`}
          >
            맞춤의뢰 주문 보러 가기
          </Link>
        </div>
      ) : null}

      <ul className="space-y-4">
        {enriched.map((e, i) => {
          const r = e.row;
          const nameBlock = e.display
            ? `${e.display.displayName} · ${e.display.university || "—"} / ${e.display.department || "—"}`
            : pickDisplayField(r, ["mentor_name", "mentor_display_name", "mentor_nickname", "id"]);
          const { proposal, scope, extra } = getApplicationTextBlocksForCompare(r);
          return (
            <li
              key={String(pickDisplayField(r, ["id", "key"]) + String(i))}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5 sm:py-3.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">지원 {i + 1}</p>
                <p className="mt-1 break-words text-base font-extrabold text-slate-900">{nameBlock}</p>
                {e.display?.subjects ? (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">지도 {e.display.subjects}</p>
                ) : null}
              </div>
              <div className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-2 sm:gap-4 sm:px-5 sm:py-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
                  <p className="text-xs font-extrabold text-slate-500">제안 가격</p>
                  <p className="mt-0.5 break-words text-base font-extrabold text-slate-900">
                    {formatApplicationPriceKrwDisplay(r)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
                  <p className="text-xs font-extrabold text-slate-500">예상 납기</p>
                  <p className="mt-0.5 break-words font-bold text-slate-900">{formatApplicationDueDateDisplay(r)}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
                  <p className="text-xs font-extrabold text-slate-500">상태</p>
                  <p className="mt-0.5 break-words font-bold text-slate-900">{formatApplicationStatusForStudent(r)}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 sm:col-span-1">
                  <p className="text-xs font-extrabold text-slate-500">연락(선정 전)</p>
                  <p className="mt-0.5 break-words text-sm text-slate-600">{maskRowContact(r)}</p>
                </div>
              </div>
              <div className="space-y-2 border-t border-slate-100 bg-slate-50/30 px-4 py-3 text-sm text-slate-800 sm:px-5 sm:py-4">
                <p>
                  <span className="text-xs font-extrabold text-slate-500">제안</span>
                  <span className="mt-1 block whitespace-pre-wrap break-words">{proposal}</span>
                </p>
                <p>
                  <span className="text-xs font-extrabold text-slate-500">작업 범위</span>
                  <span className="mt-1 block whitespace-pre-wrap break-words">{scope}</span>
                </p>
                <p>
                  <span className="text-xs font-extrabold text-slate-500">추가</span>
                  <span className="mt-1 block whitespace-pre-wrap break-words">{extra}</span>
                </p>
              </div>
              <div className="border-t border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
                {!existingOrderId && e.applicationId ? (
                  <SelectMentorApplicationForm postId={postId} applicationId={e.applicationId} />
                ) : !existingOrderId && !e.applicationId ? (
                  <SelectMentorApplicationForm postId={postId} applicationId="" disabled />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
