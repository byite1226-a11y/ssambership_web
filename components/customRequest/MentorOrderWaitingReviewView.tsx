"use client";

import { downloadCustomOrderDeliverableAction } from "@/lib/customRequest/orderDeliverableDownloadActions";
import { DeliveryReviewCountdown } from "@/components/customRequest/DeliveryReviewCountdown";
import { MentorOrderProgressStepper } from "@/components/customRequest/MentorOrderProgressStepper";

const TIMELINE_STEPS = [
  "주문 생성",
  "작업 중",
  "납품 완료",
  "학생 확인",
  "완료 및 정산",
] as const;

export type MentorOrderWaitingReviewViewProps = {
  orderId: string;
  requestTitle: string;
  clientName: string;
  deadlineLabel: string;
  amountLabel: string;
  deliverable: {
    id: string;
    fileName: string;
    sizeLabel: string;
    submittedAtLabel: string;
    downloadable: boolean;
  } | null;
  reviewDeadlineIso: string | null;
};

export function MentorOrderWaitingReviewView(props: MentorOrderWaitingReviewViewProps) {
  const { orderId, deliverable } = props;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] lg:gap-8">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">진행 단계</p>
        <div className="mt-4">
          <MentorOrderProgressStepper steps={TIMELINE_STEPS} activeIndex={3} />
        </div>
      </aside>

      <div className="min-w-0 space-y-5">
        <header className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">납품 대기</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
              검토 대기
            </span>
          </div>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
            작업 파일을 납품했어요. 학생의 검토를 기다려주세요.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
            <span>요청: {props.requestTitle}</span>
            <span>의뢰자: {props.clientName}</span>
            <span>마감: {props.deadlineLabel}</span>
            <span>금액: {props.amountLabel}</span>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-black text-slate-900">납품 파일</h2>
          {deliverable ? (
            <div className="mt-4 flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-extrabold text-slate-900">{deliverable.fileName}</p>
                  <span className="rounded-full bg-[#1A56DB] px-2 py-0.5 text-[10px] font-black text-white">
                    최신 버전
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {deliverable.sizeLabel} · 납품 {deliverable.submittedAtLabel}
                </p>
              </div>
              {deliverable.downloadable ? (
                <form action={downloadCustomOrderDeliverableAction}>
                  <input type="hidden" name="orderId" value={orderId} />
                  <input type="hidden" name="deliverableId" value={deliverable.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
                  >
                    다운로드
                  </button>
                </form>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm font-medium text-slate-600">등록된 납품 파일이 없어요.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-black text-slate-900">학생 검토 기간</h2>
          <DeliveryReviewCountdown reviewDeadlineIso={props.reviewDeadlineIso} className="mt-4" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            검토 기간 내 응답 없으면 자동 완료 처리됩니다.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
          <h2 className="text-sm font-black text-slate-900">안내사항</h2>
          <ul className="mt-3 space-y-2 text-sm font-medium leading-relaxed text-slate-600">
            <li>· 수락 시 자동 정산 (3영업일 이내)</li>
            <li>· 수정 요청이 오면 알림으로 안내</li>
            <li>· 문제 발생 시 고객센터 이용</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
