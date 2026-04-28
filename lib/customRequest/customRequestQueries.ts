import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { fetchMentorProfileForPublicMentor, getMentorUserPublic } from "@/lib/auth/mentorPublicRead";
import { buildMentorProfileDisplay, type MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

function fmt(e: PostgrestError | null): string | null {
  return e ? e.message : null;
}

/** Staging(003)은 custom_request_order_id — legacy 호환 */
export const ORDER_TO_DELIVERABLE_FK_CANDIDATES = [
  "custom_request_order_id",
  "order_id",
  "custom_order_id",
  "request_order_id",
] as const;

/**
 * 읽기·count: OR 탐지 없이 SSOT 우선 단일 열(003: custom_request_order_id).
 * insert 후보(ORDER_TO_DELIVERABLE_FK_CANDIDATES)와 동일 후보나 **우선순위가 고정**됨.
 */
export const ORDER_CHILD_FK_READ_PRIORITY = [
  "custom_request_order_id",
  "order_id",
  "custom_order_id",
  "request_order_id",
] as const;

export async function resolveOrderChildFkReadColumn(
  supabase: SupabaseClient,
  table: string
): Promise<{ column: string | null; error: string | null }> {
  for (const col of ORDER_CHILD_FK_READ_PRIORITY) {
    const { error } = await supabase.from(table).select(col).limit(1);
    if (!error) {
      return { column: col, error: null };
    }
  }
  return { column: null, error: "no order child fk column" };
}

/**
 * 003: custom_request_order_id가 본 키이면 order_id·custom_order_id·request_order_id에 동일 UUID를 미러(열 있을 때만).
 */
export async function mergeOrderChildIdMirrorColumns(
  supabase: SupabaseClient,
  table: string,
  orderId: string,
  base: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { ...base };
  for (const col of ["order_id", "custom_order_id", "request_order_id"] as const) {
    if (out[col] !== undefined) {
      continue;
    }
    const { error } = await supabase.from(table).select(col).limit(1);
    if (!error) {
      out[col] = orderId;
    }
  }
  return out;
}

export async function firstReadableCustomTable(
  supabase: SupabaseClient,
  candidates: readonly string[]
): Promise<{ table: string | null; error: string }> {
  let last = "no candidates";
  for (const table of candidates) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (!error) return { table, error: "" };
    last = error.message;
  }
  return { table: null, error: last };
}

async function selectWithOrder<T extends Row>(
  supabase: SupabaseClient,
  table: string,
  limit: number
): Promise<{ rows: T[]; error: string | null }> {
  const orderCols = ["created_at", "updated_at", "id", "published_at"] as const;
  for (const col of orderCols) {
    const { data, error } = await supabase.from(table).select("*").order(col, { ascending: false }).limit(limit);
    if (!error) return { rows: (data as T[] | null) ?? [], error: null };
    if (!/column|does not exist|schema cache/i.test(error.message)) {
      return { rows: [], error: error.message };
    }
  }
  const { data, error } = await supabase.from(table).select("*").limit(limit);
  return { rows: (data as T[] | null) ?? [], error: fmt(error) };
}

export type CustomListResult = {
  table: string | null;
  sourceNote: string;
  rows: Row[];
  error: string | null;
};

export async function loadRecentCustomRequestPosts(supabase: SupabaseClient, limit = 8): Promise<CustomListResult> {
  const { table, error: te } = await firstReadableCustomTable(supabase, ["custom_request_posts", "custom_requests", "request_posts"]);
  if (!table) {
    return { table: null, sourceNote: te, rows: [], error: te };
  }
  const { rows, error } = await selectWithOrder<Row>(supabase, table, limit);
  return { table, sourceNote: "최근 의뢰(공개 정책에 맞는 필터는 후속)", rows: error ? [] : rows, error };
}

export type CustomCategoryRow = { id?: string; name?: string; label?: string; title?: string; slug?: string };

export async function loadCustomRequestCategories(supabase: SupabaseClient, limit = 30): Promise<{
  rows: CustomCategoryRow[];
  source: "table" | "static";
  table: string | null;
  error: string | null;
}> {
  const { table, error: te } = await firstReadableCustomTable(supabase, ["custom_request_categories", "categories", "request_categories"]);
  if (!table) {
    return { rows: [], source: "static" as const, table: null, error: te };
  }
  const { data, error } = await supabase.from(table).select("*").limit(limit);
  if (error) {
    return { rows: [], source: "table", table, error: error.message };
  }
  const list = (data as Row[] | null) ?? [];
  return { rows: list as CustomCategoryRow[], source: "table", table, error: null };
}

export function pickMentorIdFromApplication(r: Row): string | null {
  for (const k of ["mentor_id", "applicant_id", "user_id", "proposer_id"] as const) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

export function pickApplicationRowId(r: Row): string | null {
  const v = r.id;
  if (typeof v === "string" && v) return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function applicationRowMatchesPostId(row: Row, postId: string): boolean {
  for (const k of ["post_id", "request_id", "custom_request_id", "custom_request_post_id"] as const) {
    if (k in row && row[k] != null && String(row[k]) === postId) return true;
  }
  return false;
}

export function verifyApplicationForPost(row: Row | null, postId: string): { ok: boolean; detail: string } {
  if (!row) return { ok: false, detail: "application row 없음" };
  if (applicationRowMatchesPostId(row, postId)) return { ok: true, detail: "post fk 일치" };
  return { ok: false, detail: "postId 불일치" };
}

export async function loadApplicationById(
  supabase: SupabaseClient,
  applicationId: string
): Promise<{ row: Row | null; table: string | null; error: string | null }> {
  const tProbe = await firstReadableCustomTable(supabase, ["custom_request_applications", "request_applications", "custom_bids"]);
  if (!tProbe.table) {
    return { row: null, table: null, error: tProbe.error || null };
  }
  const t = tProbe.table;
  const { data, error } = await supabase.from(t).select("*").eq("id", applicationId).maybeSingle();
  if (error) {
    return { row: null, table: t, error: error.message };
  }
  return { row: (data as Row) ?? null, table: t, error: null };
}

/**
 * 이미 이 의뢰·학생에 대한 주문이 있는지(1명 선정 = 1주문 정책)
 */
export async function findOrderForPostAndStudent(
  supabase: SupabaseClient,
  postId: string,
  studentId: string
): Promise<{ row: Row | null; table: string | null; orderId: string | null; probe: string; error: string | null }> {
  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "custom_orders", "request_orders"]);
  if (!oT.table) {
    return { row: null, table: null, orderId: null, probe: oT.error, error: oT.error || null };
  }
  const t = oT.table;
  const { column: postCol } = await pickExistingColumn(supabase, t, [
    "post_id",
    "custom_request_post_id",
    "request_id",
    "custom_request_id",
  ]);
  const { column: stuCol } = await pickExistingColumn(supabase, t, [
    "student_id",
    "buyer_id",
    "user_id",
    "client_id",
    "author_id",
    "requester_id",
  ]);
  if (!postCol || !stuCol) {
    return { row: null, table: t, orderId: null, probe: "post+student FK 미식별", error: "order 테이블 FK로 필터 불가" };
  }
  const { data, error } = await supabase.from(t).select("*").eq(postCol, postId).eq(stuCol, studentId).limit(1).maybeSingle();
  if (error) {
    return { row: null, table: t, orderId: null, probe: error.message, error: error.message };
  }
  const row = (data as Row) ?? null;
  const rid = row ? pickOrderIdFromRow(row) : null;
  return { row, table: t, orderId: rid, probe: `${t}.${postCol}+${stuCol}`, error: null };
}

function pickOrderIdFromRow(row: Row): string | null {
  return pickApplicationRowId(row);
}

export type PostAttachmentListItem = {
  id: string;
  original_filename: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
};

/**
 * 의뢰 등록 첨부(메타) — RLS: 작성·멘토·admin만 행 조회. 비로그인·비참여는 0행.
 */
export async function loadPostAttachments(
  supabase: SupabaseClient,
  postId: string
): Promise<{ rows: PostAttachmentListItem[]; error: string | null }> {
  const { data, error } = await supabase
    .from("custom_request_post_attachments")
    .select("id, original_filename, file_size_bytes, mime_type, created_at")
    .eq("custom_request_post_id", postId)
    .order("created_at", { ascending: true });
  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message)) {
      return { rows: [], error: null };
    }
    return { rows: [], error: error.message };
  }
  const list = (data as Row[] | null) ?? [];
  return {
    rows: list.map((r) => ({
      id: String(r.id),
      original_filename: String(r.original_filename ?? "파일"),
      file_size_bytes: typeof r.file_size_bytes === "number" ? r.file_size_bytes : null,
      mime_type: typeof r.mime_type === "string" ? r.mime_type : null,
      created_at:
        r.created_at != null && (typeof r.created_at === "string" || r.created_at instanceof Date)
          ? String(r.created_at)
          : "",
    })),
    error: null,
  };
}

export async function loadCustomPostById(
  supabase: SupabaseClient,
  postId: string
): Promise<{ row: Row | null; table: string | null; error: string | null }> {
  const { table, error: te } = await firstReadableCustomTable(supabase, ["custom_request_posts", "custom_requests", "request_posts"]);
  if (!table) {
    return { row: null, table: null, error: te || null };
  }
  const { data, error } = await supabase.from(table).select("*").eq("id", postId).maybeSingle();
  if (error) {
    return { row: null, table, error: error.message };
  }
  return { row: (data as Row) ?? null, table, error: null };
}

/**
 * 공개 상세 페이지: 작성자·동의어 컬럼은 RLS로 직접 SELECT 가능.
 * 멘토는 crp_select에 없어 0행 → `get_public_custom_request_post_for_browse` RPC로 최소 열만 조회(006 SQL).
 */
export async function loadCustomPostForPublicDetail(
  supabase: SupabaseClient,
  postId: string
): Promise<{ row: Row | null; table: string | null; error: string | null }> {
  const direct = await loadCustomPostById(supabase, postId);
  if (direct.error && !direct.row) {
    return direct;
  }
  if (direct.row) {
    return direct;
  }
  if (!direct.table || direct.table !== "custom_request_posts") {
    return direct;
  }
  const { data, error } = await supabase.rpc("get_public_custom_request_post_for_browse", { p_post_id: postId }).maybeSingle();
  if (error) {
    const missingRpc = /function|does not exist|schema cache/i.test(error.message);
    if (missingRpc) {
      return { row: null, table: direct.table ?? "custom_request_posts", error: direct.error };
    }
    return { row: null, table: direct.table ?? "custom_request_posts", error: error.message };
  }
  if (!data) {
    return { row: null, table: direct.table ?? "custom_request_posts", error: null };
  }
  return { row: data as Row, table: "custom_request_posts", error: null };
}

/** 의뢰자 = 현재 user 인지(컬럼명 후보) */
export function isAuthorOfPost(userId: string, row: Row | null): { ok: boolean; detail: string } {
  if (!row) return { ok: false, detail: "row 없음" };
  const col = pickAuthorColumn(row);
  if (!col) return { ok: false, detail: "author/sponsor 컬럼 미식별" };
  const v = row[col];
  if (v === userId) return { ok: true, detail: col };
  return { ok: false, detail: `${col} 불일치` };
}

function pickAuthorColumn(row: Row): string | null {
  for (const k of ["student_id", "author_id", "user_id", "requester_id", "client_id", "owner_id"]) {
    if (k in row) return k;
  }
  return null;
}

export async function loadApplicationsForPost(
  supabase: SupabaseClient,
  postId: string,
  limit = 40
): Promise<CustomListResult & { postTable: string | null }> {
  const tProbe = await firstReadableCustomTable(supabase, ["custom_request_applications", "request_applications", "custom_bids"]);
  if (!tProbe.table) {
    return { table: null, postTable: null, sourceNote: tProbe.error, rows: [], error: tProbe.error };
  }
  const t = tProbe.table;
  const { column, error: colErr } = await pickExistingColumn(supabase, t, ["post_id", "request_id", "custom_request_id", "custom_request_post_id"]);
  if (!column) {
    const { rows, error } = await selectWithOrder<Row>(supabase, t, limit);
    return {
      table: t,
      postTable: t,
      sourceNote: colErr ? `${colErr} — 전체 샘플` : "post_id FK 없음, 최근 전체(필터 후속)",
      rows: error ? [] : rows,
      error,
    };
  }
  const { data, error } = await supabase
    .from(t)
    .select("*")
    .eq(column, postId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (!/order|column/i.test(error.message)) {
      return { table: t, postTable: null, sourceNote: error.message, rows: [], error: error.message };
    }
    const fb = await supabase.from(t).select("*").eq(column, postId).limit(limit);
    return { table: t, postTable: null, sourceNote: "order 생략", rows: (fb.data as Row[]) ?? [], error: fmt(fb.error) };
  }
  return { table: t, postTable: t, sourceNote: `${t}.${column} = post`, rows: (data as Row[]) ?? [], error: null };
}

export async function loadOrderBundle(
  supabase: SupabaseClient,
  orderId: string
): Promise<{
  order: { row: Row | null; table: string | null; error: string | null };
  deliverables: CustomListResult;
  disputes: CustomListResult;
}> {
  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "custom_orders", "request_orders"]);
  let orderRow: Row | null = null;
  let orderErr: string | null = oT.error || null;
  if (oT.table) {
    const { data, error } = await supabase.from(oT.table).select("*").eq("id", orderId).maybeSingle();
    if (error) {
      orderErr = error.message;
    } else {
      orderRow = (data as Row) ?? null;
    }
  }

  const dT = await firstReadableCustomTable(supabase, ["custom_order_deliverables", "order_deliverables", "request_deliverables"]);
  let deliv: CustomListResult = { table: null, sourceNote: dT.error, rows: [], error: dT.error };
  if (dT.table && oT.table) {
    const { column: fk } = await pickExistingColumn(supabase, dT.table, [...ORDER_TO_DELIVERABLE_FK_CANDIDATES]);
    if (fk) {
      const { data, error } = await supabase
        .from(dT.table)
        .select("*")
        .eq(fk, orderId)
        .order("version", { ascending: false });
      if (error) {
        const r2 = await supabase.from(dT.table).select("*").eq(fk, orderId);
        deliv = {
          table: dT.table,
          sourceNote: "납품 버전(스키마에 version 없으면 생략)",
          rows: (r2.data as Row[]) ?? [],
          error: fmt(r2.error),
        };
      } else {
        deliv = { table: dT.table, sourceNote: "deliverables", rows: (data as Row[]) ?? [], error: null };
      }
    } else {
      const { rows, error } = await selectWithOrder<Row>(supabase, dT.table, 20);
      deliv = { table: dT.table, sourceNote: "order_id FK 없음(후속)", rows, error };
    }
  } else if (dT.table) {
    const { rows, error } = await selectWithOrder<Row>(supabase, dT.table, 20);
    deliv = { table: dT.table, sourceNote: oT.table ? "order 누락" : dT.error, rows, error };
  }

  const dis = await firstReadableCustomTable(supabase, ["disputes", "order_disputes", "custom_disputes"]);
  let disputes: CustomListResult = { table: null, sourceNote: dis.error, rows: [], error: dis.error };
  if (dis.table) {
    const { column: fk } = await pickExistingColumn(supabase, dis.table, [
      "custom_request_order_id",
      "order_id",
      "custom_order_id",
      "request_order_id",
    ]);
    if (fk) {
      const { data, error } = await supabase.from(dis.table).select("*").eq(fk, orderId).limit(20);
      disputes = { table: dis.table, sourceNote: "분쟁(조회만)", rows: (data as Row[]) ?? [], error: fmt(error) };
    } else {
      const { rows, error } = await selectWithOrder<Row>(supabase, dis.table, 10);
      disputes = { table: dis.table, sourceNote: "order FK 없음", rows, error };
    }
  }

  return {
    order: { row: orderRow, table: oT.table, error: orderRow ? null : (orderErr ?? (oT.table ? "주문 없음" : oT.error)) },
    deliverables: deliv,
    disputes,
  };
}

export function pickDisplayField(row: Row, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "—";
}

export function maskContact(s: string): string {
  if (s.length <= 2) return "**";
  return s[0] + "·".repeat(Math.min(4, s.length - 2)) + s[s.length - 1];
}

export type EnrichedApplication = {
  row: Row;
  mentorId: string | null;
  applicationId: string | null;
  display: MentorProfileDisplay | null;
};

export async function enrichApplicationRows(supabase: SupabaseClient, rows: Row[]): Promise<EnrichedApplication[]> {
  const out: EnrichedApplication[] = [];
  for (const row of rows) {
    const mentorId = pickMentorIdFromApplication(row);
    const applicationId = pickApplicationRowId(row);
    if (!mentorId) {
      out.push({ row, mentorId: null, applicationId, display: null });
      continue;
    }
    const [{ row: pRow, error: pErr }, { data: uRow }] = await Promise.all([
      fetchMentorProfileForPublicMentor(supabase, mentorId),
      getMentorUserPublic(supabase, mentorId),
    ]);
    if (pErr) {
      out.push({ row, mentorId, applicationId, display: null });
      continue;
    }
    const display = buildMentorProfileDisplay(pRow, uRow);
    out.push({ row, mentorId, applicationId, display });
  }
  return out;
}
