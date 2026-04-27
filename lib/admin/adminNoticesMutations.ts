import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

function isMissingColumnError(err: PostgrestError | null): boolean {
  if (!err) return false;
  return /column|does not exist|schema cache/i.test(err.message);
}

async function insertWithCandidates(
  supabase: SupabaseClient,
  table: string,
  payloads: Record<string, unknown>[]
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  let last = "insert 후보 실패";
  for (const payload of payloads) {
    const { data, error } = await supabase.from(table).insert(payload).select("*").limit(1).maybeSingle();
    if (!error) {
      return { row: (data as Record<string, unknown> | null) ?? null, error: null };
    }
    last = error.message;
    if (!isMissingColumnError(error)) {
      return { row: null, error: error.message };
    }
  }
  return { row: null, error: last };
}

export type AdminNoticeFormInput = {
  table: string;
  title: string;
  body: string;
  resource: "notice" | "promotion";
  target: string;
  start: string;
  end: string;
  active: boolean;
};

export async function insertAdminNoticeDraft(
  supabase: SupabaseClient,
  input: AdminNoticeFormInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const base: Record<string, unknown> = {
    title: input.title,
    body: input.body,
    content: input.body,
    summary: input.body,
    type: input.resource === "promotion" ? "promotion" : "notice",
    kind: input.resource,
    target_screen: input.target || null,
    placement: input.target || null,
    starts_at: input.start || null,
    ends_at: input.end || null,
    start_at: input.start || null,
    end_at: input.end || null,
    is_active: input.active,
    active: input.active,
    status: input.active ? "active" : "draft",
    created_at: now,
    updated_at: now,
  };

  const payloads: Record<string, unknown>[] = [base, { title: input.title, content: input.body, type: input.resource }];

  const { row, error } = await insertWithCandidates(supabase, input.table, payloads);
  if (error) {
    return { ok: false, error };
  }
  const id = row && row.id !== undefined && row.id !== null ? String(row.id) : null;
  if (!id) {
    return { ok: false, error: "id를 확인할 수 없습니다." };
  }
  return { ok: true, id };
}
