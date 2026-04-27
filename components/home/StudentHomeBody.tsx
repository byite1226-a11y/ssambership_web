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

export function StudentHomeBody({ data }: { data: StudentHomeData }) {
  const { mypage, rooms, threadStats, subscriptionLines, recentPayments, weeklyQuotaHint } = data;
  const roomErr = rooms.error;
  const subErr = subscriptionLines.error;
  const payErr = recentPayments.error;
  const threadErr = threadStats.error;

  const todayItems: string[] = [];
  if (roomErr) {
    todayItems.push(`질문방 room 목록 조회에 문제: ${roomErr}`);
  } else if ((rooms.rows?.length ?? 0) === 0) {
    todayItems.push("멘토를 찾아 첫 질문을 시작하세요. `/mentors` 또는 구독·질문방으로 이동.");
  } else {
    todayItems.push(`질문방 ${rooms.rows.length}곳 — 열린 스레드(추정) ${threadStats.openThreads}개`);
  }
  if (threadErr) {
    todayItems.push(`스레드 집계: ${threadErr}`);
  }
  if (mypage.payments.status === "skeleton") {
    todayItems.push("결제/구독 테이블이 아직 읽기 어렵습니다(스키마·RLS).");
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
        <h2 className="text-sm font-extrabold text-slate-900">구독 중 멘토(요약)</h2>
        {subErr ? stateBanner(`subscriptions: ${subErr}`, "err") : null}
        <p className="mt-1 text-xs text-slate-500">소스: {subscriptionLines.probe}</p>
        {subscriptionLines.lines.length ? (
          <ul className="mt-2 space-y-1">
            {subscriptionLines.lines.slice(0, 6).map((line) => (
              <li key={String((line.row as Row).id ?? line.mentorId)} className="text-slate-800">
                <span className="font-bold">{line.mentorName}</span>
                {line.mentorId ? (
                  <span className="text-slate-500"> · {line.mentorId.slice(0, 8)}…</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : !subErr ? (
          stateBanner("아직 구독 행이 없거나(0건) 스키마에 멘토·학생 FK가 없습니다.", "soft")
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">남은 질문·스레드</h2>
        <p className="mt-1 text-slate-700">플랜(주간 한도·표기): {weeklyQuotaHint}</p>
        <p className="mt-1 text-slate-700">
          진행 중 스레드(휴리스틱): {threadStats.openThreads} · room 샘플 {threadStats.roomsSampled}개
        </p>
        {threadErr ? stateBanner(threadErr, "err") : null}
        {mypage.subscriptions.status === "skeleton" && stateBanner(mypage.subscriptions.detail, "soft")}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-slate-900">최근 질문방</h2>
        {roomErr ? stateBanner(roomErr, "err") : null}
        {rooms.rows?.length ? (
          <ul className="mt-2 space-y-2">
            {rooms.rows.slice(0, 5).map((r) => {
              const id = typeof r.id === "string" ? r.id : null;
              if (!id) return null;
              const t = (r as Row).updated_at != null ? String((r as Row).updated_at) : String((r as Row).created_at ?? "");
              return (
                <li key={id}>
                  <Link href={`/question-room/${id}`} className="font-bold text-blue-800 underline">
                    room {id.slice(0, 8)}…
                  </Link>{" "}
                  <span className="text-xs text-slate-500">{t ? t.slice(0, 10) : ""}</span>
                </li>
              );
            })}
          </ul>
        ) : !roomErr ? (
          <p className="mt-2 text-slate-600">질문방 empty — 멘토 구독 후 room이 생깁니다.</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">최근 결제·구독(결제 row)</h2>
        {payErr ? stateBanner(payErr, "err") : null}
        <p className="text-xs text-slate-500">소스: {recentPayments.probe}</p>
        {recentPayments.rows.length ? (
          <ul className="mt-2 list-inside list-decimal text-slate-800">
            {recentPayments.rows.map((r, i) => (
              <li key={i}>{paymentRowLabel(r as Row)}</li>
            ))}
          </ul>
        ) : !payErr ? (
          <p className="mt-2 text-slate-600">결제·주문 row empty(또는 학생 FK 경로 없음)</p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">구독 count: {mypage.subscriptions.valueText} — {mypage.subscriptions.detail}</p>
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
          알림(notifications) count: {mypage.notifications.valueText} — {mypage.notifications.status}{" "}
          {mypage.notifications.detail}
        </p>
        {mypage.notifications.status === "skeleton" && stateBanner("알림: 전용 목록·실시간은 후속(연결 포인트만)", "soft")}
      </section>
    </div>
  );
}
