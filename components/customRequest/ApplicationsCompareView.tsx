import type { CustomListResult, EnrichedApplication } from "@/lib/customRequest/customRequestQueries";
import {
  pickDisplayField,
  maskContact,
  formatApplicationPriceKrwDisplay,
  formatApplicationDurationDays,
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

function PostRequestSummaryStrip(props: { postId: string; postRow: Row | null; applicationCount: string }) {
  if (!props.postRow) return null;
  const d = mapPostRowToPublicDetail(props.postRow);
  const countLabel = props.applicationCount === "—" ? "확인 중" : `${props.applicationCount}건`;
  return (
    <section className="overflow-hidden rounded-2xl border border-sky-100/90 bg-gradient-to-r from-sky-50/70 via-white to-slate-50/30 p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">요청 요약</p>
          <p className="mt-1 break-words text-lg font-black leading-snug text-slate-900 sm:text-xl">{d.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {d.category && d.category !== "—" ? (
              <span className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800">
                {d.category}
              </span>
            ) : null}
            <MentorPostStatusBadge row={props.postRow} />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-700">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">예산</p>
            <p className="mt-0.5 font-bold text-slate-900">{d.budgetLine}</p>
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">희망 마감</p>
            <p className="mt-0.5 font-bold text-slate-900">{d.deadline}</p>
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">지원</p>
            <p className="mt-0.5 font-bold text-slate-900">{countLabel}</p>
          </div>
        </div>
        <Link
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50"
          href={`/custom-request/${props.postId}`}
        >
          요청 상세 보기
        </Link>
      </div>
    </section>
  );
}

const shell = "w-full space-y-4 sm:space-y-5";

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
      <div className={shell}>
        <PostRequestSummaryStrip postId={postId} postRow={postRow} applicationCount="—" />
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
      <div className={shell}>
        <PostRequestSummaryStrip postId={postId} postRow={postRow} applicationCount="0" />
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">멘토 지원 대기</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">제안이 들어오면 여기서 비교·선택할 수 있어요.</p>
        </div>
        <CustomRequestFlowStepper activeStep={2} />
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-extrabold text-slate-900">지원 현황</p>
            <p className="mt-1 text-2xl font-black text-blue-600">0건</p>
            <p className="mt-1 text-sm font-medium text-slate-600">멘토가 제안을 내면 카드로 쌓여요.</p>
          </div>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-extrabold text-slate-900">마감·일정</p>
            <p className="mt-1 break-words text-sm font-medium text-slate-700">
              {postRow ? `희망 마감: ${mapPostRowToPublicDetail(postRow).deadline}` : "요청 정보를 불러오는 중이에요."}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">일정 조정은 이후 단계에서 멘토와 맞출 수 있어요.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:p-5">
          <p className="text-sm font-extrabold text-slate-900">알림</p>
          <p className="mt-1.5 break-words text-sm font-medium text-slate-700">
            새 제안이 오면 이 페이지를 다시 열어 확인해 주세요.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 min-[400px]:flex-row min-[400px]:flex-wrap">
          <Link
            className="inline-flex min-h-[44px] min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-800 shadow-sm hover:bg-slate-50"
            href={`/custom-request/${postId}`}
          >
            요청 내용으로 돌아가기
          </Link>
        </div>
        <p className="text-center text-sm break-words font-medium text-slate-500">내용을 고치려면 고객 안내를 참고해 주세요.</p>
      </div>
    );
  }

  return (
    <div className={shell}>
      <PostRequestSummaryStrip postId={postId} postRow={postRow} applicationCount={nApps > 0 ? String(nApps) : appCountLabel} />
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">멘토 지원서 목록</h2>
        <p className="mt-1 break-words text-sm font-medium text-slate-600">제안 가격·기간·내용을 비교하고 선택해 주세요.</p>
      </div>
      <CustomRequestFlowStepper activeStep={activeStep} />
      {existingOrderId ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950 sm:p-5">
          <p className="font-extrabold">이미 이 의뢰에 대한 주문이 있어요.</p>
          <Link
            className="mt-3 inline-flex min-h-[44px] min-w-0 items-center break-words font-extrabold text-emerald-800 underline underline-offset-2"
            href={`/custom-request/orders/${existingOrderId}`}
          >
            주문 화면으로 이동
          </Link>
        </div>
      ) : null}

      <ul className="space-y-4">
        {enriched.map((e, i) => {
          const r = e.row;
          const displayName = e.display?.displayName ?? pickDisplayField(r, ["mentor_name", "mentor_display_name", "mentor_nickname"]);
          const schoolLine = e.display
            ? [e.display.university, e.display.department].filter((x) => x && x !== "—").join(" · ")
            : "";
          const { proposal } = getApplicationTextBlocksForCompare(r);
          const preview =
            proposal && proposal !== "작성된 내용이 없습니다."
              ? proposal.replace(/\s+/g, " ").trim()
              : "";
          const avatarUrl = e.display?.photoUrl && e.display.photoUrl !== "—" ? e.display.photoUrl : null;
          const verified = ["approved", "verified", "complete", "인증 완료"].some((v) =>
            String(e.display?.verification ?? "").toLowerCase().includes(v)
          );

          return (
            <li
              key={String(pickDisplayField(r, ["id", "key"]) + String(i))}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-lg font-black text-slate-500">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (displayName !== "—" ? displayName[0] : "M") ?? "M"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-extrabold text-slate-900">{displayName}</p>
                    {verified ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
                        인증
                      </span>
                    ) : null}
                    <span className="text-xs font-medium text-slate-400">{formatApplicationStatusForStudent(r)}</span>
                  </div>
                  {schoolLine ? <p className="mt-0.5 text-sm font-medium text-slate-600">{schoolLine}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <span className="font-extrabold text-[#1A56DB]">{formatApplicationPriceKrwDisplay(r)}</span>
                    <span className="font-bold text-slate-700">예상 {formatApplicationDurationDays(r)}</span>
                  </div>
                  {preview ? (
                    <p className="mt-3 line-clamp-2 text-sm font-medium leading-relaxed text-slate-600">{preview}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-slate-400">연락처: {maskRowContact(r)} (선정 전 비공개)</p>
                </div>
                <div className="w-full shrink-0 sm:w-auto sm:pt-1">
                  {!existingOrderId && e.applicationId ? (
                    <SelectMentorApplicationForm
                      postId={postId}
                      applicationId={e.applicationId}
                      mentorName={displayName !== "—" ? displayName : undefined}
                    />
                  ) : !existingOrderId && !e.applicationId ? (
                    <SelectMentorApplicationForm postId={postId} applicationId="" disabled />
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!existingOrderId ? (
        <p className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-center text-sm font-bold text-blue-950">
          한 분을 고르면 주문 화면으로 이어져요.
        </p>
      ) : null}
    </div>
  );
}
