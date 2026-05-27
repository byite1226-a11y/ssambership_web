import type { UserRow } from "@/lib/types/user";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { rowsFromSupabaseData } from "@/lib/qna/safeSelect";
import { fetchMentorProfileRow } from "@/lib/mentor/mentorProfileQueries";
import type { AppRole } from "@/lib/types/user";

type RpcError = { message?: string; code?: string; details?: string; hint?: string };

/** PostgREST: 함수 미배포 시 404/스키마 캐시 오류 등 */
function isMissingOrRpcError(e: RpcError | null | undefined): boolean {
  if (!e) return false;
  const c = e.code ?? "";
  const m = (e.message ?? "") + (e.hint ?? "");
  if (c === "PGRST202" || c === "42883") return true;
  if (/function\s+public\./i.test(m) && /not exist|schema cache|Could not find/i.test(m)) return true;
  return /does not exist|schema cache|Could not find the function/i.test(m);
}

function mapRpcUserToUserRow(r: Record<string, unknown>): UserRow {
  return {
    id: String(r.id),
    role: (r.role as AppRole) ?? "mentor",
    status: String(r.status ?? "active"),
    full_name: (r.full_name as string | null) ?? null,
    nickname: (r.nickname as string | null) ?? null,
    email: null,
    grade_level: (r.grade_level as string | null) ?? null,
    student_status: (r.student_status as string | null) ?? null,
    birth_date: (r.birth_date as string | null) ?? null,
    terms_agreed_at: (r.terms_agreed_at as string | null) ?? null,
    privacy_agreed_at: (r.privacy_agreed_at as string | null) ?? null,
    marketing_agreed: Boolean(r.marketing_agreed),
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: String(r.updated_at ?? r.created_at ?? new Date().toISOString()),
  };
}

/**
 * P0: 멘토 공개(목록) — `mentor_directory_list` RPC, 없으면 `users` 직접(001 RLS면 본인만).
 */
export async function loadMentorDirectoryUserRows(
  supabase: SupabaseClient,
  pLimit: number
): Promise<{ users: UserRow[]; error: string | null; usedRpc: boolean; probe: string }> {
  const { data, error } = await supabase.rpc("mentor_directory_list", { p_limit: pLimit });
  if (error && isMissingOrRpcError(error)) {
    const fb = await supabase
      .from("users")
      .select(
        "id, role, status, full_name, nickname, email, grade_level, student_status, birth_date, terms_agreed_at, privacy_agreed_at, marketing_agreed, created_at, updated_at"
      )
      .eq("role", "mentor")
      .order("created_at", { ascending: false })
      .limit(pLimit);
    if (fb.error) {
      console.error("[mentors] users table fallback failed", {
        message: fb.error.message,
        code: fb.error.code,
        details: fb.error.details,
        hint: fb.error.hint,
      });
      return { users: [], error: fb.error.message, usedRpc: false, probe: "users(table): " + fb.error.message };
    }
    return {
      users: (fb.data as UserRow[] | null) ?? [],
      error: null,
      usedRpc: false,
      probe: "users(table) fallback (mentor_directory_list 미배포 또는 RPC 오류)",
    };
  }
  if (error) {
    console.error("[mentors] mentor_directory_list RPC failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      supabaseUrlExists: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
    });
    return { users: [], error: error.message, usedRpc: true, probe: "mentor_directory_list: " + error.message };
  }
  const rows = rowsFromSupabaseData(data);
  return {
    users: rows.map((r) => mapRpcUserToUserRow(r)),
    error: null,
    usedRpc: true,
    probe: "mentor_directory_list(RPC)",
  };
}

type ProfileRow = Record<string, unknown>;

/**
 * P0: `mentor_profiles` 배치 — `mentor_profiles_for_directory` RPC, 없으면 IN 쿼리(본인 RLS).
 */
export async function loadMentorProfilesForDirectory(
  supabase: SupabaseClient,
  ids: string[]
): Promise<{ byUser: Map<string, ProfileRow>; error: string | null; probe: string }> {
  const byUser = new Map<string, ProfileRow>();
  if (ids.length === 0) {
    return { byUser, error: null, probe: "skip" };
  }
  const { data, error } = await supabase.rpc("mentor_profiles_for_directory", { p_ids: ids });
  if (error && isMissingOrRpcError(error)) {
    const { data: profs, error: pErr } = await supabase.from("mentor_profiles").select("*").in("user_id", ids);
    if (pErr) {
      return { byUser, error: pErr.message, probe: "mentor_profiles(table): " + pErr.message };
    }
    for (const row of (profs as ProfileRow[] | null) ?? []) {
      const uid = row.user_id != null ? String(row.user_id) : null;
      if (uid) byUser.set(uid, row);
    }
    return { byUser, error: null, probe: "mentor_profiles(table) fallback" };
  }
  if (error) {
    console.error("[mentors] mentor_profiles_for_directory RPC failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      supabaseUrlExists: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
    });
    return { byUser, error: error.message, probe: "mentor_profiles_for_directory: " + error.message };
  }
  const profileRows = rowsFromSupabaseData(data) as ProfileRow[];
  for (const row of profileRows) {
    const uid = row.user_id != null ? String(row.user_id) : null;
    if (uid) byUser.set(uid, row);
  }
  return { byUser, error: null, probe: "mentor_profiles_for_directory(RPC)" };
}

/**
 * P0: 멘토 1인 — `mentor_user_public` RPC(이메일 없음), 없으면 `getUserProfileById` (RLS).
 */
export async function getMentorUserPublic(
  supabase: SupabaseClient,
  mentorId: string
): Promise<{ data: UserRow | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("mentor_user_public", { p_mentor_id: mentorId });
  if (error && isMissingOrRpcError(error)) {
    return getUserProfileById(supabase, mentorId);
  }
  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  const arr = rowsFromSupabaseData(data);
  const one = arr?.[0];
  if (one) {
    return { data: mapRpcUserToUserRow(one), error: null };
  }
  return { data: null, error: null };
}

/**
 * P0: 상세용 `mentor_profiles` 1인 — batch RPC 1id 또는 table fallback
 */
export async function fetchMentorProfileForPublicMentor(
  supabase: SupabaseClient,
  mentorId: string
): Promise<{ row: ProfileRow | null; error: string | null }> {
  const b = await loadMentorProfilesForDirectory(supabase, [mentorId]);
  if (b.error) {
    return { row: null, error: b.error };
  }
  const r = b.byUser.get(mentorId) ?? null;
  if (r) {
    return { row: r, error: null };
  }
  return fetchMentorProfileRow(supabase, mentorId);
}
