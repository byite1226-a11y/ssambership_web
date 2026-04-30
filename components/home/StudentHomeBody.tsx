import Link from "next/link";
import type { ReactNode } from "react";
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

function StatTile(props: {
  label: string;
  value: string;
  hint?: string;
  variant?: "default" | "accent";
}) {
  const v = props.variant === "accent";
  return (
    <div
      className={`min-h-[5.5rem] rounded-2xl border p-4 shadow-sm ${
        v ? "border-blue-200 bg-gradient-to-br from-blue-50/90 to-white" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{props.label}</p>
      <p className="mt-1.5 text-2xl font-black tabular-nums text-slate-900">{props.value}</p>
      {props.hint ? <p className="mt-0.5 text-xs text-slate-500">{props.hint}</p> : null}
    </div>
  );
}

function CtaPill(props: { href: string; children: ReactNode; variant: "primary" | "secondary" | "slate" }) {
  const cls =
    props.variant === "primary"
      ? "min-h-[44px] border border-blue-200 bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
      : props.variant === "secondary"
        ? "min-h-[44px] border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-900 hover:bg-blue-100"
        : "min-h-[44px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50";
  return (
    <Link href={props.href} className={`inline-flex items-center justify-center rounded-xl ${cls}`}>
      {props.children}
    </Link>
  );
}

export function StudentHomeBody({ data }: { data: StudentHomeData }) {
  const { mypage, rooms, threadStats, subscriptionLines, recentPayments, weeklyQuotaHint } = data;
  const roomErr = rooms.error;
  const subErr = subscriptionLines.error;
  const payErr = recentPayments.error;
  const threadErr = threadStats.error;
  const profile = mypage.profile;
  const firstName = (profile?.nickname ?? profile?.full_name ?? "").trim() || "학생";
  const roomCount = rooms.rows?.length ?? 0;
  const subCountLabel = mypage.subscriptions.valueText;
  const payCountLabel = mypage.payments.valueText;
  const notifLabel = mypage.notifications.valueText;

  return (
    <div className="space-y-6 text-sm text-slate-800">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">오늘의 홈</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">안녕하세요, {firstName}님</h1>
        <p className="mt-2 max-w-2xl text-slate-600 sm:text-base">
          질문·구독·결제·의뢰 흐름을 한눈에 볼 수 있어요. 데이터가 아직 없는 항목은 <span className="font-bold">준비 중</span> 또는{" "}
          <span className="font-bold">표시할 내용이 없을 때</span> 안내만 떠요.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CtaPill href="/question-room" variant="primary">
            질문방
          </CtaPill>
          <CtaPill href="/mentors" variant="secondary">
            멘토 찾기
          </CtaPill>
          <CtaPill href="/mentors" variant="slate">
            멘토·구독
          </CtaPill>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatTile
          label="질문방"
          value={roomErr ? "—" : String(roomCount)}
          hint={roomErr ? "불러오지 못함" : "연결된 대화 방"}
          variant="accent"
        />
        <StatTile
          label="답변 대기 질문"
          value={threadErr ? "—" : String(threadStats.openThreads)}
          hint={threadErr ? "일시적으로 표시되지 않을 수 있어요" : "진행 중인 질문(추정)"}
        />
        <StatTile label="구독(건)" value={subCountLabel} hint={mypage.subscriptions.detail} />
        <StatTile label="결제(건)" value={payCountLabel} hint={mypage.payments.detail} />
        <StatTile
          label="알림"
          value={notifLabel}
          hint={mypage.notifications.status === "skeleton" ? "알림 정보를 준비 중입니다" : mypage.notifications.detail}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
          <h2 className="text-base font-extrabold text-slate-900">최근 활동</h2>
          <p className="mt-1 text-xs text-slate-500">질문방 이동과 최근 결제 한 줄(데이터가 있을 때)</p>
          {roomErr || payErr ? (
            <p className="mt-2 text-amber-900">일부를 불러오지 못했을 수 있어요.</p>
          ) : null}
          <ul className="mt-3 space-y-2">
            {rooms.rows?.length
              ? rooms.rows.slice(0, 3).map((r, idx) => {
                  const id = typeof r.id === "string" ? r.id : null;
                  if (!id) return null;
                  const t = (r as Row).updated_at != null ? String((r as Row).updated_at) : String((r as Row).created_at ?? "");
                  const dateLabel = formatActivityDate(t);
                  return (
                    <li key={id} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-bold text-slate-800">질문방 {idx + 1}</span>
                      {dateLabel ? <span className="text-xs text-slate-500">활동 {dateLabel}</span> : null}
                      <Link className="text-sm font-bold text-blue-700 underline" href={`/question-room/${id}`}>
                        열기
                      </Link>
                    </li>
                  );
                })
              : !roomErr ? (
                  <li className="text-slate-600">표시할 최근 질문방이 없어요. 멘토를 구독하면 방이 열려요.</li>
                ) : null}
            {recentPayments.rows.length
              ? recentPayments.rows.map((r, i) => (
                  <li key={i} className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-slate-800">
                    {paymentRowLabel(r as Row)}
                  </li>
                ))
              : !payErr ? (
                  <li className="text-slate-600">표시할 최근 결제가 없어요.</li>
                ) : null}
            {!roomErr && !rooms.rows?.length && !payErr && recentPayments.rows.length === 0 ? (
              <li className="text-slate-600">최근 활동을 아직 쌓지 못했어요. 질문방이나 멘토 찾기로 시작해 보세요.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 sm:p-5">
          <h2 className="text-base font-extrabold text-slate-900">공지·이벤트</h2>
          <p className="mt-2 text-sm text-slate-600">이 영역에 공지를 표시하는 기능은 준비 중이에요.</p>
          <p className="mt-2 text-xs text-slate-500">이벤트·프로모션은 추후 연결될 수 있어요.</p>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-base font-extrabold text-slate-900">지금 둘러볼 멘토</h2>
          <Link
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-slate-900 px-3 text-sm font-bold text-white"
            href="/mentors"
          >
            멘토 찾기로 이동
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-600">추천 알고리즘·개인화는 아직 붙이지 않았어요. 목록에서 골라보시면 돼요.</p>
        {subErr ? stateBanner("멘토 정보를 일부만 불러왔을 수 있어요.", "err") : null}
        {subscriptionLines.lines.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {subscriptionLines.lines.slice(0, 4).map((line) => (
              <li
                key={String((line.row as Row).id ?? line.mentorId)}
                className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 font-bold text-emerald-950"
              >
                {line.mentorName}
              </li>
            ))}
          </ul>
        ) : !subErr ? (
          <p className="mt-3 text-sm text-slate-600">구독·연결된 멘토가 아직 없어요. 위 버튼으로 탐색해 보세요.</p>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
          <h2 className="text-base font-extrabold text-slate-900">답변 대기·질문 한도</h2>
          <p className="mt-1 text-sm text-slate-700">질문 한도(플랜): {weeklyQuotaHint}</p>
          <p className="mt-1 text-sm text-slate-700">
            답변을 기다리는 질문 {threadErr ? "—" : String(threadStats.openThreads)}건 · 질문방{" "}
            {threadErr ? "—" : String(threadStats.roomsSampled)}곳 기준
          </p>
          {threadErr ? stateBanner("진행 중인 질문 수를 불러오는 데 제한이 있을 수 있어요.", "err") : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-extrabold text-slate-900">질문방 바로가기</h2>
          {roomErr ? stateBanner("질문방 목록을 불러오는 데 문제가 있어요.", "err") : null}
          {rooms.rows?.length ? (
            <ul className="mt-3 space-y-2">
              {rooms.rows.slice(0, 5).map((r, idx) => {
                const id = typeof r.id === "string" ? r.id : null;
                if (!id) return null;
                const t = (r as Row).updated_at != null ? String((r as Row).updated_at) : String((r as Row).created_at ?? "");
                const dateLabel = formatActivityDate(t);
                return (
                  <li key={id}>
                    <Link
                      className="inline-flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-blue-800 hover:bg-slate-100"
                      href={`/question-room/${id}`}
                    >
                      <span>질문방 {idx + 1}</span>
                      {dateLabel ? <span className="text-xs font-medium text-slate-500">활동 {dateLabel}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : !roomErr ? (
            <p className="mt-3 text-sm text-slate-600">열린 질문방이 없어요. 멘토를 구독하면 생겨요.</p>
          ) : null}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-extrabold text-slate-900">캐시·지갑</h2>
          <p className="mt-1 text-sm text-slate-600">잔액·원장은 캐시 쪽 화면에서 이어집니다(요약은 여기엔 아직 없을 수 있어요).</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            <li>
              <Link
                className="flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 hover:bg-slate-100"
                href="/wallet/charge"
              >
                캐시 충전
              </Link>
            </li>
            <li>
              <Link
                className="flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 hover:bg-slate-100"
                href="/wallet/ledger"
              >
                사용 내역
              </Link>
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
          <h2 className="text-base font-extrabold text-slate-900">맞춤의뢰·기타</h2>
          <p className="mt-1 text-sm text-slate-600">진행 중 주문은 주문 목록에서 이어가요.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-950 hover:bg-amber-100 sm:min-w-[10rem]"
              href="/custom-request/orders"
            >
              내 진행 주문
            </Link>
            <Link
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 sm:min-w-[10rem]"
              href="/custom-request"
            >
              맞춤의뢰 홈
            </Link>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-base font-extrabold text-slate-900">결제·구독·알림</h2>
        {payErr ? stateBanner("최근 결제 목록을 불러오는 데 문제가 있을 수 있어요.", "err") : null}
        {recentPayments.rows.length ? (
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-slate-800 sm:pl-5">
            {recentPayments.rows.map((r, i) => (
              <li key={i}>{paymentRowLabel(r as Row)}</li>
            ))}
          </ol>
        ) : !payErr ? (
          <p className="mt-2 text-slate-600">최근 결제·주문이 없어요.</p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">
          구독·결제: {mypage.subscriptions.valueText}건 · {mypage.payments.valueText}건
        </p>
        {mypage.subscriptions.status === "skeleton" && stateBanner(mypage.subscriptions.detail, "soft")}
        {mypage.notifications.status === "skeleton" && stateBanner("알림은 이후 앱/마이페이지와 이어갈 수 있어요(준비 중).", "soft")}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
        <h2 className="text-base font-extrabold text-slate-900">바로가기</h2>
        <ul className="mt-3 flex flex-col gap-2 sm:grid sm:grid-cols-2">
          <li>
            <Link className="min-h-[44px] text-base font-bold text-blue-800 underline" href="/community">
              커뮤니티
            </Link>
          </li>
          <li>
            <Link className="min-h-[44px] text-base font-bold text-blue-800 underline" href="/custom-request/orders">
              맞춤의뢰 주문
            </Link>
          </li>
          <li>
            <Link className="min-h-[44px] text-base font-bold text-blue-800 underline" href="/custom-request">
              맞춤의뢰 홈
            </Link>
          </li>
          <li>
            <Link className="min-h-[44px] text-base font-bold text-blue-800 underline" href="/subscriptions">
              구독 관리
            </Link>
          </li>
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          알림: {mypage.notifications.valueText === "—" ? "표시 준비 중" : `${mypage.notifications.valueText}건`} —{" "}
          {mypage.notifications.detail}
        </p>
      </section>
    </div>
  );
}
