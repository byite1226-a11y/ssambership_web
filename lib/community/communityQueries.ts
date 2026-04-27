import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

function fmt(err: PostgrestError | null): string | null {
  return err ? err.message : null;
}

async function firstReadableTable(supabase: SupabaseClient, candidates: readonly string[]): Promise<{ table: string | null; error: string | null }> {
  let last = "no table candidates";
  for (const table of candidates) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (!error) return { table, error: null };
    last = error.message;
  }
  return { table: null, error: last };
}

async function selectOrdered<T extends Row>(
  run: (orderBy: string | null) => Promise<{ data: T[] | null; error: PostgrestError | null }>
): Promise<{ rows: T[]; error: string | null }> {
  for (const col of ["created_at", "updated_at", "published_at", "id"] as const) {
    const res = await run(col);
    if (!res.error) return { rows: (res.data as T[] | null) ?? [], error: null };
    if (!/column|does not exist|order/i.test(res.error.message)) {
      return { rows: [], error: res.error.message };
    }
  }
  const fb = await run(null);
  return { rows: (fb.data as T[] | null) ?? [], error: fmt(fb.error) };
}

export const COMMUNITY_DATA_POINTS = [
  "shortform_posts (숏폼 전용)",
  "community_posts (게시판 전용 — 숏과 분리)",
  "comments (게시/숏 공통, post_type/ fk 구분 예정)",
  "reports (신고)",
  "users / mentor_profiles (작성자·role 뱃지)",
  "source / rights fields (출처·권리)",
] as const;

export async function listShortformPosts(
  supabase: SupabaseClient,
  limit: number
): Promise<{ rows: Row[]; table: string | null; error: string | null }> {
  const probe = await firstReadableTable(supabase, ["shortform_posts"] as const);
  if (!probe.table) return { rows: [], table: null, error: probe.error };
  const t = probe.table;
  const res = await selectOrdered<Row>(async (orderBy) => {
    let q = supabase.from(t).select("*");
    if (orderBy) q = q.order(orderBy, { ascending: false });
    return await q.limit(limit);
  });
  return { ...res, table: t, error: res.error };
}

export async function getShortformPost(
  supabase: SupabaseClient,
  id: string
): Promise<{ row: Row | null; table: string | null; error: string | null }> {
  const probe = await firstReadableTable(supabase, ["shortform_posts"] as const);
  if (!probe.table) return { row: null, table: null, error: probe.error };
  const { data, error } = await supabase.from(probe.table).select("*").eq("id", id).maybeSingle();
  if (error) return { row: null, table: probe.table, error: error.message };
  return { row: (data as Row) ?? null, table: probe.table, error: null };
}

export async function listBoardPosts(
  supabase: SupabaseClient,
  limit: number
): Promise<{ rows: Row[]; table: string | null; error: string | null }> {
  const probe = await firstReadableTable(supabase, ["community_posts"] as const);
  if (!probe.table) return { rows: [], table: null, error: probe.error };
  const t = probe.table;
  const res = await selectOrdered<Row>(async (orderBy) => {
    let q = supabase.from(t).select("*");
    if (orderBy) q = q.order(orderBy, { ascending: false });
    return await q.limit(limit);
  });
  return { ...res, table: t, error: res.error };
}

export async function getBoardPost(
  supabase: SupabaseClient,
  id: string
): Promise<{ row: Row | null; table: string | null; error: string | null }> {
  const probe = await firstReadableTable(supabase, ["community_posts"] as const);
  if (!probe.table) return { row: null, table: null, error: probe.error };
  const { data, error } = await supabase.from(probe.table).select("*").eq("id", id).maybeSingle();
  if (error) return { row: null, table: probe.table, error: error.message };
  return { row: (data as Row) ?? null, table: probe.table, error: null };
}

export function pickTitle(r: Row): string {
  const k = ["title", "headline", "subject"] as const;
  for (const x of k) {
    if (typeof r[x] === "string" && (r[x] as string).trim()) return r[x] as string;
  }
  return "제목 없음";
}

export function pickExcerpt(r: Row): string {
  const k = ["body", "content", "text", "excerpt", "summary"] as const;
  for (const x of k) {
    if (typeof r[x] === "string" && (r[x] as string).trim()) {
      const s = r[x] as string;
      return s.length > 120 ? `${s.slice(0, 120)}…` : s;
    }
  }
  return "";
}
