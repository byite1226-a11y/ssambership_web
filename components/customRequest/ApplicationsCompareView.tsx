import type { CustomListResult, EnrichedApplication } from "@/lib/customRequest/customRequestQueries";
import {
  pickDisplayField,
  maskContact,
  formatApplicationPriceKrwDisplay,
  formatApplicationDueDateDisplay,
  formatApplicationStatusForStudent,
  getApplicationTextBlocksForCompare,
} from "@/lib/customRequest/customRequestQueries";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { CustomRequestFlowStepper } from "@/components/customRequest/CustomRequestFlowStepper";
import { SelectMentorApplicationForm } from "@/components/customRequest/SelectMentorApplicationForm";
import Link from "next/link";
import { MentorPostStatusBadge } from "@/components/customRequest/MentorPostStatusBadge";

type Row = Record<string, unknown>;

function maskRowContact(row: Row) {
  const e = pickDisplayField(row, ["mentor_email", "email", "contact_email", "kakao_id", "phone", "tel"]);
  if (e === "—" || e.length < 2) {
    return "—";
  }
  return maskContact(e);
}

function applicationCountForPost(list: CustomListResult): string {
  if (list.error) return "—";
  return String(list.rows.length);
}

function PostRequestSummaryCard(props: { postId: string; postRow: Row | null; applicationCount: string }) {
  if (!props.postRow) return null;
  const d = mapPostRowToPublicDetail(props.postRow);
  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-b from-indigo-50/40 to-white p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-extrabold text-slate-500">요청 요약</h2>
      <p className="mt-1.5 break-words text-lg font-extrabold text-slate-900">{d.title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {d.category && d.category !== "—" ? (
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-bold text-slate-800">
            {d.category}
          </span>
        ) : null}
        <MentorPostStatusBadge row={props.postRow} />
      </div>
      <ul className="mt-3 space-y-1.5 break-words text-sm text-slate-700">
        <li>
          <span className="font-extrabold">예산</span> {d.budgetLine}
        </li>
        <li>
          <span className="font-extrabold">희망 마감</span> {d.deadline}
        </li>
        <li>
          <span className="font-extrabold">지원 현황</span> {props.applicationCount === "—" ? "확인 중" : `${props.applicationCount}건`}
        </li>
      </ul>
      <Link
        className="mt-4 inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-800 shadow-sm hover:bg-slate-50 min-[400px]:w-auto"
        href={`/custom-request/${props.postId}`}
      >
        요청 내용 다시 보기
      </Link>
    </section>
  );
}

export function ApplicationsCompareView(props: {
  list: CustomListResult;
  postId: string;
  postRow: Row | null;
  enriched: EnrichedApplication[];
  existingOrderId: string | null;
}) {
  const { list, postId, postRow, enriched, existingOrderId } = props;
  const nApps = list.error ? 0 : list.rows.length;
  const activeStep: 1 | 2 | 3 | 4 = existingOrderId ? 4 : nApps > 0 ? 3 : 2;
  const appCountLabel = applicationCountForPost(list);

  if (list.error && !list.rows.length) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <PostRequestSummaryCard postId={postId} postRow={postRow} applicationCount="—" />
        <CustomRequestFlowStepper activeStep={2} />
        <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm text-slate-700 sm:px-5 sm:py-5">
          <p className="font-extrabold text-slate-900">지원서를 불러오지 못했어요</p>
          <p className="mt-1.5">잠시 후 다시 시도해 주세요.</p>
        </div>
      </div>
    );
  }
  if (!list.rows.length) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <PostRequestSummaryCard postId={postId} postRow={postRow} applicationCount="0" />
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">멘토 지원 대기</h2>
          <p className="mt-1 text-sm text-slate-600">지원이 들어오면 이 페이지에서 비교·선택할 수 있어요.</p>
        </div>
        <CustomRequestFlowStepper activeStep={2} />
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5">
            <p className="text-sm font-extrabold text-slate-900">지원 현황</p>
            <p className="mt-1 text-2xl font-black text-indigo-600">0건</p>
            <p className="mt-1 text-sm text-slate-600">멘토님이 제안을 보내면 이곳에 쌓여요.</p>
          </div>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5">
            <p className="text-sm font-extrabold text-slate-900">마감·일정</p>
            <p className="mt-1 break-words text-sm text-slate-700">
              {postRow
                ? `희망 마감(요청): ${mapPostRowToPublicDetail(postRow).deadline}`
                : "요청 정보를 불러오는 중이에요."}
            </p>
            <p className="mt-2 text-xs break-words text-slate-500">실제 일정·조정은 멘토와 이어지는 단계에서 맞출 수 있어요.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-100/60 bg-indigo-50/40 p-4 sm:p-5">
          <p className="text-sm font-extrabold text-slate-900">알림</p>
          <p className="mt-1.5 break-words text-sm text-slate-700">새 제안·메시지 알림은 앱/환경이 준비되면 이어갈 수 있어요. 지금은 이 페이지를 저장해 주기적으로 열어 보세요.</p>
        </div>
        <div className="flex flex-col gap-2.5 min-[400px]:flex-row min-[400px]:flex-wrap">
          <Link
            className="inline-flex min-h-[44px] min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-800 shadow-sm hover:bg-slate-50"
            href={`/custom-request/${postId}`}
          >
            요청 내용·상세로
          </Link>
        </div>
        <p className="text-center text-sm break-words text-slate-500">요청 수정이 필요하면 상세·고객 안내를 확인해 주세요. 동일한 입력 폼이 없을 수 있어요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <PostRequestSummaryCard postId={postId} postRow={postRow} applicationCount={nApps > 0 ? String(nApps) : appCountLabel} />
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">멘토 선택</h2>
        <p className="mt-1 break-words text-sm text-slate-600">제출된 제안을 비교한 뒤, 한 분을 골라 주문으로 이어갈 수 있어요.</p>
      </div>
      <CustomRequestFlowStepper activeStep={activeStep} />
      {existingOrderId ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950 sm:p-5">
          <p className="font-extrabold">이미 이 의뢰에 대한 주문이 열려 있어요.</p>
          <Link
            className="mt-3 inline-flex min-h-[44px] min-w-0 items-center break-words font-extrabold text-emerald-800 underline"
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
              className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5 sm:py-3.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">지원 {i + 1}</p>
                <p className="mt-1 break-words text-base font-extrabold text-slate-900">{nameBlock}</p>
                {e.display?.subjects ? (
                  <p className="mt-1 line-clamp-2 break-words text-sm text-slate-600">지도 분야 {e.display.subjects}</p>
                ) : null}
              </div>
              <div className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-2 sm:gap-4 sm:px-5 sm:py-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 sm:p-3">
                  <p className="text-xs font-extrabold text-slate-500">제안 가격</p>
                  <p className="mt-0.5 break-words text-base font-extrabold text-slate-900">{formatApplicationPriceKrwDisplay(r)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 sm:p-3">
                  <p className="text-xs font-extrabold text-slate-500">예상·협의 기간</p>
                  <p className="mt-0.5 break-words font-bold text-slate-900">{formatApplicationDueDateDisplay(r)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 sm:p-3">
                  <p className="text-xs font-extrabold text-slate-500">제안 상태</p>
                  <p className="mt-0.5 break-words font-bold text-slate-900">{formatApplicationStatusForStudent(r)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 sm:p-3 sm:col-span-1">
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
                  <span className="text-xs font-extrabold text-slate-500">제공 범위</span>
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
