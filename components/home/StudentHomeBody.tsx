import Link from "next/link";
import { type StudentHomeData, paymentRowLabel } from "@/lib/home/studentHomeQueries";

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

function formatActivityDate(raw: string): string {
  const d = raw.slice(0, 10);
  return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.replace(/-/g, ".") : "";
}

export function StudentHomeBody({ data }: { data: StudentHomeData }) {
  const { mypage, rooms, threadStats, subscriptionLines, recentPayments, weeklyQuotaHint } = data;
  const roomErr = rooms.error;
  const subErr = subscriptionLines.error;
  const payErr = recentPayments.error;
  const threadErr = threadStats.error;

  const todayItems: string[] = [];
  if (roomErr) {
    todayItems.push("질문방 목록을 불러오는 데 문제가 있어요. 잠시 후 다시 시도해 주세요.");
  } else if ((rooms.rows?.length ?? 0) === 0) {
    todayItems.push("멘토를 찾아 첫 질문을 시작해 보세요. 멘토 찾기·구독·질문방으로 이동할 수 있어요.");
  } else {
    todayItems.push(`질문방 ${rooms.rows.length}곳 · 답변을 기다리는 질문 ${threadStats.openThreads}건`);
  }
  if (threadErr) {
    todayItems.push("진행 중인 질문을 집계하는 데 문제가 있어요.");
  }
  if (mypage.payments.status === "skeleton") {
    todayItems.push("결제·구독 정보를 아직 불러오지 못했어요.");
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
          <Link className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold" href="/mentors">
            멘토·구독
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">구독 중인 멘토</h2>
        {subErr ? stateBanner("구독 정보를 불러오는 데 문제가 있어요.", "err") : null}
        {subscriptionLines.lines.length ? (
          <ul className="mt-2 space-y-1">
            {subscriptionLines.lines.slice(0, 6).map((line) => (
              <li key={String((line.row as Row).id ?? line.mentorId)} className="text-slate-800">
                <span className="font-bold">{line.mentorName}</span>
              </li>
            ))}
          </ul>
        ) : !subErr ? (
          stateBanner("아직 구독 중인 멘토가 없어요. 멘토를 찾아 구독을 시작해 보세요.", "soft")
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">남은 질문·스레드</h2>
        <p className="mt-1 text-slate-700">질문 한도(플랜): {weeklyQuotaHint}</p>
        <p className="mt-1 text-slate-700">
          답변을 기다리는 질문 {threadStats.openThreads}건 · {threadStats.roomsSampled}곳에서 집계했어요
        </p>
        {threadErr ? stateBanner("진행 중인 질문을 집계하는 데 문제가 있어요.", "err") : null}
        {mypage.subscriptions.status === "skeleton" && stateBanner(mypage.subscriptions.detail, "soft")}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">최근 질문방</h2>
        {roomErr ? stateBanner("질문방 목록을 불러오는 데 문제가 있어요.", "err") : null}
        {rooms.rows?.length ? (
          <ul className="mt-2 space-y-2">
            {rooms.rows.slice(0, 5).map((r, idx) => {
              const id = typeof r.id === "string" ? r.id : null;
              if (!id) return null;
              const t = (r as Row).updated_at != null ? String((r as Row).updated_at) : String((r as Row).created_at ?? "");
              const dateLabel = formatActivityDate(t);
              return (
                <li key={id}>
                  <Link href={`/question-room/${id}`} className="font-bold text-blue-800 underline">
                    질문방 {idx + 1}
                    {dateLabel ? ` · 활동 ${dateLabel}` : ""}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : !roomErr ? (
          <p className="mt-2 text-slate-600">아직 열린 질문방이 없어요. 멘토를 구독하면 대화 방이 생겨요.</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">최근 결제·구독</h2>
        {payErr ? stateBanner("결제 내역을 불러오는 데 문제가 있어요.", "err") : null}
        {recentPayments.rows.length ? (
          <ul className="mt-2 list-inside list-decimal text-slate-800">
            {recentPayments.rows.map((r, i) => (
              <li key={i}>{paymentRowLabel(r as Row)}</li>
            ))}
          </ul>
        ) : !payErr ? (
          <p className="mt-2 text-slate-600">최근 결제·주문이 없어요.</p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">
          구독·결제: {mypage.subscriptions.valueText}건 · {mypage.payments.valueText}건
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">지금 갈 수 있는 곳</h2>
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
              캐시 충전(지갑)
            </Link>
          </li>
          <li>
            <Link className="underline" href="/wallet/ledger">
              캐시 원장(내역)
            </Link>
          </li>
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          알림{" "}
          {mypage.notifications.valueText === "—" ? "확인 중" : `${mypage.notifications.valueText}건`} —{" "}
          {mypage.notifications.detail}
        </p>
        {mypage.notifications.status === "skeleton" && stateBanner("알림 목록은 앱·마이페이지에서 곧 이어갈 수 있어요.", "soft")}
      </section>
    </div>
  );
}
