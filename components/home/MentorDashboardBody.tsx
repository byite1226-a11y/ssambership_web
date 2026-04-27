import Link from "next/link";
import { customOrderLine, type MentorDashboardData } from "@/lib/home/mentorDashboardQueries";

function stateBanner(text: string, kind: "err" | "soft") {
  const cls = kind === "err" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-slate-200 bg-slate-50 text-slate-700";
  return <p className={`rounded-xl border p-2 text-sm ${cls}`}>{text}</p>;
}

export function MentorDashboardBody({ data }: { data: MentorDashboardData }) {
  const { rooms, connectedRoomCount, threadStats, payouts, customRecent, notifyProbe } = data;
  const roomErr = rooms.error;
  const customErr = customRecent.error;

  return (
    <div className="space-y-4 text-sm text-slate-800">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">답변·처리 우선순위</h2>
        {roomErr ? stateBanner(`room: ${roomErr}`, "err") : null}
        {threadStats.error ? stateBanner(`thread: ${threadStats.error}`, "err") : null}
        <ul className="mt-2 list-inside list-disc text-slate-700">
          <li>오늘 답변/처리(추정 큐): {threadStats.mentorQueueEstimate}건</li>
          <li>room 기준 샘플 {threadStats.roomsSampled}곳, 열린 스레드(추정) {threadStats.openThreads}개</li>
          <li>연결 room(학생·과제 단위) {connectedRoomCount}곳</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-900"
            href="/mentor/question-room"
          >
            질문방 관리
          </Link>
          <Link className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold" href="/mentor/payouts">
            정산
          </Link>
          <Link className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold" href="/mentor/support/disputes">
            분쟁
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">이번 달 정산(예상)</h2>
        {payouts.payoutError ? stateBanner(payouts.payoutError, "err") : null}
        <p className="mt-1 text-slate-700">payouts:{payouts.payoutTable ?? "—"}</p>
        <p className="text-slate-700">이번 달 합(추정, cents/원 혼재 가능): {payouts.monthExpectedCents}</p>
        <p className="text-xs text-slate-500">{payouts.tableHint}</p>
        <p className="mt-1 text-xs text-slate-500">
          {payouts.subSummary.amountHint} {payouts.subSummary.error ? `· ${payouts.subSummary.error}` : ""}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">맞춤의뢰(최근)</h2>
        {customErr ? stateBanner(customErr, "err") : null}
        <p className="text-xs text-slate-500">소스: {customRecent.probe}</p>
        {customRecent.rows.length ? (
          <ul className="mt-2 list-inside list-decimal">
            {customRecent.rows.map((r, i) => (
              <li key={i} className="text-slate-800">
                {customOrderLine(r as Record<string, unknown>)}
              </li>
            ))}
          </ul>
        ) : !customErr ? (
          <p className="mt-2 text-slate-600">맞춤의뢰 주문 empty 또는 mentor FK 없음</p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">{payouts.customSummary.amountHint}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">프로필·채널</h2>
        <ul className="mt-1 flex flex-wrap gap-2 text-blue-800">
          <li>
            <Link className="underline" href="/mentor/profile">
              멘토 프로필
            </Link>
          </li>
          <li>
            <Link className="underline" href="/mentor/profile/edit">
              프로필 편집
            </Link>
          </li>
          <li>
            <Link className="underline" href="/mentor/channel">
              채널
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">커뮤니티</h2>
        <Link className="text-blue-800 underline" href="/mentor/community/new">
          새 글/작성(멘토)
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">알림(포인트)</h2>
        <p className="text-slate-700">
          {notifyProbe.label}: {notifyProbe.detail}{" "}
          <span className="text-xs text-slate-500">({notifyProbe.status})</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">알림 전용 목록·푸시·실시간 갱신은 후속</p>
      </section>
    </div>
  );
}
