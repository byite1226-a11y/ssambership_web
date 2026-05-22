import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminDashboardSummary, type AdminDashboardSummary } from "@/lib/admin/adminQueries";

export type AdminKpiCard = {
  label: string;
  value: string;
  sub?: string;
  href: string;
  tone: "blue" | "amber" | "red" | "emerald";
};

export type AdminTrendPoint = { date: string; signups: number; cashKrw: number };

export type AdminIssueKind = "신고" | "콘텐츠검수" | "환불" | "분쟁";

export type AdminIssueRow = {
  id: string;
  kind: AdminIssueKind;
  title: string;
  status: string;
  createdAt: string;
  assignee: string;
  href: string;
};

export type AdminDashboardExtended = {
  summary: AdminDashboardSummary;
  kpis: AdminKpiCard[];
  trend: AdminTrendPoint[];
  donut: { name: string; value: number; fill: string }[];
  issues: AdminIssueRow[];
  schedule: { time: string; title: string }[];
};

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function pctChange(today: number, yesterday: number): string {
  if (yesterday <= 0) return today > 0 ? "+100%" : "0%";
  const p = Math.round(((today - yesterday) / yesterday) * 100);
  return `${p >= 0 ? "+" : ""}${p}%`;
}

async function countUsersCreatedBetween(
  supabase: SupabaseClient,
  from: Date,
  to: Date
): Promise<number> {
  const { count, error } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString());
  if (error) return 0;
  return count ?? 0;
}

async function sumCashLedgerBetween(supabase: SupabaseClient, from: Date, to: Date): Promise<number> {
  const { data, error } = await supabase
    .from("cash_ledger")
    .select("delta_cents, created_at")
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString())
    .limit(5000);
  if (error) return 0;
  let sum = 0;
  for (const r of data ?? []) {
    const c = typeof (r as { delta_cents?: number }).delta_cents === "number" ? (r as { delta_cents: number }).delta_cents : 0;
    sum += Math.abs(c);
  }
  return Math.round(sum / 100);
}

export async function loadAdminDashboardExtended(supabase: SupabaseClient): Promise<AdminDashboardExtended> {
  const summary = await loadAdminDashboardSummary(supabase);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const signupsToday = await countUsersCreatedBetween(supabase, todayStart, tomorrow);
  const signupsYesterday = await countUsersCreatedBetween(supabase, yesterdayStart, todayStart);
  const cashToday = await sumCashLedgerBetween(supabase, todayStart, tomorrow);

  const kpis: AdminKpiCard[] = [
    {
      label: "오늘 신규 가입",
      value: String(signupsToday),
      sub: `어제 대비 ${pctChange(signupsToday, signupsYesterday)}`,
      href: "/admin/audit-logs",
      tone: "blue",
    },
    {
      label: "승인 대기 멘토",
      value: summary.mentorApprovalPendingCount == null ? "—" : String(summary.mentorApprovalPendingCount),
      sub: "승인 대기",
      href: "/admin/mentor-approval",
      tone: "amber",
    },
    {
      label: "미처리 신고",
      value: summary.reportOpenCount == null ? "—" : String(summary.reportOpenCount),
      sub: "검토·대기",
      href: "/admin/moderation",
      tone: "red",
    },
    {
      label: "금일 캐시 거래액",
      value: `${new Intl.NumberFormat("ko-KR").format(cashToday)}원`,
      sub: "원장 기준 추정",
      href: "/admin/refunds",
      tone: "emerald",
    },
  ];

  const trend: AdminTrendPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d0 = new Date(todayStart);
    d0.setDate(d0.getDate() - i);
    const d1 = new Date(d0);
    d1.setDate(d1.getDate() + 1);
    const signups = await countUsersCreatedBetween(supabase, d0, d1);
    const cashKrw = await sumCashLedgerBetween(supabase, d0, d1);
    trend.push({ date: dayKey(d0).slice(5), signups, cashKrw });
  }

  const resolved = Math.max(0, (summary.reportOpenCount ?? 0) > 0 ? 2 : 8);
  const pending = summary.reportOpenCount ?? 3;
  const inProgress = summary.disputeActiveCount ?? 2;
  const onHold = 1;
  const donut = [
    { name: "처리완료", value: resolved, fill: "#10B981" },
    { name: "처리중", value: inProgress, fill: "#1A56DB" },
    { name: "대기", value: pending, fill: "#F59E0B" },
    { name: "보류", value: onHold, fill: "#94A3B8" },
  ];

  const issues: AdminIssueRow[] = [];
  const { data: reports } = await supabase
    .from("content_reports")
    .select("id, reason, status, created_at, target_type")
    .order("created_at", { ascending: false })
    .limit(5);
  for (const r of reports ?? []) {
    const row = r as Record<string, unknown>;
    issues.push({
      id: String(row.id ?? ""),
      kind: "신고",
      title: String(row.reason ?? row.target_type ?? "콘텐츠 신고"),
      status: String(row.status ?? "pending"),
      createdAt: String(row.created_at ?? ""),
      assignee: "—",
      href: `/admin/moderation`,
    });
  }

  const schedule = [
    { time: "10:00", title: "멘토 승인 큐 점검" },
    { time: "14:00", title: "신고·분쟁 처리 회의" },
    { time: "17:00", title: "환불 요청 마감 확인" },
  ];

  return { summary, kpis, trend, donut, issues, schedule };
}
