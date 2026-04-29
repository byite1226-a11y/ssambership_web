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
      <p className="text-sm text-slate-600">
        지원서를 불러오는 중 문제가 있었습니다. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }
  if (!list.rows.length) {
    return (
      <p className="text-sm text-slate-600">
        아직 등록된 지원서가 없습니다. 멘토가 지원서를 제출하면 이곳에서 가격, 납기, 제안 내용을 비교할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {existingOrderId ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900">
          <p className="font-extrabold">
            이미 이 의뢰에 대해 주문이 진행 중입니다. 한 건의 제안을 선택·주문한 뒤에는 이 화면에서 다시 열지 않는 경우가 있습니다.
          </p>
          <Link
            className="mt-2 inline-block font-bold text-emerald-800 underline"
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
            ? `${e.display.displayName} · ${e.display.university || "—"} / ${e.display.department || "—"} · ${e.display.subjects || "—"}`
            : pickDisplayField(r, ["mentor_name", "mentor_display_name", "mentor_nickname", "id"]);
          const { proposal, scope, extra } = getApplicationTextBlocksForCompare(r);
          return (
            <li
              key={String(pickDisplayField(r, ["id", "key"]) + String(i))}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-xs text-slate-500">멘토 요약</span>
                  <br />
                  <span className="font-extrabold text-slate-900">{nameBlock}</span>
                </p>
                <p>
                  <span className="text-xs text-slate-500">제안 가격</span>
                  <br />
                  <span className="font-bold text-slate-900">{formatApplicationPriceKrwDisplay(r)}</span>
                </p>
                <p>
                  <span className="text-xs text-slate-500">예상 납기</span>
                  <br />
                  <span className="font-bold text-slate-900">{formatApplicationDueDateDisplay(r)}</span>
                </p>
                <p>
                  <span className="text-xs text-slate-500">상태</span>
                  <br />
                  <span className="font-bold text-slate-900">{formatApplicationStatusForStudent(r)}</span>
                </p>
                <p className="sm:col-span-2">
                  <span className="text-xs text-slate-500">연락(선정 전 마스킹)</span>
                  <br />
                  <span className="text-xs text-slate-600">{maskRowContact(r)}</span>
                </p>
              </div>
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-800">
                <p>
                  <span className="text-xs font-extrabold text-slate-500">제안 내용</span>
                  <br />
                  <span className="whitespace-pre-wrap">{proposal}</span>
                </p>
                <p>
                  <span className="text-xs font-extrabold text-slate-500">작업 범위</span>
                  <br />
                  <span className="whitespace-pre-wrap">{scope}</span>
                </p>
                <p>
                  <span className="text-xs font-extrabold text-slate-500">추가 메모</span>
                  <br />
                  <span className="whitespace-pre-wrap">{extra}</span>
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
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
