import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { firstReadableAdminTable } from "@/lib/admin/adminQueries";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

function fmt(e: PostgrestError | null): string | null {
  return e ? e.message : null;
}

export type NoticeListSection = {
  name: "notices" | "promotions";
  table: string;
  error: string | null;
  rows: Row[];
};

function pickTypeCell(r: Row): string {
  for (const k of ["type", "notice_type", "kind", "category", "placement_type"]) {
    if (k in r && r[k] !== null && r[k] !== undefined) return String(r[k]);
  }
  return "—";
}

function pickTargetCell(r: Row): string {
  for (const k of ["target_screen", "target_path", "placement", "audience", "scope", "surface", "route"]) {
    if (k in r && r[k] !== null && r[k] !== undefined) return String(r[k]);
  }
  return "—";
}

function pickTitleCell(r: Row): string {
  for (const k of ["title", "name", "label", "headline", "summary"]) {
    if (k in r && r[k] !== null && r[k] !== undefined) {
      const s = String(r[k]);
      if (s.length) return s.length > 40 ? s.slice(0, 40) + "…" : s;
    }
  }
  return "—";
}

function pickStart(r: Row): string {
  for (const k of ["starts_at", "start_at", "valid_from", "active_from", "start_date"]) {
    if (k in r && r[k] !== null && r[k] !== undefined) return String(r[k]);
  }
  return "—";
}

function pickEnd(r: Row): string {
  for (const k of ["ends_at", "end_at", "valid_to", "active_to", "end_date"]) {
    if (k in r && r[k] !== null && r[k] !== undefined) return String(r[k]);
  }
  return "—";
}

function pickActive(r: Row): { label: string; isOn: boolean } {
  for (const k of ["is_active", "active", "enabled", "published", "is_published"] as const) {
    if (k in r) {
      const v = r[k];
      if (typeof v === "boolean") return { label: v ? "활성" : "비활성", isOn: v };
    }
  }
  for (const k of ["status", "state"]) {
    if (k in r && r[k] !== null && r[k] !== undefined) {
      const s = String(r[k]);
      return { label: s, isOn: /active|on|open|pub|1/i.test(s) };
    }
  }
  return { label: "—", isOn: false };
}

export type NoticeListRow = {
  id: string;
  title: string;
  type: string;
  target: string;
  start: string;
  end: string;
  active: { label: string; isOn: boolean };
  _raw: Row;
  _source: "notices" | "promotions";
};

function mapRows(rows: Row[], source: "notices" | "promotions"): NoticeListRow[] {
  return rows.map((r) => {
    const id = String(r.id ?? r.uuid ?? r.key ?? "");
    return {
      id,
      title: pickTitleCell(r),
      type: pickTypeCell(r),
      target: pickTargetCell(r),
      start: pickStart(r),
      end: pickEnd(r),
      active: pickActive(r),
      _raw: r,
      _source: source,
    };
  });
}

async function selectOrderedList(supabase: SupabaseClient, table: string, limit: number): Promise<{ rows: Row[]; error: string | null }> {
  const orderCols = ["created_at", "updated_at", "starts_at", "id"] as const;
  for (const c of orderCols) {
    const { data, error } = await supabase.from(table).select("*").order(c, { ascending: false }).limit(limit);
    if (!error) return { rows: (data as Row[]) ?? [], error: null };
    if (!/column|order|schema/i.test(error.message)) return { rows: [], error: error.message };
  }
  const { data, error } = await supabase.from(table).select("*").limit(limit);
  return { rows: (data as Row[]) ?? [], error: fmt(error) };
}

export async function loadAdminNoticesPage(supabase: SupabaseClient, listLimit = 50): Promise<{
  noticeSection: NoticeListSection | null;
  promoSection: NoticeListSection | null;
  mappedNotices: NoticeListRow[];
  mappedPromos: NoticeListRow[];
  listErrors: string[];
  probeSummary: string;
}> {
  const nProbe = await firstReadableAdminTable(supabase, ["notices", "site_notices", "announcements", "app_notices"] as const);
  const pProbe = await firstReadableAdminTable(supabase, ["promotions", "promo_banners", "site_promotions", "promotion_campaigns"] as const);

  const listErrors: string[] = [];
  let noticeSection: NoticeListSection | null = null;
  let promoSection: NoticeListSection | null = null;

  if (nProbe.table) {
    const { rows, error } = await selectOrderedList(supabase, nProbe.table, listLimit);
    if (error) listErrors.push(`notices: ${error}`);
    noticeSection = { name: "notices" as const, table: nProbe.table, error, rows: error ? [] : rows };
  } else {
    listErrors.push(`notices: ${nProbe.error}`);
  }

  if (pProbe.table) {
    const { rows, error } = await selectOrderedList(supabase, pProbe.table, listLimit);
    if (error) listErrors.push(`promotions: ${error}`);
    promoSection = { name: "promotions" as const, table: pProbe.table, error, rows: error ? [] : rows };
  } else {
    listErrors.push(`promotions: ${pProbe.error}`);
  }

  const mappedNotices = noticeSection ? mapRows(noticeSection.rows, "notices") : [];
  const mappedPromos = promoSection ? mapRows(promoSection.rows, "promotions") : [];

  const probeSummary = [
    nProbe.table ? `notices→${nProbe.table}` : `notices(✗)`,
    pProbe.table ? `promotions→${pProbe.table}` : `promotions(✗)`,
  ].join(" · ");

  return { noticeSection, promoSection, mappedNotices, mappedPromos, listErrors, probeSummary };
}

/** 폼/insert 시 컬럼 힌트(스키마 확정 시만 의미) */
export async function getNoticeTableColumnHints(
  supabase: SupabaseClient,
  table: string
): Promise<{
  title: string | null;
  body: string | null;
  type: string | null;
  target: string | null;
  start: string | null;
  end: string | null;
  active: string | null;
}> {
  const title = (await pickExistingColumn(supabase, table, ["title", "name", "headline", "summary"] as const)).column;
  const body = (await pickExistingColumn(supabase, table, ["body", "content", "message", "excerpt", "summary"] as const)).column;
  const type = (await pickExistingColumn(supabase, table, ["type", "kind", "notice_type", "category"] as const)).column;
  const target = (await pickExistingColumn(supabase, table, ["target_screen", "placement", "target_path", "audience", "scope"] as const))
    .column;
  const start = (await pickExistingColumn(supabase, table, ["starts_at", "start_at", "valid_from", "active_from"] as const)).column;
  const end = (await pickExistingColumn(supabase, table, ["ends_at", "end_at", "valid_to", "active_to"] as const)).column;
  const active = (await pickExistingColumn(supabase, table, ["is_active", "active", "status", "enabled", "is_published"] as const))
    .column;
  return { title, body, type, target, start, end, active };
}
