import type { SupabaseClient } from "@supabase/supabase-js";
import {
  firstReadableCustomTable,
  loadCustomPostById,
  pickDisplayField,
} from "@/lib/customRequest/customRequestQueries";
import { pickOrderStudentId } from "@/lib/customRequest/orderRoomMutations";
import { maskStudentName } from "@/lib/reviews/reviewDisplay";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

type MentorStudentNameFields = { full_name: string | null; nickname: string | null };

/** nickname > maskStudentName(full_name) > "의뢰자" — UUID 노출 없음 */
export function formatMentorStudentDisplayName(user: MentorStudentNameFields | null | undefined): string {
  if (!user) return "의뢰자";
  if (user.nickname?.trim()) return user.nickname.trim();
  if (user.full_name?.trim()) return maskStudentName(user.full_name, user.nickname);
  return "의뢰자";
}

/** 멘토 세션 — get_mentor_student_nicknames RPC로 단일 학생 표시명 조회(실패 시 "의뢰자"). */
export async function fetchMentorStudentDisplayName(
  supabase: SupabaseClient,
  studentId: string | null | undefined
): Promise<string> {
  const sid = typeof studentId === "string" ? studentId.trim() : "";
  if (!sid) return "의뢰자";
  try {
    const { data } = await supabase.rpc("get_mentor_student_nicknames", {
      p_student_ids: [sid],
    });
    const row = ((data as Row[]) ?? []).find((u) => u.id === sid);
    if (!row) return "의뢰자";
    return formatMentorStudentDisplayName({
      full_name: typeof row.full_name === "string" ? row.full_name : null,
      nickname: typeof row.nickname === "string" ? row.nickname : null,
    });
  } catch {
    return "의뢰자";
  }
}

function pickApplicationIdFromOrderRow(r: Row): string | null {
  for (const k of ["application_id", "custom_request_application_id", "selected_application_id", "bid_id"] as const) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickPostIdFromOrderRow(r: Row): string | null {
  for (const k of ["post_id", "custom_request_post_id", "request_id", "custom_request_id"] as const) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * 대시보드·수락된 의뢰 목록 — 주문 행에 post/application/학생 닉네임 힌트를 merge(표시 전용).
 * 학생 이름은 get_mentor_student_nicknames RPC(멘토 주문 연결 학생만). RLS로 post가 막히면 application 마감만 보강될 수 있음.
 */
export async function enrichMentorDashboardOrderRows(
  supabase: SupabaseClient,
  mentorId: string,
  orders: Row[]
): Promise<Row[]> {
  if (orders.length === 0) return orders;

  const appIds = [...new Set(orders.map(pickApplicationIdFromOrderRow).filter(Boolean))] as string[];
  const postIds = [...new Set(orders.map(pickPostIdFromOrderRow).filter(Boolean))] as string[];
  const studentIds = [...new Set(orders.map((o) => pickOrderStudentId(o)).filter(Boolean))];

  const appsById = new Map<string, Row>();
  const appTableProbe = await firstReadableCustomTable(supabase, [
    "custom_request_applications",
    "request_applications",
    "custom_bids",
  ]);
  if (appTableProbe.table && appIds.length > 0) {
    const { column: mentorCol } = await pickExistingColumn(supabase, appTableProbe.table, [
      "mentor_id",
      "applicant_id",
      "user_id",
      "proposer_id",
    ]);
    let q = supabase.from(appTableProbe.table).select("*").in("id", appIds);
    if (mentorCol) {
      q = q.eq(mentorCol, mentorId);
    }
    const { data } = await q;
    for (const row of (data as Row[]) ?? []) {
      const id = typeof row.id === "string" ? row.id : "";
      if (id) appsById.set(id, row);
    }
  }

  const postsById = new Map<string, Row>();
  await Promise.all(
    postIds.slice(0, 12).map(async (pid) => {
      const { row } = await loadCustomPostById(supabase, pid);
      if (row) postsById.set(pid, row);
    })
  );

  const usersById = new Map<string, { full_name: string | null; nickname: string | null }>();
  if (studentIds.length > 0) {
    const { data } = await supabase.rpc("get_mentor_student_nicknames", {
      p_student_ids: studentIds,
    });
    for (const u of (data as Row[]) ?? []) {
      const id = typeof u.id === "string" ? u.id : "";
      if (id) {
        usersById.set(id, {
          full_name: typeof u.full_name === "string" ? u.full_name : null,
          nickname: typeof u.nickname === "string" ? u.nickname : null,
        });
      }
    }
  }

  return orders.map((order) => {
    const merged: Row = { ...order };
    const appId = pickApplicationIdFromOrderRow(order);
    const app = appId ? appsById.get(appId) : null;
    const postId = pickPostIdFromOrderRow(order);
    const post = postId ? postsById.get(postId) : null;

    if (post) {
      const title = pickDisplayField(post, ["title", "subject", "goal"]);
      if (title !== "—") merged.post_title = title;
    }

    if (app) {
      const due = pickDisplayField(app, ["proposed_due", "delivery_at", "due_proposed"]);
      if (due !== "—" && pickDisplayField(merged, ["deadline", "due_at", "due_date", "close_at"]) === "—") {
        merged.deadline = due;
      }
    }

    const sid = pickOrderStudentId(order);
    const user = sid ? usersById.get(sid) : null;
    if (user) {
      merged.student_name = formatMentorStudentDisplayName(user);
    } else if (sid) {
      merged.student_name = sid.length > 10 ? `의뢰자 ····${sid.slice(-6)}` : `의뢰자 ${sid}`;
    }

    return merged;
  });
}
