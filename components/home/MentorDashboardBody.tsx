import Link from "next/link";
import type { ReactNode } from "react";
import {
  customOrderLine,
  mentorCustomOrderWorkroomHref,
  type MentorDashboardData,
} from "@/lib/home/mentorDashboardQueries";

function stateBanner(text: string, kind: "err" | "soft") {
  const cls = kind === "err" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-slate-200 bg-slate-50 text-slate-700";
  return <p className={`rounded-xl border p-2 text-sm ${cls}`}>{text}</p>;
}

function notifyStatusKorean(status: MentorDashboardData["notifyProbe"]["status"]): string {
  if (status === "connected") return "있음";
  if (status === "empty") return "없음";
  return "준비 중";
}

function StatTile(props: { label: string; value: string; hint?: string; variant?: "default" | "emerald" }) {
  const v = props.variant === "emerald";
  return (
    <div
      className={`min-h-[5.5rem] rounded-2xl border p-4 shadow-sm ${
        v ? "border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{props.label}</p>
      <p className="mt-1.5 text-2xl font-black tabular-nums text-slate-900">{props.value}</p>
      {props.hint ? <p className="mt-0.5 text-xs text-slate-500">{props.hint}</p> : null}
    </div>
  );
}

function CtaButton(props: { href: string; children: ReactNode; tone: "emerald" | "slate" | "amber" }) {
  const map = {
    emerald: "min-h-[44px] border border-emerald-200 bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500",
    slate: "min-h-[44px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50",
    amber: "min-h-[44px] border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100",
  } as const;
  return (
    <Link href={props.href} className={`inline-flex items-center justify-center rounded-xl ${map[props.tone]}`}>
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
    <div className="space-y-6 text-sm text-slate-800">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">멘토 대시보드</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">오늘 처리할 일을 정리했어요</h1>
        <p className="mt-2 max-w-2xl text-slate-600 sm:text-base">
          질문·맞춤의뢰·정산으로 바로 갈 수 있어요. 숫자가 <span className="font-bold">—</span>이면 집계가 제한됐거나 데이터가
          아직 없을 수 있어요.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CtaButton href="/mentor/question-room" tone="emerald">
            질문방 관리
          </CtaButton>
          <CtaButton href="/mentor/custom-request/dashboard" tone="slate">
            맞춤의뢰
          </CtaButton>
          <CtaButton href="/mentor/payouts" tone="slate">
            캐시·정산
          </CtaButton>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <CtaButton href="/mentor/support/disputes" tone="amber">
            분쟁·환불
          </CtaButton>
          <CtaButton href="/mentor/profile" tone="slate">
            프로필
          </CtaButton>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatTile
          label="답변 예정(추정)"
          value={queue}
          hint={threadStats.error ? "일시적으로 표시되지 않을 수 있어요" : "예상치"}
          variant="emerald"
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
          hint={amountErr ? "정산 정보를 불러오지 못했어요" : "참고 금액"}
        />
        <StatTile label="최근 맞춤의뢰" value={customCount} hint={customErr ? "불러오지 못함" : "목록에 보이는 건수"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
          <h2 className="text-base font-extrabold text-slate-900">답변·처리 요약</h2>
          {roomErr ? stateBanner("질문방 목록을 불러오는 데 문제가 있을 수 있어요.", "err") : null}
          {threadStats.error ? stateBanner("질문·스레드 집계에 제한이 있을 수 있어요.", "err") : null}
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-slate-700 sm:text-sm">
            <li>답변이 필요한 항목(추정): {threadStats.mentorQueueEstimate}건</li>
            <li>집계한 질문방 {threadStats.roomsSampled}곳 · 진행 중인 질문 {threadStats.openThreads}건</li>
            <li>학생과 연결된 질문방(단위) {connectedRoomCount}곳</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Link
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-900"
              href="/mentor/question-room"
            >
              질문방 열기
            </Link>
            <Link
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold"
              href="/mentor/payouts"
            >
              정산 상세
            </Link>
            <Link
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold"
              href="/mentor/support/disputes"
            >
              분쟁
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 sm:p-5">
          <h2 className="text-base font-extrabold text-slate-900">빈 상태 안내</h2>
          <p className="mt-2 text-sm text-slate-600">질문·의뢰·정산이 전부 0이면 괜찮아요. 아직 열린 건이 없다는 뜻일 수 있어요.</p>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
          <h2 className="text-base font-extrabold text-slate-900">이번 달 정산(예상)</h2>
          {payouts.payoutError ? stateBanner("정산 정보를 불러오는 데 문제가 있어요.", "err") : null}
          <p className="mt-2 text-lg font-black text-slate-900 sm:text-xl">{amountErr ? "—" : `${payouts.monthExpectedCents.toLocaleString("ko-KR")}원`}</p>
          <p className="mt-1 text-xs text-slate-500">{payouts.tableHint}</p>
          <p className="mt-1 text-xs text-slate-500">
            {payouts.subSummary.amountHint}
            {payouts.subSummary.error ? " · 구독·수익 요약을 모두 불러오지 못했을 수 있어요." : ""}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-extrabold text-slate-900">맞춤의뢰(최근)</h2>
          {customErr ? stateBanner("맞춤의뢰를 불러오는 데 제한이 있을 수 있어요.", "err") : null}
          {customRecent.rows.length ? (
            <ol className="mt-2 list-decimal space-y-2 pl-4 text-slate-800 sm:pl-5">
              {customRecent.rows.map((r, i) => {
                const row = r as Record<string, unknown>;
                const oid = typeof row.id === "string" && row.id.trim() ? row.id.trim() : null;
                const line = customOrderLine(row, customRecent.activeDisputeOrderIds);
                return (
                  <li key={oid ?? i}>
                    {oid ? (
                      <Link className="font-bold text-blue-800 underline hover:text-blue-950" href={mentorCustomOrderWorkroomHref(oid)}>
                        {line}
                      </Link>
                    ) : (
                      line
                    )}
                  </li>
                );
              })}
            </ol>
          ) : !customErr ? (
            <p className="mt-2 text-slate-600">최근 맞춤의뢰가 없어요. 기록이 쌓이면 여기에 뜰 거예요.</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">주문 목록·맞춤의뢰 홈에서 전체 흐름을 이어가요.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CtaButton href="/mentor/custom-request/orders" tone="emerald">
              주문 목록
            </CtaButton>
            <CtaButton href="/mentor/custom-request/dashboard" tone="slate">
              맞춤의뢰 홈
            </CtaButton>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-extrabold text-slate-900">프로필·채널</h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <Link className="min-h-[40px] text-sm font-bold text-blue-800 underline" href="/mentor/profile">
                멘토 프로필
              </Link>
            </li>
            <li>
              <Link className="min-h-[40px] text-sm font-bold text-blue-800 underline" href="/mentor/profile/edit">
                프로필 편집
              </Link>
            </li>
            <li>
              <Link className="min-h-[40px] text-sm font-bold text-blue-800 underline" href="/mentor/channel">
                채널
              </Link>
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
          <h2 className="text-base font-extrabold text-slate-900">커뮤니티</h2>
          <Link
            className="mt-2 inline-flex min-h-[44px] items-center font-bold text-blue-800 underline"
            href="/mentor/community/new"
          >
            새 글 쓰기(멘토)
          </Link>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
        <h2 className="text-base font-extrabold text-slate-900">알림</h2>
        <p className="mt-1 text-slate-700 sm:text-sm">
          {notifyProbe.label}: {notifyProbe.detail} ({notifyStatusKorean(notifyProbe.status)})
        </p>
        <p className="mt-1 text-xs text-slate-500">집알림·푸시(준비 중)와 연동되면 이 영역이 확장돼요.</p>
      </section>
    </div>
  );
}
