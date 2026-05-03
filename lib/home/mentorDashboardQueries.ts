import type { SupabaseClient } from "@supabase/supabase-js";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { mentorCustomOrderStatusHeadline } from "@/lib/customRequest/mentorCustomOrderBrowseDisplay";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { fetchRoomsForUser } from "@/lib/qna/questionRoomQueries";
import { loadMentorPayoutsPageData } from "@/lib/mentor/mentorPayoutsQueries";
import { aggregateThreadStatsForRooms } from "@/lib/home/threadStats";
import { fetchActiveOpenDisputeOrderIdSet } from "@/lib/customRequest/orderDisputeHelpers";

type Row = Record<string, unknown>;

export const MENTOR_DASHBOARD_DATA_MODEL = [
  "질문방·학생 연결",
  "답변·처리 현황",
  "정산(이번 달 예상)",
  "맞춤의뢰",
  "멘토 프로필",
  "알림",
] as const;

export type MentorDashboardData = {
  rooms: { rows: Row[]; error: string | null };
  connectedRoomCount: number;
  threadStats: Awaited<ReturnType<typeof aggregateThreadStatsForRooms>>;
  payouts: Awaited<ReturnType<typeof loadMentorPayoutsPageData>>;
  customRecent: {
    table: string | null;
    rows: Row[];
    error: string | null;
    probe: string;
    /** open / under_review 분쟁이 붙은 주문 id (RLS·당사자 한정) */
    activeDisputeOrderIds: Set<string>;
  };
  notifyProbe: { label: string; detail: string; status: "skeleton" | "connected" | "empty" };
};

export async function fetchRecentCustomOrders(
  supabase: SupabaseClient,
  mentorId: string,
  limit = 5
): Promise<{
  table: string | null;
  rows: Row[];
  error: string | null;
  probe: string;
  activeDisputeOrderIds: Set<string>;
}> {
  for (const t of ["custom_request_orders", "request_orders"] as const) {
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
      return { table: t, rows: [], error: null, probe: "", activeDisputeOrderIds: new Set() };
    }
    const o1 = await supabase
      .from(t)
      .select("*")
      .eq(mc, mentorId)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (o1.error) {
      if (!/order|column/i.test(o1.error.message)) {
        return { table: t, rows: [], error: o1.error.message, probe: "", activeDisputeOrderIds: new Set() };
      }
      const o2 = await supabase.from(t).select("*").eq(mc, mentorId).limit(limit);
      if (o2.error) {
        return { table: t, rows: [], error: o2.error.message, probe: "", activeDisputeOrderIds: new Set() };
      }
      const rows = (o2.data as Row[]) ?? [];
      const ids = rows.map((r) => (typeof r.id === "string" ? r.id : "")).filter(Boolean);
      const activeDisputeOrderIds = await fetchActiveOpenDisputeOrderIdSet(supabase, ids);
      return { table: t, rows, error: null, probe: "", activeDisputeOrderIds };
    }
    const rows = (o1.data as Row[]) ?? [];
    const ids = rows.map((r) => (typeof r.id === "string" ? r.id : "")).filter(Boolean);
    const activeDisputeOrderIds = await fetchActiveOpenDisputeOrderIdSet(supabase, ids);
    return { table: t, rows, error: null, probe: "", activeDisputeOrderIds };
  }
  return { table: null, rows: [], error: null, probe: "", activeDisputeOrderIds: new Set() };
}

async function notificationsCountProbe(
  supabase: SupabaseClient,
  userId: string
): Promise<MentorDashboardData["notifyProbe"]> {
  const { error: pe } = await supabase.from("notifications").select("id").limit(1);
  if (pe) {
    return { label: "알림", detail: "알림을 불러오는 중 문제가 있어요. 잠시 후 다시 시도해 주세요.", status: "skeleton" };
  }
  for (const col of ["user_id", "recipient_id", "mentor_id", "student_id"] as const) {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq(col, userId);
    if (!error && count !== null) {
      return {
        label: "알림",
        detail: count > 0 ? `알림 ${count}건이 있어요` : "새 알림이 없어요",
        status: count > 0 ? "connected" : "empty",
      };
    }
  }
  return { label: "알림", detail: "알림 건수를 아직 표시할 수 없어요", status: "skeleton" };
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

export {
  mentorCustomOrderStatusHeadline,
  mentorCustomOrderWorkroomHref,
  mentorCustomOrderPaymentLine,
  mentorCustomOrderPaymentBadge,
} from "@/lib/customRequest/mentorCustomOrderBrowseDisplay";

export function customOrderLine(r: Row, activeDisputeOrderIds?: ReadonlySet<string> | null) {
  const title = pickDisplayField(r, ["title", "subject", "label", "name"]);
  const titleLine = title !== "—" ? title : "맞춤의뢰";
  const when = pickDisplayField(r, ["updated_at", "created_at"]);
  const whenShort = when !== "—" && when.length > 10 ? when.slice(0, 10) : when;
  return `${mentorCustomOrderStatusHeadline(r, activeDisputeOrderIds)} · ${titleLine} · ${whenShort}`;
}

const CUSTOM_REQUEST_ORDERS_TABLE = "custom_request_orders" as const;

/**
 * `public.custom_request_orders` 만 조회한다. (`custom_orders` 테이블은 사용하지 않음.)
 */
export async function fetchMentorCustomRequestOrdersFromPrimaryTable(
  supabase: SupabaseClient,
  mentorId: string,
  limit = 50
): Promise<{ rows: Row[]; error: string | null; probe: string }> {
  const t = CUSTOM_REQUEST_ORDERS_TABLE;
  const { error: pe } = await supabase.from(t).select("id").limit(1);
  if (pe) {
    return { rows: [], error: pe.message, probe: "" };
  }
  const { column: mc } = await pickExistingColumn(supabase, t, [
    "mentor_id",
    "mentor_user_id",
    "expert_id",
    "assignee_id",
    "selected_mentor_id",
  ]);
  if (!mc) {
    return { rows: [], error: null, probe: "" };
  }
  const o1 = await supabase
    .from(t)
    .select("*")
    .eq(mc, mentorId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (o1.error) {
    if (!/order|column/i.test(o1.error.message)) {
      return { rows: [], error: o1.error.message, probe: "" };
    }
    const o2 = await supabase.from(t).select("*").eq(mc, mentorId).limit(limit);
    if (o2.error) {
      return { rows: [], error: o2.error.message, probe: "" };
    }
    return { rows: (o2.data as Row[]) ?? [], error: null, probe: "" };
  }
  return { rows: (o1.data as Row[]) ?? [], error: null, probe: "" };
}
