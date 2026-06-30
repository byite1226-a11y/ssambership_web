import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { refundSlaInfo, REFUND_SLA_DAYS } from "@/lib/admin/refundSla";

const HOUR_MS = 60 * 60 * 1000;

function avgHours(pairs: Array<{ start: string | null; end: string | null }>): number | null {
  const deltas: number[] = [];
  for (const p of pairs) {
    if (!p.start || !p.end) continue;
    const s = new Date(p.start).getTime();
    const e = new Date(p.end).getTime();
    if (Number.isNaN(s) || Number.isNaN(e) || e < s) continue;
    deltas.push((e - s) / HOUR_MS);
  }
  if (!deltas.length) return null;
  return deltas.reduce((a, b) => a + b, 0) / deltas.length;
}

export type SlaDashboard = {
  reports: { avgResponseHours: number | null; resolvedCount: number; openCount: number };
  refunds: { avgProcessHours: number | null; processedCount: number; pendingCount: number };
  mentorSuspended: {
    pending: number;
    soon: number; // 2일 이내
    over: number; // 기한 초과
    rows: Array<{ id: string; createdAt: string | null; daysRemaining: number | null; label: string; tone: string }>;
  };
  slaDays: number;
  error: string | null;
};

export async function loadSlaDashboard(now: Date = new Date()): Promise<SlaDashboard> {
  const base: SlaDashboard = {
    reports: { avgResponseHours: null, resolvedCount: 0, openCount: 0 },
    refunds: { avgProcessHours: null, processedCount: 0, pendingCount: 0 },
    mentorSuspended: { pending: 0, soon: 0, over: 0, rows: [] },
    slaDays: REFUND_SLA_DAYS,
    error: null,
  };

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "서비스 키 오류" };
  }

  // 신고 응답시간
  try {
    const { data: resolved } = await admin
      .from("content_reports")
      .select("created_at, resolved_at, status")
      .in("status", ["resolved", "dismissed"])
      .not("resolved_at", "is", null)
      .order("resolved_at", { ascending: false })
      .limit(500);
    const resolvedRows = (resolved as Array<{ created_at: string | null; resolved_at: string | null }>) ?? [];
    base.reports.avgResponseHours = avgHours(
      resolvedRows.map((r) => ({ start: r.created_at, end: r.resolved_at }))
    );
    base.reports.resolvedCount = resolvedRows.length;
    const { count: openCount } = await admin
      .from("content_reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "reviewing"]);
    base.reports.openCount = openCount ?? 0;
  } catch {
    /* skip */
  }

  // 환불 처리시간
  try {
    const { data: processed } = await admin
      .from("refunds")
      .select("created_at, processed_at, status")
      .not("processed_at", "is", null)
      .order("processed_at", { ascending: false })
      .limit(500);
    const processedRows = (processed as Array<{ created_at: string | null; processed_at: string | null }>) ?? [];
    base.refunds.avgProcessHours = avgHours(
      processedRows.map((r) => ({ start: r.created_at, end: r.processed_at }))
    );
    base.refunds.processedCount = processedRows.length;
    const { count: pendingCount } = await admin
      .from("refunds")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    base.refunds.pendingCount = pendingCount ?? 0;
  } catch {
    /* skip */
  }

  // 멘토 중단 5일 SLA 잔여
  try {
    const { data: ms } = await admin
      .from("refunds")
      .select("id, created_at, status")
      .eq("status", "pending")
      .eq("request_type", "subscription_mentor_suspended")
      .order("created_at", { ascending: true })
      .limit(200);
    const msRows = (ms as Array<{ id: string; created_at: string | null; status: string }>) ?? [];
    base.mentorSuspended.pending = msRows.length;
    for (const r of msRows) {
      const sla = refundSlaInfo(r.created_at, r.status, now);
      if (sla.tone === "soon") base.mentorSuspended.soon += 1;
      if (sla.tone === "over") base.mentorSuspended.over += 1;
      base.mentorSuspended.rows.push({
        id: r.id,
        createdAt: r.created_at,
        daysRemaining: sla.daysRemaining,
        label: sla.label,
        tone: sla.tone,
      });
    }
  } catch {
    /* skip */
  }

  return base;
}
