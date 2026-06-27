"use client";

import Link from "next/link";
import { downloadCustomOrderDeliverableAction } from "@/lib/customRequest/orderDeliverableDownloadActions";

export type MentorOrderRevisionViewProps = {
  orderId: string;
  deadlineDdayLabel: string;
  student: { name: string; initial: string };
  revisionMessage: string;
  requestedAtLabel: string;
  deliverables: {
    id: string;
    versionLabel: string;
    fileName: string;
    submittedAtLabel: string;
    downloadable: boolean;
  }[];
  revisionUsage: { used: number; max: number; exceeded: boolean };
  summary: {
    requestTitle: string;
    category: string;
    amountLabel: string;
    deadlineLabel: string;
  };
};

export function MentorOrderRevisionView(props: MentorOrderRevisionViewProps) {
  const { orderId, revisionUsage } = props;
  const filesHref = `/mentor/custom-request/orders/${orderId}/files`;
  const roomHref = `/custom-request/orders/${orderId}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:gap-8">
      <div className="min-w-0 space-y-5">
        <header className="rounded-2xl border border-red-200 bg-red-50/70 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">수정 요청</h1>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-black text-red-800">
              {props.deadlineDdayLabel}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
            학생이 수정을 요청했어요. 내용을 확인하고 재납품해 주세요.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-black text-slate-900">수정 요청 내용</h2>
          <div className="mt-4 flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/10 text-sm font-black text-[#2563EB]">
              {props.student.initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-900">{props.student.name}</p>
              <p className="text-xs font-medium text-slate-500">요청 {props.requestedAtLabel}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {props.revisionMessage}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-black text-slate-900">이전 납품 파일</h2>
          {props.deliverables.length === 0 ? (
            <p className="mt-3 text-sm font-medium text-slate-600">이전 납품 파일이 없어요.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {props.deliverables.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-xs font-black text-[#2563EB]">{d.versionLabel}</p>
                    <p className="mt-0.5 text-sm font-extrabold text-slate-900">{d.fileName}</p>
                    <p className="text-xs font-medium text-slate-500">{d.submittedAtLabel}</p>
                  </div>
                  {d.downloadable ? (
                    <form action={downloadCustomOrderDeliverableAction}>
                      <input type="hidden" name="orderId" value={orderId} />
                      <input type="hidden" name="deliverableId" value={d.id} />
                      <button
                        type="submit"
                        className="text-xs font-extrabold text-[#2563EB] underline underline-offset-2"
                      >
                        다운로드
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className={`rounded-2xl border p-5 sm:p-6 ${revisionUsage.exceeded ? "border-red-200 bg-red-50/60" : "border-slate-200 bg-white shadow-sm"}`}
        >
          <h2 className="text-lg font-black text-slate-900">수정 가능 횟수</h2>
          <p className="mt-2 text-sm font-extrabold text-slate-800">
            수정 {revisionUsage.used}/{revisionUsage.max}회 사용
          </p>
          {revisionUsage.exceeded ? (
            <p className="mt-2 text-sm font-bold text-red-800">최대 수정 횟수를 초과했습니다.</p>
          ) : (
            <p className="mt-2 text-sm font-medium text-slate-600">재납품은 파일 업로드 화면에서 진행해 주세요.</p>
          )}
          <Link
            href={filesHref}
            className={`mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl px-5 text-sm font-extrabold text-white ${
              revisionUsage.exceeded
                ? "cursor-not-allowed bg-slate-400"
                : "bg-[#2563EB] hover:bg-[#1D4ED8]"
            }`}
            aria-disabled={revisionUsage.exceeded}
            tabIndex={revisionUsage.exceeded ? -1 : 0}
          >
            파일 업로드하고 재납품하기
          </Link>
        </section>
      </div>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-900">의뢰 요약</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="font-bold text-slate-500">제목</dt>
              <dd className="font-extrabold text-slate-900">{props.summary.requestTitle}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">카테고리</dt>
              <dd className="font-extrabold text-slate-900">{props.summary.category}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">금액</dt>
              <dd className="font-extrabold text-[#2563EB]">{props.summary.amountLabel}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">마감일</dt>
              <dd className="font-extrabold text-slate-900">{props.summary.deadlineLabel}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-900">빠른 메뉴</h2>
          <ul className="mt-3 space-y-2 text-sm font-extrabold">
            <li>
              <Link href={roomHref} className="text-[#2563EB] hover:underline">
                작업방
              </Link>
            </li>
            <li>
              <Link href={filesHref} className="text-[#2563EB] hover:underline">
                작업파일
              </Link>
            </li>
            <li>
              <Link href={`/mentor/custom-request/orders/${orderId}/waiting-review`} className="text-[#2563EB] hover:underline">
                진행관리
              </Link>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
