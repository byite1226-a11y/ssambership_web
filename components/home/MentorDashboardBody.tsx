import Link from "next/link";
import type { ReactNode } from "react";
import {
  customOrderLine,
  mentorCustomOrderWorkroomHref,
  type MentorDashboardData,
} from "@/lib/home/mentorDashboardQueries";

function stateBanner(text: string, kind: "err" | "soft") {
  const cls = kind === "err" ? "border-red-200 bg-red-50 text-red-950" : "border-slate-200 bg-slate-50 text-slate-700";
  return <p className={`rounded-xl border p-2.5 text-xs ${cls}`}>{text}</p>;
}

function notifyStatusKorean(status: MentorDashboardData["notifyProbe"]["status"]): string {
  if (status === "connected") return "있음";
  if (status === "empty") return "없음";
  return "준비 중";
}

function StatTile(props: { label: string; value: string; hint?: string; variant?: "default" | "blue" }) {
  const v = props.variant === "blue";
  return (
    <div
      className={`min-h-[6rem] flex flex-col justify-between rounded-2xl border p-5 transition-all shadow-sm ${
        v ? "border-blue-200 bg-gradient-to-br from-blue-50/50 to-white" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-bold tracking-wide text-slate-500">{props.label}</p>
      <p className="mt-1 min-w-0 break-words text-2xl font-black tabular-nums text-slate-900">{props.value}</p>
      {props.hint ? <p className="mt-1 text-xs text-slate-400">{props.hint}</p> : null}
    </div>
  );
}

function CtaButton(props: { href: string; children: ReactNode; tone: "blue" | "slate" | "amber" }) {
  const map = {
    blue: "min-h-[44px] border border-transparent bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 shadow-sm",
    slate: "min-h-[44px] border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
    amber: "min-h-[44px] border border-transparent bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-400 shadow-sm",
  } as const;
  return (
    <Link href={props.href} className={`inline-flex items-center justify-center rounded-xl transition-colors ${map[props.tone]}`}>
      {props.children}
    </Link>
  );
}

export function MentorDashboardBody({ data }: { data: MentorDashboardData }) {
  const { rooms, connectedRoomCount, threadStats, payouts, customRecent, notifyProbe } = data;
  const roomErr = rooms.error;
  const customErr = customRecent.error;
  const amountErr = Boolean(payouts.payoutError);
  const openThreads = threadStats.error ? "—" : String(threadStats.openThreads);
  const queue = threadStats.error ? "—" : String(threadStats.mentorQueueEstimate);
  const monthText = amountErr
    ? "—"
    : `${payouts.monthExpectedCents.toLocaleString("ko-KR")}원`;
  const customCount = customErr ? "—" : String(customRecent.rows.length);

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-sm text-slate-800 pb-12">
      {/* Dashboard Top Banner */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-wide text-blue-600">멘토 홈</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">오늘 처리할 일을 정리했어요</h1>
        <p className="mt-2 max-w-2xl text-slate-600 sm:text-base leading-relaxed">
          아래 숫자와 카드에서 요약을 확인하고, 버튼으로 각 메뉴로 이동할 수 있어요. 숫자가{" "}
          <span className="font-bold">—</span>이면 아직 데이터가 없거나 집계가 제한됐을 수 있어요.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <CtaButton href="/mentor/question-room" tone="blue">
            질문방 관리
          </CtaButton>
          <CtaButton href="/mentor/custom-request/dashboard" tone="slate">
            맞춤의뢰
          </CtaButton>
          <CtaButton href="/mentor/payouts" tone="slate">
            캐시·정산
          </CtaButton>
          <CtaButton href="/mentor/support/disputes" tone="amber">
            분쟁 현황
          </CtaButton>
          <CtaButton href="/mentor/profile" tone="slate">
            프로필 보기
          </CtaButton>
        </div>
      </section>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile
          label="답변 예정(추정)"
          value={queue}
          hint={threadStats.error ? "일시적으로 표시되지 않음" : "예상치"}
          variant="blue"
        />
        <StatTile label="진행 중 질문" value={openThreads} hint={threadStats.error ? "불러오지 못함" : "오픈 스레드"} />
        <StatTile
          label="연결 질문방"
          value={roomErr ? "—" : String(connectedRoomCount)}
          hint={roomErr ? "방 목록 제한" : "학생과 연결된 방"}
        />
        <StatTile
          label="이번 달 정산(예상)"
          value={monthText}
          hint={amountErr ? "정산 내역 없음" : "참고 금액"}
        />
        <StatTile label="최근 맞춤의뢰" value={customCount} hint={customErr ? "불러오지 못함" : "목록에 보이는 건수"} />
      </div>

      {/* Answer summary + empty state rail */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-extrabold text-slate-900">답변·처리 요약</h2>
            </div>
            {roomErr ? stateBanner("질문방 목록을 불러오는 데 문제가 있을 수 있어요.", "err") : null}
            {threadStats.error ? stateBanner("질문·스레드 집계에 제한이 있을 수 있어요.", "err") : null}
            <ul className="list-inside list-disc space-y-2 text-slate-700 sm:text-sm">
              <li>답변이 필요한 항목(추정): <span className="font-bold text-slate-900">{threadStats.mentorQueueEstimate}건</span></li>
              <li>집계한 질문방 {threadStats.roomsSampled}곳 · 진행 중 질문 {threadStats.openThreads}건</li>
              <li>학생과 연결된 질문방(단위) {connectedRoomCount}곳</li>
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-50 pt-4">
            <Link
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 hover:bg-blue-100 transition-colors"
              href="/mentor/question-room"
            >
              질문방 열기
            </Link>
            <Link
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              href="/mentor/payouts"
            >
              정산 상세
            </Link>
            <Link
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              href="/mentor/support/disputes"
              >
              분쟁 현황 보기
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">안내 사항</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              질문·의뢰·정산이 전부 0이면 괜찮아요. 아직 활동한 건이 없거나 새로운 요청을 기다리는 중이라는 뜻일 수 있어요.
            </p>
          </div>
          <div className="mt-4 text-xs text-slate-400 bg-white p-3 rounded-xl border border-slate-100">
            프로필을 완성하고 대표 콘텐츠를 등록하면 더 많은 학생들의 구독 및 질문 요청을 받을 수 있습니다.
          </div>
        </section>
      </div>

      {/* Expected payout + custom request lists */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">이번 달 정산(예상)</h2>
            {payouts.payoutError ? stateBanner("정산 정보를 불러오는 데 문제가 있어요.", "err") : null}
            <p className="mt-4 text-2xl font-black text-blue-600 sm:text-3xl">
              {amountErr ? "—" : `${payouts.monthExpectedCents.toLocaleString("ko-KR")}원`}
            </p>
            <p className="mt-2 break-words text-xs font-medium text-slate-400 bg-slate-50 p-3 rounded-xl max-w-full">
              {payouts.tableHint}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {payouts.subSummary.amountHint}
              {payouts.subSummary.error ? " · 구독·수익 요약을 모두 불러오지 못했을 수 있어요." : ""}
            </p>
          </div>
          <div className="mt-5 border-t border-slate-50 pt-4">
            <Link href="/mentor/payouts" className="text-sm font-bold text-blue-600 hover:underline">
              정산 관리 바로가기 →
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">최근 맞춤의뢰</h2>
            {customErr ? stateBanner("맞춤의뢰를 불러오는 데 제한이 있을 수 있어요.", "err") : null}
            {customRecent.rows.length ? (
              <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-slate-800">
                {customRecent.rows.map((r, i) => {
                  const row = r as Record<string, unknown>;
                  const oid = typeof row.id === "string" && row.id.trim() ? row.id.trim() : null;
                  const line = customOrderLine(row, customRecent.activeDisputeOrderIds);
                  return (
                    <li key={oid ?? i} className="text-sm break-words">
                      {oid ? (
                        <Link
                          className="font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                          href={mentorCustomOrderWorkroomHref(oid)}
                        >
                          {line}
                        </Link>
                      ) : (
                        <span className="font-medium">{line}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : !customErr ? (
              <p className="mt-3 text-slate-500 text-sm">최근 맞춤의뢰가 없어요. 기록이 쌓이면 여기에 뜰 거예요.</p>
            ) : null}
            <p className="mt-3 text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
              주문 목록 또는 맞춤의뢰 홈에서 모든 작업 상황을 한눈에 관리하세요.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-50 pt-4">
            <CtaButton href="/mentor/custom-request/orders" tone="blue">
              주문 목록
            </CtaButton>
            <CtaButton href="/mentor/custom-request/dashboard" tone="slate">
              맞춤의뢰 홈
            </CtaButton>
          </div>
        </section>
      </div>

      {/* Profile/Channel and Community entries */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">프로필 및 채널</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm text-center"
              href="/mentor/profile"
            >
              <span className="text-xs font-bold text-slate-700">멘토 프로필</span>
            </Link>
            <Link
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm text-center"
              href="/mentor/profile/edit"
            >
              <span className="text-xs font-bold text-slate-700">프로필 편집</span>
            </Link>
            <Link
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm text-center"
              href="/mentor/channel"
            >
              <span className="text-xs font-bold text-slate-700">채널 관리</span>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">커뮤니티 활동</h2>
          <div className="flex flex-col h-[calc(100%-48px)] justify-between">
            <p className="text-sm leading-relaxed text-slate-600">
              커뮤니티에 글이나 숏폼을 작성하여 학생들에게 지식을 공유하고 더 많은 수강생을 확보할 수 있습니다.
            </p>
            <div className="mt-4 border-t border-slate-50 pt-4">
              <Link
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                href="/mentor/community/new"
              >
                새 글 쓰기
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Notifications */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6">
        <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-200/60 pb-3 mb-3">알림 센터</h2>
        <p className="min-w-0 text-sm font-semibold text-slate-700 leading-relaxed break-words">
          <span className="text-slate-500">{notifyProbe.label}</span> · {notifyProbe.detail}{" "}
          <span className="whitespace-nowrap text-slate-500">({notifyStatusKorean(notifyProbe.status)})</span>
        </p>
        <p className="mt-2 text-xs text-slate-400 bg-white p-3 rounded-xl border border-slate-100">
          시스템 알림 및 학생과의 중요 업데이트 소식을 실시간으로 확인할 수 있는 공간입니다.
        </p>
      </section>
    </div>
  );
}
