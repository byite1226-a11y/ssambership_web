import Link from "next/link";
import { type StudentHomeData, paymentRowLabel } from "@/lib/home/studentHomeQueries";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import { studentMypageKorean } from "@/components/home/studentHomeDisplay";

type Row = Record<string, unknown>;

function stateBanner(text: string, kind: "err" | "ok" | "soft") {
  const cls =
    kind === "err"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : kind === "ok"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-slate-200 bg-slate-50 text-slate-700";
  return <p className={`rounded-xl border p-2 text-sm ${cls}`}>{text}</p>;
}

export function StudentHomeBody({ data }: { data: StudentHomeData }) {
  const { mypage, rooms, threadStats, subscriptionLines, recentPayments, weeklyQuotaHint } = data;
  const roomErr = rooms.error;
  const subErr = subscriptionLines.error;
  const payErr = recentPayments.error;
  const threadErr = threadStats.error;

  const todayItems: string[] = [];
  if (roomErr) {
    todayItems.push(`질문방을 불러오지 못했습니다. ${mapDataErrorMessage(String(roomErr))}`);
  } else if ((rooms.rows?.length ?? 0) === 0) {
    todayItems.push("멘토를 구독하거나 찾은 뒤, 첫 질문방을 열어 보세요.");
  } else {
    todayItems.push(
      `질문방 ${rooms.rows.length}곳이 연결되어 있고, 열려 있는 질문·스레드는 약 ${threadStats.openThreads}개로 보입니다.`
    );
  }
  if (threadErr) {
    todayItems.push(`질문·스레드 요약: ${mapDataErrorMessage(String(threadErr))}`);
  }
  if (mypage.payments.status === "skeleton") {
    todayItems.push("결제·주문 요약을 아직 가져오지 못했습니다. [지갑]·[구독]에서 확인해 주세요.");
  }

  return (
    <div className="space-y-4 text-sm text-slate-800">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">오늘 할 일 / 빠른 시작</h2>
        <ul className="mt-2 list-inside list-disc text-slate-700">
          {todayItems.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-900" href="/question-room">
            질문방
          </Link>
          <Link className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold" href="/mentors">
            멘토 찾기
          </Link>
          <Link className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold" href="/subscriptions">
            구독
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">구독 중인 멘토(요약)</h2>
        {subErr ? stateBanner(`구독 정보: ${mapDataErrorMessage(String(subErr))}`, "err") : null}
        {subscriptionLines.lines.length ? (
          <ul className="mt-2 space-y-1">
            {subscriptionLines.lines.slice(0, 6).map((line) => (
              <li key={String((line.row as Row).id ?? line.mentorId)} className="text-slate-800">
                <span className="font-bold">{line.mentorName}</span>
                {line.mentorId ? <span className="text-slate-500"> · {line.mentorId.slice(0, 8)}…</span> : null}
              </li>
            ))}
          </ul>
        ) : !subErr ? (
          stateBanner("아직 구독 중인 멘토가 없습니다.", "soft")
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">질문 한도·진행</h2>
        <p className="mt-1 text-slate-700">플랜: {weeklyQuotaHint}</p>
        <p className="mt-1 text-slate-700">진행 중인 질문(추정): {threadStats.openThreads}개</p>
        {threadErr ? stateBanner(mapDataErrorMessage(String(threadErr)), "err") : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">최근 질문방</h2>
        {roomErr ? stateBanner(mapDataErrorMessage(String(roomErr)), "err") : null}
        {rooms.rows?.length ? (
          <ul className="mt-2 space-y-2">
            {rooms.rows.slice(0, 5).map((r) => {
              const id = typeof r.id === "string" ? r.id : null;
              if (!id) return null;
              const t = (r as Row).updated_at != null ? String((r as Row).updated_at) : String((r as Row).created_at ?? "");
              return (
                <li key={id}>
                  <Link href={`/question-room/${id}`} className="font-bold text-blue-800 underline">
                    질문방 {id.slice(0, 8)}…
                  </Link>{" "}
                  <span className="text-xs text-slate-500">{t ? t.slice(0, 10) : ""}</span>
                </li>
              );
            })}
          </ul>
        ) : !roomErr ? (
          <p className="mt-2 text-slate-600">아직 열린 질문방이 없습니다. 멘토를 구독하거나 [질문방]에서 시작해 보세요.</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">최근 결제</h2>
        {payErr ? stateBanner(`결제: ${mapDataErrorMessage(String(payErr))}`, "err") : null}
        {recentPayments.rows.length ? (
          <ul className="mt-2 list-inside list-decimal text-slate-800">
            {recentPayments.rows.map((r, i) => (
              <li key={i}>{paymentRowLabel(r as Row)}</li>
            ))}
          </ul>
        ) : !payErr ? (
          <p className="mt-2 text-slate-600">최근 결제·주문이 없습니다.</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">바로 가기</h2>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2 text-blue-800">
          <li>
            <Link className="underline" href="/community">
              커뮤니티
            </Link>
          </li>
          <li>
            <Link className="underline" href="/custom-request">
              맞춤의뢰
            </Link>
          </li>
          <li>
            <Link className="underline" href="/wallet/charge">
              캐시 충전
            </Link>
          </li>
          <li>
            <Link className="underline" href="/wallet/ledger">
              캐시 내역
            </Link>
          </li>
        </ul>
        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
          <p>구독(요약): {studentMypageKorean(mypage.subscriptions, "subscriptions")}</p>
          <p>결제(요약): {studentMypageKorean(mypage.payments, "payments")}</p>
          <p>알림(요약): {studentMypageKorean(mypage.notifications, "notifications")}</p>
        </div>
      </section>
    </div>
  );
}
