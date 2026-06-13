import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { fetchMentorProfileForPublicMentor, getMentorUserPublic } from "@/lib/auth/mentorPublicRead";
import { buildMentorProfileDisplay, type MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

function isPublicBrowsePostRow(row: Row): boolean {
  const s = String(row.status ?? "").trim().toLowerCase();
  const st = String(row.state ?? "").trim().toLowerCase();
  if (!s && !st) return true;
  return s === "open" || st === "open" || st === "published";
}

function fmt(e: PostgrestError | null): string | null {
  return e ? e.message : null;
}

/** insert: 첫으로 존재하는 열에 주문 id. 003는 custom_request_order_id NOT NULL. */
export const ORDER_TO_DELIVERABLE_FK_CANDIDATES = [
  "custom_request_order_id",
  "order_id",
  "custom_order_id",
  "request_order_id",
] as const;

/**
 * 읽기·count: OR 탐지 없이 SSOT 우선 단일 열(003: custom_request_order_id).
 * insert 후보(ORDER_TO_DELIVERABLE_FK_CANDIDATES)와 동일 후보이나 **우선순위가 고정**됨.
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
 * 통합 주문 시스템에서 `order_id`만 쓰는 API와 호환.
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
  const { rows, error } = await selectWithOrder<Row>(supabase, table, Math.max(limit * 4, limit));
  return {
    table,
    sourceNote: "최근 공개 의뢰(open/published)",
    rows: error ? [] : rows.filter(isPublicBrowsePostRow).slice(0, limit),
    error,
  };
}

/** 학생 본인이 등록한 의뢰 목록 */
export async function loadStudentCustomRequestPosts(
  supabase: SupabaseClient,
  studentId: string,
  limit = 50
): Promise<CustomListResult> {
  const { table, error: te } = await firstReadableCustomTable(supabase, ["custom_request_posts", "custom_requests", "request_posts"]);
  if (!table) {
    return { table: null, sourceNote: te, rows: [], error: te };
  }
  const { column, error: colErr } = await pickExistingColumn(supabase, table, ["author_id"]);
  if (!column) {
    return { table, sourceNote: colErr ?? "author column missing", rows: [], error: colErr };
  }
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq(column, studentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    const fb = await supabase.from(table).select("*").eq(column, studentId).limit(limit);
    return { table, sourceNote: "order fallback", rows: (fb.data as Row[]) ?? [], error: fmt(fb.error) };
  }
  return { table, sourceNote: `${table}.${column}`, rows: (data as Row[]) ?? [], error: null };
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

export type ApplicationAttachmentListItem = {
  id: string;
  application_id: string;
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

/**
 * 멘토 지원서 첨부(메타) — RLS: 지원 멘토 본인 · post 작성 학생 · admin만 행 조회.
 */
export async function loadApplicationAttachments(
  supabase: SupabaseClient,
  applicationIds: string[]
): Promise<{ byApplicationId: Record<string, ApplicationAttachmentListItem[]>; error: string | null }> {
  const ids = [...new Set(applicationIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    return { byApplicationId: {}, error: null };
  }
  const { data, error } = await supabase
    .from("custom_request_application_attachments")
    .select("id, application_id, original_filename, file_size_bytes, mime_type, created_at")
    .in("application_id", ids)
    .order("created_at", { ascending: true });
  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message)) {
      return { byApplicationId: {}, error: null };
    }
    return { byApplicationId: {}, error: error.message };
  }
  const byApplicationId: Record<string, ApplicationAttachmentListItem[]> = {};
  for (const raw of (data as Row[] | null) ?? []) {
    const appId = String(raw.application_id ?? "");
    if (!appId) continue;
    const item: ApplicationAttachmentListItem = {
      id: String(raw.id),
      application_id: appId,
      original_filename: String(raw.original_filename ?? "파일"),
      file_size_bytes: typeof raw.file_size_bytes === "number" ? raw.file_size_bytes : null,
      mime_type: typeof raw.mime_type === "string" ? raw.mime_type : null,
      created_at:
        raw.created_at != null && (typeof raw.created_at === "string" || raw.created_at instanceof Date)
          ? String(raw.created_at)
          : "",
    };
    if (!byApplicationId[appId]) byApplicationId[appId] = [];
    byApplicationId[appId].push(item);
  }
  return { byApplicationId, error: null };
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
  if ("author_id" in row) return "author_id";
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
    const { column: fk } = await resolveOrderChildFkReadColumn(supabase, dT.table);
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
        deliv = { table: dT.table, sourceNote: `deliverables · ${fk}`, rows: (data as Row[]) ?? [], error: null };
      }
    } else {
      console.warn("[loadOrderBundle] deliverables: order FK column unresolved; skipped child rows", {
        orderId,
        table: dT.table,
      });
      deliv = {
        table: dT.table,
        sourceNote: "납품: 주문 FK 컬럼을 찾지 못해 이 주문의 납품 목록을 표시하지 않습니다.",
        rows: [],
        error: null,
      };
    }
  } else if (dT.table) {
    console.warn("[loadOrderBundle] deliverables: order table missing; skipped unrelated rows", {
      orderId,
      deliverablesTable: dT.table,
    });
    deliv = {
      table: dT.table,
      sourceNote: oT.table ? "주문을 찾을 수 없어 납품 목록을 불러오지 않았습니다." : (dT.error ?? "납품 목록을 건너뜁니다."),
      rows: [],
      error: null,
    };
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
      console.warn("[loadOrderBundle] disputes: order FK column unresolved; skipped child rows", {
        orderId,
        table: dis.table,
      });
      disputes = {
        table: dis.table,
        sourceNote: "분쟁: 주문 FK 컬럼을 찾지 못해 이 주문의 분쟁 목록을 표시하지 않습니다.",
        rows: [],
        error: null,
      };
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

// ---------------------------------------------------------------------------
// custom_request_applications (학생 비교·주문) — PostgREST가 numeric/날짜를 string이 아닌 형태로 줄 수 있음
// ---------------------------------------------------------------------------

/** 1순위 proposed_price → price → bid_amount, 숫자/문자 모두 허용 */
export function getApplicationPriceAmount(row: Row): number | null {
  for (const k of ["proposed_price", "price", "bid_amount"] as const) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      return v;
    }
    if (typeof v === "string" && v.trim()) {
      const n = Number.parseFloat(v.replace(/,/g, "").trim());
      if (Number.isFinite(n)) {
        return n;
      }
    }
  }
  return null;
}

/** 예: 50000 → 50,000원 */
export function formatApplicationPriceKrwDisplay(row: Row): string {
  const n = getApplicationPriceAmount(row);
  if (n === null) {
    return "가격 미입력";
  }
  return new Intl.NumberFormat("ko-KR").format(n) + "캐시";
}

/** 예상 기간 (N일) */
export function formatApplicationDurationDays(row: Row): string {
  for (const k of ["expected_days", "duration_days", "delivery_days", "days"] as const) {
    const v = row[k];
    if (typeof v === "number" && v > 0) return `${Math.round(v)}일`;
    if (typeof v === "string" && /^\d+$/.test(v.trim())) return `${v.trim()}일`;
  }
  for (const k of ["expected_duration", "duration_weeks", "timeline"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.trim() && v.trim() !== "—") {
      const n = Number(String(v).replace(/[^\d]/g, ""));
      if (Number.isFinite(n) && n > 0) return `${n}일`;
      return v.trim();
    }
  }
  const due = formatApplicationDueDateDisplay(row);
  if (due !== "납기 미정") return due;
  return "기간 협의";
}

function dateLikeToYmdDots(v: unknown): string | null {
  if (v == null) {
    return null;
  }
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) {
      return null;
    }
    return `${v.getFullYear()}.${String(v.getMonth() + 1).padStart(2, "0")}.${String(v.getDate()).padStart(2, "0")}`;
  }
  if (typeof v === "string" && v.trim()) {
    const t = v.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
      return t.slice(0, 10).replace(/-/g, ".");
    }
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) {
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    }
  }
  return null;
}

/** delivery_at → proposed_due → due_proposed, ISO 풀 문자열을 그대로 보여주지 않음 */
export function formatApplicationDueDateDisplay(row: Row): string {
  for (const k of ["delivery_at", "proposed_due", "due_proposed"] as const) {
    const s = dateLikeToYmdDots(row[k]);
    if (s) {
      return s;
    }
  }
  return "납기 미정";
}

/** DB status 원문을 크게 박지 않고 짧은 사용자 라벨 */
export function formatApplicationStatusForStudent(row: Row): string {
  const s = String(row.status ?? row.state ?? "")
    .toLowerCase()
    .trim();
  if (s === "submitted" || s === "submit" || s === "sent") {
    return "지원서 제출됨";
  }
  if (s === "draft" || s === "pending_draft") {
    return "작성 중";
  }
  if (s === "accepted" || s === "selected" || s === "approved") {
    return "선정됨";
  }
  if (s === "rejected" || s === "declined" || s === "cancelled" || s === "canceled") {
    return "검토 종료";
  }
  if (s === "in_review" || s === "open" || !s) {
    return "검토 가능";
  }
  return "검토 가능";
}

const COMPARE_EMPTY = "작성된 내용이 없습니다.";

function applicationFirstNonEmptyString(row: Row, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
  }
  return "";
}

function compNorm(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export type ApplicationTextBlocksForCompare = {
  proposal: string;
  scope: string;
  extra: string;
};

/**
 * cover_letter / scope / notes 우선순위와 동일·포함 본문 중복 완화
 */
export function getApplicationTextBlocksForCompare(row: Row): ApplicationTextBlocksForCompare {
  const rawP = applicationFirstNonEmptyString(row, ["cover_letter", "message", "content", "self_intro"]);
  const rawS = applicationFirstNonEmptyString(row, ["scope", "offer_scope", "services_offered"]);
  const rawE = applicationFirstNonEmptyString(row, ["notes", "extra_answers", "answers"]);

  const proposal = rawP || COMPARE_EMPTY;
  let scope = rawS || COMPARE_EMPTY;
  let extra = rawE || COMPARE_EMPTY;

  const nP = rawP ? compNorm(rawP) : "";
  const nS = rawS ? compNorm(rawS) : "";
  const nE = rawE ? compNorm(rawE) : "";

  if (nP && nS && nP === nS) {
    scope = "제안 내용에 포함되어 있어, 별도의 작업 범위 문구는 없습니다.";
  }
  if (nE && nP && nE === nP) {
    extra = "제안 내용에 포함되어 있어, 별도 추가 메모는 없습니다.";
  } else if (nE && nS && nE === nS && nP && nE !== nP) {
    extra = "작업 범위에 포함되어 있어, 별도 추가 메모는 없습니다.";
  } else if (nE && nP && nS && nE === nP && nE === nS) {
    extra = "제안·작업 범위와 동일한 내용입니다.";
  }
  return { proposal, scope, extra };
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

/**
 * 멘토용 모집 중 의뢰 목록 — 018 `list_open_custom_request_posts_for_mentor_browse` RPC
 * (미적용 DB에서는 RPC 없음 → status `rpc_unavailable`, 클라이언트는 안내 문구만 사용)
 */
export async function loadOpenCustomRequestPostsForMentorBrowse(
  supabase: SupabaseClient,
  limit = 50
): Promise<{ rows: Row[]; status: "ok" | "empty" | "rpc_unavailable" }> {
  const { data, error } = await supabase.rpc("list_open_custom_request_posts_for_mentor_browse", { p_limit: limit });
  if (error) {
    if (/function|does not exist|schema cache/i.test(error.message)) {
      return { rows: [], status: "rpc_unavailable" };
    }
    return { rows: [], status: "empty" };
  }
  return { rows: (data as Row[]) ?? [], status: "ok" };
}

/**
 * 이미 이 의뢰에 (동일 멘토) 지원이 있는지 — 지원서 작성·중복 안내
 */
export async function mentorHasApplicationForPost(
  supabase: SupabaseClient,
  postId: string,
  mentorId: string
): Promise<boolean> {
  const tProbe = await firstReadableCustomTable(supabase, ["custom_request_applications", "request_applications", "custom_bids"]);
  if (!tProbe.table) return false;
  const t = tProbe.table;
  const { column: postCol } = await pickExistingColumn(supabase, t, [
    "post_id",
    "request_id",
    "custom_request_id",
    "custom_request_post_id",
  ]);
  const { column: mentorCol } = await pickExistingColumn(supabase, t, [
    "mentor_id",
    "applicant_id",
    "user_id",
    "proposer_id",
  ]);
  if (!postCol || !mentorCol) return false;
  const { data, error } = await supabase.from(t).select("id").eq(postCol, postId).eq(mentorCol, mentorId).limit(1).maybeSingle();
  if (error || !data) return false;
  return true;
}

/** 멘토가 해당 post에 제출한 application id (없으면 null) */
export async function loadMentorApplicationIdForPost(
  supabase: SupabaseClient,
  postId: string,
  mentorId: string
): Promise<string | null> {
  const tProbe = await firstReadableCustomTable(supabase, ["custom_request_applications", "request_applications", "custom_bids"]);
  if (!tProbe.table) return null;
  const t = tProbe.table;
  const { column: postCol } = await pickExistingColumn(supabase, t, [
    "post_id",
    "request_id",
    "custom_request_id",
    "custom_request_post_id",
  ]);
  const { column: mentorCol } = await pickExistingColumn(supabase, t, [
    "mentor_id",
    "applicant_id",
    "user_id",
    "proposer_id",
  ]);
  if (!postCol || !mentorCol) return null;
  const { data, error } = await supabase
    .from(t)
    .select("id")
    .eq(postCol, postId)
    .eq(mentorCol, mentorId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const id = (data as Row).id;
  return id != null ? String(id) : null;
}

export type MentorApplicationWithPostHint = {
  application: Row;
  postId: string;
  postTitle: string;
  href: string;
};

export type MentorOrderApplicationFilterKeys = {
  applicationIds: Set<string>;
  postIds: Set<string>;
};

function pickPostIdFromCustomRow(r: Row): string {
  return String(
    r.post_id ?? r.custom_request_post_id ?? r.request_id ?? r.custom_request_id ?? ""
  ).trim();
}

function applicationHasMentorOrder(app: Row, keys: MentorOrderApplicationFilterKeys): boolean {
  const appId = pickApplicationRowId(app);
  if (appId && keys.applicationIds.has(appId)) {
    return true;
  }
  const postId = pickPostIdFromCustomRow(app);
  return Boolean(postId && keys.postIds.has(postId));
}

/**
 * 멘토 주문 중 application·post 연결 키(제안 목록에서 주문 전환 건 제외용, 읽기 전용).
 */
export async function fetchMentorOrderApplicationFilterKeys(
  supabase: SupabaseClient,
  mentorId: string
): Promise<MentorOrderApplicationFilterKeys> {
  const empty = { applicationIds: new Set<string>(), postIds: new Set<string>() };
  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "custom_orders", "request_orders"]);
  if (!oT.table) {
    return empty;
  }
  const t = oT.table;
  const { column: mentorCol } = await pickExistingColumn(supabase, t, [
    "mentor_id",
    "mentor_user_id",
    "expert_id",
    "assignee_id",
    "selected_mentor_id",
  ]);
  if (!mentorCol) {
    return empty;
  }
  const { column: appCol } = await pickExistingColumn(supabase, t, [
    "application_id",
    "custom_request_application_id",
    "bid_id",
  ]);
  const { column: postCol } = await pickExistingColumn(supabase, t, [
    "post_id",
    "custom_request_post_id",
    "request_id",
    "custom_request_id",
  ]);
  const selectCols = [appCol, postCol].filter(Boolean).join(", ") || "*";
  const { data, error } = await supabase.from(t).select(selectCols).eq(mentorCol, mentorId);
  if (error) {
    return empty;
  }
  const applicationIds = new Set<string>();
  const postIds = new Set<string>();
  for (const row of ((data ?? []) as unknown as Row[])) {
    if (appCol) {
      const aid = String(row[appCol] ?? "").trim();
      if (aid) {
        applicationIds.add(aid);
      }
    }
    const pid = postCol ? String(row[postCol] ?? "").trim() : pickPostIdFromCustomRow(row);
    if (pid) {
      postIds.add(pid);
    }
  }
  return { applicationIds, postIds };
}

/**
 * 멘토가 지원한 의뢰 post id 전체(주문 전환 여부 무관) — open 풀 제외용.
 */
export async function loadMentorAppliedPostIdSet(
  supabase: SupabaseClient,
  mentorId: string
): Promise<Set<string>> {
  const tProbe = await firstReadableCustomTable(supabase, ["custom_request_applications", "request_applications", "custom_bids"]);
  if (!tProbe.table) {
    return new Set();
  }
  const t = tProbe.table;
  const { column: mentorCol } = await pickExistingColumn(supabase, t, [
    "mentor_id",
    "applicant_id",
    "user_id",
    "proposer_id",
  ]);
  const { column: postCol } = await pickExistingColumn(supabase, t, [
    "post_id",
    "custom_request_post_id",
    "request_id",
    "custom_request_id",
  ]);
  if (!mentorCol || !postCol) {
    return new Set();
  }
  const { data, error } = await supabase.from(t).select(postCol).eq(mentorCol, mentorId);
  if (error) {
    return new Set();
  }
  const ids = new Set<string>();
  for (const row of ((data ?? []) as unknown as Row[])) {
    const id = String(row[postCol] ?? "").trim();
    if (id) {
      ids.add(id);
    }
  }
  return ids;
}

/**
 * 멘토가 제출한 지원 요약(의뢰 제목은 browse RPC·상세 조회로 보강).
 * 주문으로 전환된 지원은 제외(매칭 대기만).
 */
export async function loadMentorRecentApplicationsWithPostHints(
  supabase: SupabaseClient,
  mentorId: string,
  max = 20
): Promise<{ items: MentorApplicationWithPostHint[]; listFailed: boolean }> {
  const tProbe = await firstReadableCustomTable(supabase, ["custom_request_applications", "request_applications", "custom_bids"]);
  if (!tProbe.table) {
    return { items: [], listFailed: false };
  }
  const t = tProbe.table;
  const { column: mentorCol } = await pickExistingColumn(supabase, t, [
    "mentor_id",
    "applicant_id",
    "user_id",
    "proposer_id",
  ]);
  if (!mentorCol) {
    return { items: [], listFailed: true };
  }
  const orderKeys = await fetchMentorOrderApplicationFilterKeys(supabase, mentorId);
  const o1 = await supabase
    .from(t)
    .select("*")
    .eq(mentorCol, mentorId)
    .order("created_at", { ascending: false })
    .limit(max);
  if (o1.error) {
    if (!/order|column|does not exist/i.test(o1.error.message)) {
      return { items: [], listFailed: true };
    }
    const o2 = await supabase.from(t).select("*").eq(mentorCol, mentorId).limit(max);
    if (o2.error) {
      return { items: [], listFailed: true };
    }
    const pending = ((o2.data as Row[]) ?? []).filter((a) => !applicationHasMentorOrder(a, orderKeys));
    return mapAppsToHints(supabase, pending);
  }
  const pending = ((o1.data as Row[]) ?? []).filter((a) => !applicationHasMentorOrder(a, orderKeys));
  return mapAppsToHints(supabase, pending);
}

async function mapAppsToHints(
  supabase: SupabaseClient,
  apps: Row[]
): Promise<{ items: MentorApplicationWithPostHint[]; listFailed: boolean }> {
  const items: MentorApplicationWithPostHint[] = [];
  for (const a of apps) {
    const pid = pickPostIdFromCustomRow(a);
    if (!pid) {
      continue;
    }
    const detail = await loadCustomPostForPublicDetail(supabase, pid);
    const title = detail.row
      ? pickDisplayField(detail.row, ["title", "subject", "body"])
      : "맞춤의뢰";
    items.push({
      application: a,
      postId: pid,
      postTitle: title,
      href: `/mentor/custom-request/posts/${pid}`,
    });
  }
  return { items, listFailed: false };
}

/**
 * 학생·의뢰자: 선정한 주문 id(선택 전·비해당 시 null) — UI에는 orderId만 사용
 */
export async function getOrderIdForPostAndStudent(
  supabase: SupabaseClient,
  postId: string,
  studentId: string
): Promise<string | null> {
  const r = await findOrderForPostAndStudent(supabase, postId, studentId);
  if (r.error) {
    console.warn("[getOrderIdForPostAndStudent]", r.error);
  }
  return r.orderId;
}

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
