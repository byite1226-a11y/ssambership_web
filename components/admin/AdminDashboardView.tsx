"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { AdminDashboardExtended } from "@/lib/admin/adminDashboardExtended";

const PRIMARY = "#1A56DB";

const QUICK_LINKS = [
  { href: "/admin/mentor-approval", label: "멘토 승인" },
  { href: "/admin/moderation", label: "콘텐츠 검수" },
  { href: "/admin/disputes", label: "신고·분쟁 확인" },
  { href: "/admin/reviews", label: "리뷰 관리" },
  { href: "/admin/refunds", label: "환불 요청 확인" },
  { href: "/admin/notices", label: "이벤트 만들기" },
] as const;

const kpiBorder: Record<string, string> = {
  blue: "border-blue-100",
  amber: "border-amber-100",
  red: "border-red-100",
  emerald: "border-emerald-100",
};

function formatIssueTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

export function AdminDashboardView(props: { data: AdminDashboardExtended }) {
  const { kpis, trend, donut, issues, schedule } = props.data;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">관리자 대시보드</h1>
          <p className="mt-1 text-sm text-slate-600">운영 현황을 한눈에 확인합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="검색 (이름, ID, 제목)"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" aria-label="시작일" />
          <span className="self-center text-slate-400">~</span>
          <input type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" aria-label="종료일" />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${kpiBorder[k.tone]}`}
          >
            <p className="text-xs font-bold text-slate-500">{k.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{k.value}</p>
            {k.sub ? <p className="mt-1 text-xs font-semibold text-slate-500">{k.sub}</p> : null}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-900">7일 가입·거래 추이</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="signups" name="가입" stroke={PRIMARY} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="cashKrw" name="거래(원)" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-900">문의·신고 처리 상태</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {donut.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-extrabold text-slate-900">최근 운영 이슈</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-600">
                <th className="px-5 py-3">유형</th>
                <th className="px-5 py-3">제목</th>
                <th className="px-5 py-3">상태</th>
                <th className="px-5 py-3">접수시간</th>
                <th className="px-5 py-3">담당자</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    최근 이슈가 없습니다.
                  </td>
                </tr>
              ) : (
                issues.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-semibold text-slate-700">{row.kind}</td>
                    <td className="px-5 py-3">
                      <Link href={row.href} className="font-bold text-[#1A56DB] hover:underline">
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{row.status}</td>
                    <td className="px-5 py-3 text-slate-500">{formatIssueTime(row.createdAt)}</td>
                    <td className="px-5 py-3 text-slate-500">{row.assignee}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-900">빠른 작업</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-bold text-slate-800 transition hover:border-[#1A56DB] hover:bg-blue-50 hover:text-[#1A56DB]"
              >
                {q.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-900">오늘 일정</h2>
          <ul className="mt-4 space-y-3">
            {schedule.map((s) => (
              <li key={s.time} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                <span className="shrink-0 text-xs font-black text-[#1A56DB]">{s.time}</span>
                <span className="text-sm font-semibold text-slate-800">{s.title}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
