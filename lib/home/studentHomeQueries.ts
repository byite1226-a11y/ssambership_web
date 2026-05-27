import type { SupabaseClient } from "@supabase/supabase-js";
import { getMentorUserPublic } from "@/lib/auth/mentorPublicRead";
import { pickExistingColumn, rowsFromSupabaseData } from "@/lib/qna/safeSelect";
import { fetchRoomsForUser } from "@/lib/qna/questionRoomQueries";
import {
  SUBSCRIPTIONS_ORDER_COLUMN,
  SUBSCRIPTIONS_SELECT,
  SUBSCRIPTIONS_TABLE,
} from "@/lib/subscribe/subscriptionsTable";
import { weeklyQuestionsLabel } from "@/lib/subscribe/subscribePageQueries";
import { loadStudentMypageBundle } from "@/lib/mypage/mypageQueries";
import { aggregateThreadStatsForRooms } from "@/lib/home/threadStats";
import type { UserRow } from "@/lib/types/user";

type Row = Record<string, unknown>;

const SUB_TABLES = ["subscriptions", "mentor_subscriptions", "user_subscriptions"] as const;
const STU_FK = ["student_id", "user_id", "student_user_id", "subscriber_id"] as const;
const MEN_FK = ["mentor_id", "mentor_user_id", "creator_id", "host_id"] as const;
const PAY_TABLES = ["payments", "payment_intents", "order_payments"] as const;

export const STUDENT_HOME_DATA_MODEL = [
  "프로필",
  "구독·멘토 요약",
  "질문방",
  "진행 중인 질문",
  "최근 결제",
  "알림·마이페이지",
] as const;

function pickMentorIdFromSubscriptionRow(r: Row): string | null {
  for (const k of MEN_FK) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function pickLineFromPaymentRow(r: Row): string {
  for (const k of ["amount", "amount_cents", "total", "label", "status", "description"]) {
    const v = r[k];
    if (v != null) return String(v);
  }
  return "—";
}

export type SubscriptionMentorLine = {
  subscriptionTable: string | null;
  mentorId: string | null;
  mentorName: string;
  probe: string;
  row: Row;
};

export type StudentHomeData = {
  mypage: Awaited<ReturnType<typeof loadStudentMypageBundle>>;
  rooms: { rows: Row[]; error: string | null };
  threadStats: Awaited<ReturnType<typeof aggregateThreadStatsForRooms>>;
  subscriptionLines: { lines: SubscriptionMentorLine[]; error: string | null; probe: string };
  recentPayments: { table: string | null; rows: Row[]; error: string | null; probe: string };
  weeklyQuotaHint: string;
};

async function fetchSubscriptionRowsForStudent(
  supabase: SupabaseClient,
  studentId: string,
  limit = 8
): Promise<{
  table: string | null;
  rows: Row[];
  error: string | null;
  probe: string;
}> {
  for (const table of SUB_TABLES) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) continue;
    if (table === SUBSCRIPTIONS_TABLE) {
      const o1 = await supabase
        .from(SUBSCRIPTIONS_TABLE)
        .select(SUBSCRIPTIONS_SELECT)
        .eq("student_id", studentId)
        .order(SUBSCRIPTIONS_ORDER_COLUMN, { ascending: false })
        .limit(limit);
      if (o1.error) {
        const o2 = await supabase
          .from(SUBSCRIPTIONS_TABLE)
          .select(SUBSCRIPTIONS_SELECT)
          .eq("student_id", studentId)
          .limit(limit);
        if (o2.error) {
          return { table: SUBSCRIPTIONS_TABLE, rows: [], error: o2.error.message, probe: SUBSCRIPTIONS_TABLE };
        }
        return {
          table: SUBSCRIPTIONS_TABLE,
          rows: rowsFromSupabaseData(o2.data) as Row[],
          error: null,
          probe: `${SUBSCRIPTIONS_TABLE}.student_id (정렬 생략)`,
        };
      }
      return {
        table: SUBSCRIPTIONS_TABLE,
        rows: rowsFromSupabaseData(o1.data) as Row[],
        error: null,
        probe: `${SUBSCRIPTIONS_TABLE}.student_id`,
      };
    }

    const { column: sc } = await pickExistingColumn(supabase, table, STU_FK);
    if (!sc) {
      return { table, rows: [], error: null, probe: `${table}: 학생 FK 없음(요약 대기)` };
    }
    const o1 = await supabase
      .from(table)
      .select("*")
      .eq(sc, studentId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (o1.error) {
      const o2 = await supabase.from(table).select("*").eq(sc, studentId).limit(limit);
      if (o2.error) {
        return { table, rows: [], error: o2.error.message, probe: `${table}` };
      }
      return {
        table,
        rows: (o2.data as Row[]) ?? [],
        error: null,
        probe: `${table}.${sc} (정렬 생략)`,
      };
    }
    return { table, rows: (o1.data as Row[]) ?? [], error: null, probe: `${table}.${sc}` };
  }
  return { table: null, rows: [], error: null, probe: "subscriptions 계열 probe 실패" };
}

async function fetchRecentPaymentsForStudent(
  supabase: SupabaseClient,
  studentId: string,
  limit = 3
): Promise<{
  table: string | null;
  rows: Row[];
  error: string | null;
  probe: string;
}> {
  for (const table of PAY_TABLES) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) continue;
    const { column: sc } = await pickExistingColumn(supabase, table, STU_FK);
    if (!sc) continue;
    const { column: createdCol } = await pickExistingColumn(supabase, table, ["created_at", "inserted_at", "updated_at"]);
    let q = supabase.from(table).select("*").eq(sc, studentId);
    if (createdCol) {
      q = q.order(createdCol, { ascending: false });
    }
    const o1 = await q.limit(limit);
    if (o1.error) {
      const o2 = await supabase.from(table).select("*").eq(sc, studentId).limit(limit);
      if (o2.error) {
        return { table, rows: [], error: o2.error.message, probe: table };
      }
      return { table, rows: (o2.data as Row[]) ?? [], error: null, probe: `${table} · order 생략` };
    }
    return { table, rows: (o1.data as Row[]) ?? [], error: null, probe: `${table} · ${sc}` };
  }
  return { table: null, rows: [], error: null, probe: "payments(학생) 조회 경로 없음" };
}

async function enrichMentorLines(
  supabase: SupabaseClient,
  tableName: string | null,
  probe: string,
  rows: Row[]
): Promise<SubscriptionMentorLine[]> {
  const out: SubscriptionMentorLine[] = [];
  for (const row of rows) {
    const mentorId = pickMentorIdFromSubscriptionRow(row);
    if (!mentorId) {
      out.push({ subscriptionTable: tableName, mentorId: null, mentorName: "멘토 정보 없음", probe, row });
      continue;
    }
    const { data: u } = await getMentorUserPublic(supabase, mentorId);
    const name = (u?.nickname ?? u?.full_name ?? "").trim() || "이름을 불러올 수 없는 멘토";
    out.push({ subscriptionTable: tableName, mentorId, mentorName: name, probe, row });
  }
  return out;
}

/**
 * /(student)/home: 마이페이지 count probe + room/thread/payment/subscription 요약(더미 없음)
 */
export async function loadStudentHomeData(
  supabase: SupabaseClient,
  args: { userId: string; profile: UserRow | null; profileError: string | null }
): Promise<StudentHomeData> {
  const [mypage, rooms, subFetch, payFetch] = await Promise.all([
    loadStudentMypageBundle(supabase, args.userId, args.profile, args.profileError),
    fetchRoomsForUser(supabase, "student", args.userId),
    fetchSubscriptionRowsForStudent(supabase, args.userId, 8),
    fetchRecentPaymentsForStudent(supabase, args.userId, 3),
  ]);

  const roomIds = (rooms.rows ?? [])
    .map((r) => (typeof r.id === "string" ? r.id : null))
    .filter((x): x is string => x !== null);
  const threadStats = await aggregateThreadStatsForRooms(supabase, roomIds, { maxRooms: 12, mode: "student" });

  const subLines = await enrichMentorLines(supabase, subFetch.table, subFetch.probe, subFetch.rows);
  const weeklyRow = (subFetch.rows[0] as Row | undefined) ?? null;
  const weeklyQuotaHint = weeklyQuestionsLabel(weeklyRow);

  return {
    mypage,
    rooms,
    threadStats,
    subscriptionLines: { lines: subLines, error: subFetch.error, probe: subFetch.probe },
    recentPayments: { table: payFetch.table, rows: payFetch.rows, error: payFetch.error, probe: payFetch.probe },
    weeklyQuotaHint,
  };
}

export function paymentRowLabel(r: Row, createdKey = "created_at") {
  const t = r[createdKey] != null ? String(r[createdKey]) : "—";
  return `${pickLineFromPaymentRow(r)} · ${t.slice(0, 10)}`;
}
