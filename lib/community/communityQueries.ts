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

export type CommunityPostType = "board" | "shortform";

/** UI·액션과 맞춘 댓글(내부 id 등 비노출) */
export type CommunityCommentListItem = {
  id: string;
  body: string;
  createdAt: string;
  authorLabel: string;
  status: string;
};

/**
 * community_comments — 게시 유형 + 글 id 별. 테이블 미배포 시 rows 빈 배열(오류 메시지 없이)
 */
export async function loadCommunityComments(
  supabase: SupabaseClient,
  postType: CommunityPostType,
  postId: string
): Promise<{ rows: CommunityCommentListItem[]; error: string | null }> {
  const { data, error } = await supabase
    .from("community_comments")
    .select("id, body, created_at, author_label, status")
    .eq("post_type", postType)
    .eq("post_id", postId)
    .eq("status", "visible")
    .order("created_at", { ascending: true });

  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message)) {
      return { rows: [], error: null };
    }
    return { rows: [], error: "댓글을 불러오지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  const list = (data as Record<string, unknown>[]) ?? [];
  const rows: CommunityCommentListItem[] = list.map((r) => {
    const created = r.created_at;
    return {
      id: String(r.id ?? ""),
      body: String(r.body ?? ""),
      createdAt: typeof created === "string" ? created : new Date().toISOString(),
      authorLabel:
        typeof r.author_label === "string" && r.author_label.trim() ? r.author_label.trim() : "쌤버십 회원",
      status: String(r.status ?? "visible"),
    };
  });
  return { rows, error: null };
}
