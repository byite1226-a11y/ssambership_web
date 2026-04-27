import type { SupabaseClient } from "@supabase/supabase-js";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { fetchRoomsForUser } from "@/lib/qna/questionRoomQueries";
import { loadMentorPayoutsPageData } from "@/lib/mentor/mentorPayoutsQueries";
import { aggregateThreadStatsForRooms } from "@/lib/home/threadStats";

type Row = Record<string, unknown>;

export const MENTOR_DASHBOARD_DATA_MODEL = [
  "mentor_student_rooms (연결 학생·room 수)",
  "question_threads (답변 큐 휴리스틱)",
  "payouts (이번 달 예상 — mentorPayouts 재사용)",
  "custom_request_orders (맞춤의뢰 진행 요약)",
  "mentor_profiles (한 줄 힌트 — 후속)",
  "notifications (연결 예정)",
] as const;

export type MentorDashboardData = {
  rooms: { rows: Row[]; error: string | null };
  connectedRoomCount: number;
  threadStats: Awaited<ReturnType<typeof aggregateThreadStatsForRooms>>;
  payouts: Awaited<ReturnType<typeof loadMentorPayoutsPageData>>;
  customRecent: { table: string | null; rows: Row[]; error: string | null; probe: string };
  notifyProbe: { label: string; detail: string; status: "skeleton" | "connected" | "empty" };
};

async function fetchRecentCustomOrders(
  supabase: SupabaseClient,
  mentorId: string,
  limit = 5
): Promise<{ table: string | null; rows: Row[]; error: string | null; probe: string }> {
  for (const t of ["custom_request_orders", "custom_orders", "request_orders"] as const) {
    const { error: pe } = await supabase.from(t).select("id").limit(1);
    if (pe) continue;
    const { column: mc } = await pickExistingColumn(supabase, t, [
      "mentor_id",
      "mentor_user_id",
      "expert_id",
      "assignee_id",
      "selected_mentor_id",
    ]);
    if (!mc) {
      return { table: t, rows: [], error: null, probe: `${t}: mentor FK 없음` };
    }
    const o1 = await supabase
      .from(t)
      .select("*")
      .eq(mc, mentorId)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (o1.error) {
      if (!/order|column/i.test(o1.error.message)) {
        return { table: t, rows: [], error: o1.error.message, probe: t };
      }
      const o2 = await supabase.from(t).select("*").eq(mc, mentorId).limit(limit);
      if (o2.error) {
        return { table: t, rows: [], error: o2.error.message, probe: t };
      }
      return { table: t, rows: (o2.data as Row[]) ?? [], error: null, probe: `${t} · order 생략` };
    }
    return { table: t, rows: (o1.data as Row[]) ?? [], error: null, probe: `${t}.${mc}` };
  }
  return { table: null, rows: [], error: null, probe: "custom_request_orders(후보) 없음" };
}

async function notificationsCountProbe(
  supabase: SupabaseClient,
  userId: string
): Promise<MentorDashboardData["notifyProbe"]> {
  const { error: pe } = await supabase.from("notifications").select("id").limit(1);
  if (pe) {
    return { label: "notifications", detail: pe.message, status: "skeleton" };
  }
  for (const col of ["user_id", "recipient_id", "mentor_id", "student_id"] as const) {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq(col, userId);
    if (!error && count !== null) {
      return {
        label: "notifications",
        detail: `${col} 기준 ${count}건(목록·읽음 후속)`,
        status: count > 0 ? "connected" : "empty",
      };
    }
  }
  return { label: "notifications", detail: "사용자 FK 컬럼 probe 실패", status: "skeleton" };
}

/**
 * /(mentor)/mentor/dashboard: 정산/맞춤의뢰/room/thread 요약(더미 없음)
 */
export async function loadMentorDashboardData(
  supabase: SupabaseClient,
  mentorId: string
): Promise<MentorDashboardData> {
  const roomsQ = await fetchRoomsForUser(supabase, "mentor", mentorId);
  const roomIds = (roomsQ.rows ?? [])
    .map((r) => (typeof r.id === "string" ? r.id : null))
    .filter((x): x is string => x !== null);

  const [threadStats, payouts, customRecent, notifyProbe] = await Promise.all([
    aggregateThreadStatsForRooms(supabase, roomIds, { maxRooms: 15, mode: "mentor" }),
    loadMentorPayoutsPageData(supabase, mentorId),
    fetchRecentCustomOrders(supabase, mentorId, 5),
    notificationsCountProbe(supabase, mentorId),
  ]);

  return {
    rooms: roomsQ,
    connectedRoomCount: roomsQ.error ? 0 : (roomsQ.rows?.length ?? 0),
    threadStats,
    payouts,
    customRecent,
    notifyProbe,
  };
}

export function customOrderLine(r: Row) {
  return `${pickDisplayField(r, ["status", "state", "order_status"])} · ${pickDisplayField(r, ["title", "id"])} · ${pickDisplayField(
    r,
    ["updated_at", "created_at"]
  )}`;
}
