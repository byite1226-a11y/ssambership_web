import Link from "next/link";
import type { ReactNode } from "react";
import {
  customOrderLine,
  mentorCustomOrderWorkroomHref,
  type MentorDashboardData,
} from "@/lib/home/mentorDashboardQueries";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";

function CtaButton(props: { href: string; children: ReactNode; tone: "blue" | "slate" | "amber" }) {
  const map = {
    blue: "min-h-[44px] border border-transparent bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-500",
    slate: "min-h-[44px] border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50",
    amber: "min-h-[44px] border border-transparent bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-400",
  } as const;
  return (
    <Link href={props.href} className={`inline-flex items-center justify-center rounded-xl transition-colors ${map[props.tone]}`}>
      {props.children}
    </Link>
  );
}

function KpiCard(props: {
  label: string;
  value: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{props.label}</p>
        <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">{props.value}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{props.description}</p>
      </div>
      <Link href={props.href} className="mt-3 block text-sm font-bold text-blue-700 hover:underline">
        {props.linkLabel} &rarr;
      </Link>
    </article>
  );
}

function emptyOrValue(raw: string, emptyLabel: string): string {
  return raw === "—" || !raw.trim() ? emptyLabel : raw;
}

function formatOrderDate(row: Record<string, unknown>): string {
  const raw = pickDisplayField(row, ["updated_at", "created_at", "accepted_at"]);
  if (raw === "—") return "";
  const match = raw.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0].replace(/-/g, ".") : raw.slice(0, 10);
}

export function MentorDashboardBody({ data }: { data: MentorDashboardData }) {
  const { connectedRoomCount, threadStats, payouts, customRecent, notifyProbe } = data;
  const customErr = customRecent.error;
  const amountErr = Boolean(payouts.payoutError);

  const queueValue = emptyOrValue(threadStats.error ? "—" : String(threadStats.mentorQueueEstimate), "0");
  const openThreadsValue = emptyOrValue(threadStats.error ? "—" : String(threadStats.openThreads), "0");
  const customValue = emptyOrValue(customErr ? "—" : String(customRecent.rows.length), "0");
  const payoutValue = emptyOrValue(
    amountErr ? "—" : `${payouts.monthExpectedCents.toLocaleString("ko-KR")}원`,
    "0원",
  );
  const notifyValue =
    notifyProbe.status === "connected" ? "있음" : notifyProbe.status === "empty" ? "없음" : "확인 필요";

  const recentOrders = customRecent.rows.slice(0, 5);

  const quickLinks = [
    { href: "/mentor/question-room", label: "질문방 관리" },
    { href: "/mentor/custom-request/dashboard", label: "맞춤의뢰" },
    { href: "/mentor/payouts", label: "정산" },
    { href: "/mentor/profile", label: "프로필" },
    { href: "/mentor/community/new", label: "커뮤니티 글쓰기" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 text-sm text-slate-800">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-extrabold uppercase tracking-wide text-blue-600">멘토 홈</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">멘토 대시보드</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          오늘 처리할 일을 확인하고 빠르게 이동하세요.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <CtaButton href="/mentor/question-room" tone="blue">
            질문방 관리
          </CtaButton>
          <CtaButton href="/mentor/custom-request/dashboard" tone="slate">
            맞춤의뢰
          </CtaButton>
          <CtaButton href="/mentor/payouts" tone="slate">
            정산
          </CtaButton>
          <CtaButton href="/mentor/profile" tone="slate">
            프로필
          </CtaButton>
          <CtaButton href="/mentor/support/disputes" tone="amber">
            분쟁 현황
          </CtaButton>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="답변 대기"
          value={queueValue}
          description={threadStats.error ? "\uc9d1\uacc4\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc5b4\uc694." : "\ub2f5\ubcc0\uc774 \ud544\uc694\ud55c \ud56d\ubaa9(\ucd94\uc815)"}
          href="/mentor/question-room"
          linkLabel="질문방 열기"
        />
        <KpiCard
          label="진행 중 질문"
          value={openThreadsValue}
          description={`\uc5f0\uacb0\ub41c \uc9c8\ubb38\ubc29 ${connectedRoomCount}\uacf3`}
          href="/mentor/question-room"
          linkLabel="질문방 열기"
        />
        <KpiCard
          label="맞춤의뢰"
          value={customValue}
          description={customErr ? "\ubaa9\ub85d\uc744 \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc5b4\uc694." : "\ucd5c\uadfc \uc8fc\ubb38\u00b7\uc758\ub8b0 \uac74\uc218"}
          href="/mentor/custom-request/orders"
          linkLabel="주문 목록"
        />
        <KpiCard
          label="이번 달 정산"
          value={payoutValue}
          description={amountErr ? payouts.payoutError ?? "\uc815\uc0b0 \ub0b4\uc5ed \uc5c6\uc74c" : payouts.tableHint}
          href="/mentor/payouts"
          linkLabel="정산 상세"
        />
        <KpiCard
          label="알림"
          value={notifyValue}
          description={notifyProbe.detail}
          href="/notifications"
          linkLabel="알림 보기"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">최근 맞춤의뢰</h2>
          {customErr ? (
            <p className="mt-4 text-sm text-red-700">맞춤의뢰를 불러오지 못했어요.</p>
          ) : recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">최근 맞춤의뢰가 없어요.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {recentOrders.map((r, i) => {
                const row = r as Record<string, unknown>;
                const oid = typeof row.id === "string" && row.id.trim() ? row.id.trim() : null;
                const title = pickDisplayField(row, ["title", "subject", "label", "name"]);
                const titleLine = title !== "—" ? title : customOrderLine(row, customRecent.activeDisputeOrderIds);
                const dateStr = formatOrderDate(row);
                return (
                  <li key={oid ?? i} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                    <div className="min-w-0 flex-1">
                      {oid ? (
                        <Link
                          href={mentorCustomOrderWorkroomHref(oid)}
                          className="block truncate text-sm font-bold text-slate-900 hover:text-blue-700 hover:underline"
                        >
                          {titleLine}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-bold text-slate-900">{titleLine}</p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-500">
                        {customOrderLine(row, customRecent.activeDisputeOrderIds)}
                      </p>
                    </div>
                    {dateStr ? <span className="shrink-0 text-xs tabular-nums text-slate-400">{dateStr}</span> : null}
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/mentor/custom-request/orders" className="mt-3 block text-sm font-bold text-blue-700 hover:underline">
            주문 목록 &rarr;
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">빠른 링크</h2>
          <p className="mt-1 text-sm text-slate-600">자주 쓰는 메뉴로 바로 이동하세요.</p>
          <ul className="mt-4 space-y-2">
            {quickLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-[44px] items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 text-sm font-bold text-slate-800 transition hover:border-slate-200 hover:bg-white"
                >
                  {item.label}
                  <span className="text-slate-400">&rarr;</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
