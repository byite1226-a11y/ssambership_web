import Link from "next/link";
import { customOrderLine, type MentorDashboardData } from "@/lib/home/mentorDashboardQueries";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import { friendlyPayoutLoadError, mentorNotifyLine } from "@/components/home/mentorDashboardDisplay";

function stateBanner(text: string, kind: "err" | "soft") {
  const cls = kind === "err" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-slate-200 bg-slate-50 text-slate-700";
  return <p className={`rounded-xl border p-2 text-sm ${cls}`}>{text}</p>;
}

export function MentorDashboardBody({ data }: { data: MentorDashboardData }) {
  const { rooms, connectedRoomCount, threadStats, payouts, customRecent, notifyProbe } = data;
  const roomErr = rooms.error;
  const customErr = customRecent.error;
  const payoutFriendly = friendlyPayoutLoadError(payouts.payoutError);

  return (
    <div className="space-y-4 text-sm text-slate-800">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">답변·처리 우선순위</h2>
        {roomErr ? stateBanner(`질문방: ${mapDataErrorMessage(String(roomErr))}`, "err") : null}
        {threadStats.error ? stateBanner(`질문·스레드: ${mapDataErrorMessage(String(threadStats.error))}`, "err") : null}
        <ul className="mt-2 list-inside list-disc text-slate-700">
          <li>답변 대기로 보이는 항목(추정): 약 {threadStats.mentorQueueEstimate}건</li>
          <li>열려 있는 질문·스레드(추정): {threadStats.openThreads}개</li>
          <li>연결된 질문방: {connectedRoomCount}곳</li>
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
        {payoutFriendly ? stateBanner(payoutFriendly, "err") : null}
        <p className="mt-1 text-slate-700">
          이번 달 합계(추정):{" "}
          {payouts.payoutTable
            ? `${(payouts.monthExpectedCents / 100).toLocaleString("ko-KR")}원`
            : "—"}
        </p>
        <p className="mt-2 text-xs text-slate-500">세부 내역·지급 일정은 [정산] 화면에서 확인해 주세요. 금액은 환경에 따라 달라질 수 있습니다.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">맞춤의뢰(최근)</h2>
        {customErr ? stateBanner(mapDataErrorMessage(String(customErr)), "err") : null}
        {customRecent.rows.length ? (
          <ul className="mt-2 list-inside list-decimal">
            {customRecent.rows.map((r, i) => (
              <li key={i} className="text-slate-800">
                {customOrderLine(r as Record<string, unknown>)}
              </li>
            ))}
          </ul>
        ) : !customErr ? (
          <p className="mt-2 text-slate-600">진행 중인 맞춤의뢰 주문이 없습니다.</p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">
          <Link href="/custom-request" className="font-medium text-blue-800 underline">
            맞춤의뢰
          </Link>
          에서 전체 흐름을 확인할 수 있습니다.
        </p>
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
          새 글 쓰기(멘토)
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">알림</h2>
        <p className="text-slate-700">{mentorNotifyLine(notifyProbe)}</p>
        <p className="mt-1 text-xs text-slate-500">앱 알림·읽음 처리는 단계적으로 제공될 수 있습니다.</p>
      </section>
    </div>
  );
}
