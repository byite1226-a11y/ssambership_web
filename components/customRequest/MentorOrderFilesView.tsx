"use client";

import Link from "next/link";
import { useRef } from "react";
import { MentorOrderProgressStepper } from "@/components/customRequest/MentorOrderProgressStepper";
import { downloadCustomOrderDeliverableAction } from "@/lib/customRequest/orderDeliverableDownloadActions";
import {
  markMentorOrderDeliveredForReviewAction,
  uploadMentorOrderWorkFileAction,
} from "@/lib/customRequest/orderMentorActions";

const FILE_STEPS = [
  "주문 생성",
  "작업 중",
  "파일 업로드",
  "학생 확인",
  "완료 및 정산",
] as const;

export type MentorOrderFilesViewProps = {
  orderId: string;
  statusLabel: string;
  deadlineLabel: string;
  files: {
    id: string;
    version: number;
    fileName: string;
    sizeLabel: string;
    uploadedAtLabel: string;
    downloadable: boolean;
    isLatest: boolean;
    isUnderReview: boolean;
  }[];
  canSubmitDelivery: boolean;
};

export function MentorOrderFilesView(props: MentorOrderFilesViewProps) {
  const { orderId, files, canSubmitDelivery } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roomHref = `/custom-request/orders/${orderId}`;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-black text-slate-900">작업 파일</h1>
        <p className="mt-1 text-sm font-medium text-slate-600">
          상태: {props.statusLabel} · 마감: {props.deadlineLabel}
        </p>
        <div className="mt-5 max-w-md">
          <MentorOrderProgressStepper steps={FILE_STEPS} activeIndex={2} accent="green" />
        </div>
      </header>

      <section className="rounded-2xl border-2 border-dashed border-[#059669]/30 bg-emerald-50/30 p-6 text-center sm:p-8">
        <p className="text-sm font-medium text-slate-700">
          파일을 드래그 앤 드롭하거나 파일 선택 버튼을 클릭하세요
        </p>
        <p className="mt-2 text-xs font-medium text-slate-500">
          허용 형식: PDF, PPT, DOC, PNG, JPG, ZIP (최대 100MB)
        </p>
        <form action={uploadMentorOrderWorkFileAction} className="mt-4">
          <input type="hidden" name="orderId" value={orderId} />
          <input
            ref={fileInputRef}
            type="file"
            name="deliverableFile"
            accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.zip,application/pdf,application/zip,image/png,image/jpeg"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.[0]) e.target.form?.requestSubmit();
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#059669] px-5 text-sm font-extrabold text-white hover:bg-[#047857]"
          >
            파일 선택
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-black text-slate-900">업로드된 파일</h2>
        {files.length === 0 ? (
          <p className="mt-3 text-sm font-medium text-slate-600">아직 업로드된 파일이 없어요.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-extrabold text-slate-900">{f.fileName}</p>
                    {f.isLatest ? (
                      <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-black text-white">
                        최종본
                      </span>
                    ) : null}
                    {f.isUnderReview ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900">
                        검토 요청
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    v{f.version} · {f.sizeLabel} · {f.uploadedAtLabel}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {f.downloadable ? (
                    <form action={downloadCustomOrderDeliverableAction}>
                      <input type="hidden" name="orderId" value={orderId} />
                      <input type="hidden" name="deliverableId" value={f.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50"
                      >
                        다운로드
                      </button>
                    </form>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-500"
                    title="미리보기는 준비 중이에요"
                  >
                    미리보기
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
        <h2 className="text-sm font-black text-slate-900">파일 업로드 가이드</h2>
        <ul className="mt-3 space-y-2 text-sm font-medium leading-relaxed text-slate-600">
          <li>· 파일명을 명확하게 작성해주세요</li>
          <li>· 최종본 제출 전에는 검토 요청 상태로 업로드하세요</li>
          <li>· 납품은 아래 납품하기 버튼을 눌러주세요</li>
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <form action={markMentorOrderDeliveredForReviewAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <button
            type="submit"
            disabled={!canSubmitDelivery}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#059669] px-6 text-sm font-extrabold text-white hover:bg-[#047857] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            납품하기
          </button>
        </form>
        <Link
          href={roomHref}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-[#059669] bg-white px-6 text-sm font-extrabold text-[#059669] hover:bg-emerald-50/40 sm:w-auto"
        >
          작업방으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
