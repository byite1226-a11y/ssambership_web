import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { AdminListParams } from "@/lib/admin/adminListParams";
import { rangeForPage, isStatusActive } from "@/lib/admin/adminListParams";

export type AdminUserRow = {
  id: string;
  role: string;
  status: string;
  full_name: string | null;
  nickname: string | null;
  email: string | null;
  suspended_until: string | null;
  status_reason: string | null;
  status_changed_at: string | null;
  created_at: string | null;
  warning_count?: number;
};

/** 주어진 user id 들의 활성 경고 수를 맵으로 반환(테이블 미적용 시 빈 맵). */
async function activeWarningCounts(
  admin: ReturnType<typeof createServiceRoleClient>,
  userIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!userIds.length) return map;
  try {
    const { data, error } = await admin
      .from("user_warnings")
      .select("user_id")
      .in("user_id", userIds)
      .eq("is_active", true);
    if (error) return map;
    for (const r of (data as Array<{ user_id?: string }>) ?? []) {
      const id = r.user_id ? String(r.user_id) : "";
      if (id) map.set(id, (map.get(id) ?? 0) + 1);
    }
  } catch {
    /* table not present */
  }
  return map;
}

export type AdminUsersPaged = {
  rows: AdminUserRow[];
  totalCount: number;
  error: string | null;
};

const SELECT =
  "id, role, status, full_name, nickname, email, suspended_until, status_reason, status_changed_at, created_at";

/** 관리자 계정 목록 — 서비스 롤로 전체 사용자 조회(검색·상태필터·페이지네이션). */
export async function loadAdminUsersListPaged(params: AdminListParams): Promise<AdminUsersPaged> {
  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    return { rows: [], totalCount: 0, error: e instanceof Error ? e.message : "서비스 키 오류" };
  }

  const { from, to } = rangeForPage(params);
  let q = admin.from("users").select(SELECT, { count: "exact" });

  if (isStatusActive(params.status)) {
    q = q.eq("status", params.status);
  }
  if (params.search) {
    const s = params.search.replace(/[%,]/g, " ").trim();
    if (s) {
      q = q.or(
        [`email.ilike.%${s}%`, `nickname.ilike.%${s}%`, `full_name.ilike.%${s}%`, `id.eq.${s}`]
          .join(",")
      );
    }
  }

  const { data, error, count } = await q
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    // id.eq 가 UUID 가 아니면 실패할 수 있음 — id 조건 제거 후 재시도
    if (params.search) {
      const s = params.search.replace(/[%,]/g, " ").trim();
      let q2 = admin.from("users").select(SELECT, { count: "exact" });
      if (isStatusActive(params.status)) q2 = q2.eq("status", params.status);
      q2 = q2.or([`email.ilike.%${s}%`, `nickname.ilike.%${s}%`, `full_name.ilike.%${s}%`].join(","));
      const retry = await q2.order("created_at", { ascending: false }).range(from, to);
      if (!retry.error) {
        return {
          rows: (retry.data as AdminUserRow[]) ?? [],
          totalCount: retry.count ?? 0,
          error: null,
        };
      }
    }
    return { rows: [], totalCount: 0, error: error.message };
  }

  const rows = (data as AdminUserRow[]) ?? [];
  const warnMap = await activeWarningCounts(admin, rows.map((r) => r.id));
  for (const r of rows) r.warning_count = warnMap.get(r.id) ?? 0;
  return { rows, totalCount: count ?? 0, error: null };
}

export async function countAdminUsersByStatus(): Promise<Record<string, number>> {
  const out: Record<string, number> = { active: 0, suspended: 0, banned: 0, all: 0 };
  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return out;
  }
  const statuses = ["active", "suspended", "banned"] as const;
  await Promise.all(
    statuses.map(async (st) => {
      const { count } = await admin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("status", st);
      out[st] = count ?? 0;
    })
  );
  const { count: all } = await admin.from("users").select("id", { count: "exact", head: true });
  out.all = all ?? 0;
  return out;
}
