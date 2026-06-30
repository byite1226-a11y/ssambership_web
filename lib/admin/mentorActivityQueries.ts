import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";

export type MentorActivityEventRow = {
  id: string;
  mentor_id: string;
  event_type: string;
  reason: string | null;
  detail: Record<string, unknown> | null;
  status: string;
  created_at: string | null;
  reviewed_at: string | null;
  mentor_name: string | null;
  mentor_email: string | null;
};

export async function loadMentorActivityEvents(opts?: {
  pendingOnly?: boolean;
  limit?: number;
}): Promise<{ rows: MentorActivityEventRow[]; error: string | null }> {
  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "서비스 키 오류" };
  }
  let q = admin
    .from("mentor_activity_events")
    .select("id, mentor_id, event_type, reason, detail, status, created_at, reviewed_at")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);
  if (opts?.pendingOnly) q = q.eq("status", "pending_review");

  const { data, error } = await q;
  if (error) return { rows: [], error: error.message };

  const rows = (data as Omit<MentorActivityEventRow, "mentor_name" | "mentor_email">[]) ?? [];
  const mentorIds = [...new Set(rows.map((r) => r.mentor_id).filter(Boolean))];
  const nameMap = new Map<string, { name: string | null; email: string | null }>();
  if (mentorIds.length) {
    const { data: users } = await admin
      .from("users")
      .select("id, full_name, nickname, email")
      .in("id", mentorIds);
    for (const u of (users as Array<Record<string, unknown>>) ?? []) {
      const id = String(u.id);
      nameMap.set(id, {
        name: (u.full_name as string) ?? (u.nickname as string) ?? null,
        email: (u.email as string) ?? null,
      });
    }
  }

  return {
    rows: rows.map((r) => ({
      ...r,
      mentor_name: nameMap.get(r.mentor_id)?.name ?? null,
      mentor_email: nameMap.get(r.mentor_id)?.email ?? null,
    })),
    error: null,
  };
}

export async function countMentorActivityPendingReview(): Promise<number> {
  try {
    const admin = createServiceRoleClient();
    const { count } = await admin
      .from("mentor_activity_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review");
    return count ?? 0;
  } catch {
    return 0;
  }
}
