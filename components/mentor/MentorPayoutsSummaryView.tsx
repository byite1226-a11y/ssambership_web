"use client";

import Link from "next/link";
import { useState } from "react";
import { updateMentorPayoutAccountAction } from "@/lib/mentor/mentorPayoutAccountActions";
import { formatCashKrw } from "@/lib/mentor/mentorPayoutsConstants";
import type { MentorPayoutMonthlyCard, MentorPayoutSummary } from "@/lib/mentor/mentorPayoutsService";
import { ArrowRight, Building2, Calendar, Info, Wallet } from "lucide-react";

type Props = {
  summary: MentorPayoutSummary;
  months: MentorPayoutMonthlyCard[];
};

export function MentorPayoutsSummaryView({ summary, months }: Props) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountMsg, setAccountMsg] = useState<string | null>(null);

  async function onSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("bankName", bankName);
    fd.set("accountNumber", accountNumber);
    const res = await updateMentorPayoutAccountAction(fd);
    setAccountMsg(res.ok ? "계좌 정보가 저장되었습니다." : res.error ?? "저장에 실패했습니다.");
    if (res.ok) setAccountOpen(false);
  }

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">정산 · 수익</h1>
          <p className="mt-1 text-sm text-slate-600">구독·맞춤의뢰 수익과 월별 정산 예정액을 확인합니다.</p>
        </div>
        <Link
          href="/mentor/payouts/detail"
          className="inline-flex items-center gap-1 rounded-xl bg-[#1A56DB] px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
        >
          상세 내역
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* 좌측 사이드바 */}
        <aside className="space-y-4 lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">이번 달 발생 수익</p>
            <p className="mt-2 text-2xl font-black text-[#1A56DB] tabular-nums">{formatCashKrw(summary.thisMonthRevenue)}</p>
            <p className="mt-2 text-xs text-slate-500">
              구독 {formatCashKrw(summary.thisMonthSubscription)} · 맞춤의뢰 {formatCashKrw(summary.thisMonthCustomRequest)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">이번 달 지급 예정액</p>
            <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">{formatCashKrw(summary.thisMonthScheduledPayout)}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <Building2 className="h-4 w-4 text-[#1A56DB]" />
              <p className="text-xs font-bold">정산받을 계좌</p>
            </div>
            <p className="mt-2 font-mono text-sm font-semibold text-slate-800">{summary.bankDisplay}</p>
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              계좌 변경
            </button>
            {accountOpen ? (
              <form onSubmit={onSaveAccount} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="은행명 (예: 카카오뱅크)"
                  className="w-full rounded-lg border px-3 py-2 text-xs"
                  required
                />
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="계좌번호 (숫자만)"
                  className="w-full rounded-lg border px-3 py-2 text-xs"
                  required
                />
                <button type="submit" className="w-full rounded-lg bg-[#1A56DB] py-2 text-xs font-bold text-white">
                  저장
                </button>
                {accountMsg ? <p className="text-[10px] text-slate-500">{accountMsg}</p> : null}
              </form>
            ) : null}
          </div>
        </aside>

        {/* 중앙 메인 */}
        <main className="space-y-6 lg:col-span-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <RevenueCard
              title="구독 수익"
              icon={<Wallet className="h-4 w-4" />}
              month={summary.thisMonthSubscription}
              lifetime={summary.lifetimeSubscription}
            />
            <RevenueCard
              title="맞춤의뢰 수익"
              icon={<Calendar className="h-4 w-4" />}
              month={summary.thisMonthCustomRequest}
              lifetime={summary.lifetimeCustomRequest}
            />
          </div>

          <section>
            <h2 className="mb-3 text-sm font-black text-slate-900">월별 수익 요약</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {months.map((m) => (
                <div key={m.yearMonth} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900">{m.label}</p>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        m.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800",
                      ].join(" ")}
                    >
                      {m.status === "paid" ? "지급완료" : "정산예정"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">발생 수익</p>
                  <p className="text-lg font-black text-slate-900 tabular-nums">{formatCashKrw(m.revenue)}</p>
                  <p className="mt-2 text-xs text-slate-500">지급 예정액</p>
                  <p className="text-sm font-bold text-[#1A56DB] tabular-nums">{formatCashKrw(m.scheduledPayout)}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* 우측 안내 */}
        <aside className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-[#1A56DB]" />
              <h3 className="text-sm font-black text-slate-900">정산 안내</h3>
            </div>
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600">
              <li>정산은 운영팀이 월별로 일괄 처리합니다.</li>
              <li>매월 말일 기준, 다음 달 중 순차 지급됩니다.</li>
              <li>환불·보류 건은 지급 예정액에서 차감될 수 있습니다.</li>
              <li>구독 수익은 결제금액의 70%, 맞춤의뢰는 80%가 멘토 몫입니다.</li>
              <li>문의: 쌤버십 고객센터(앱 내 문의 또는 운영 메일)</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RevenueCard(props: {
  title: string;
  icon: React.ReactNode;
  month: number;
  lifetime: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[#1A56DB]">
        {props.icon}
        <h3 className="text-sm font-black text-slate-900">{props.title}</h3>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400">이번 달 누적</p>
          <p className="mt-1 text-lg font-black tabular-nums text-slate-900">{formatCashKrw(props.month)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400">전체 누적</p>
          <p className="mt-1 text-lg font-black tabular-nums text-slate-700">{formatCashKrw(props.lifetime)}</p>
        </div>
      </div>
    </div>
  );
}
