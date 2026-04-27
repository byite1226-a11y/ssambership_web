import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { fetchRoomsForUser } from "@/lib/qna/questionRoomQueries";
import { CONNECTION_NOTES_ROOM_FK_CANDIDATES, QUESTION_THREADS_ROOM_FK_CANDIDATES } from "@/lib/qna/questionThreadRoomRef";

type QnaRole = "student" | "mentor";

type MutationOk<T extends Record<string, unknown>> = {
  ok: true;
  row: T | null;
};

type MutationFail = {
  ok: false;
  error: string;
};

type MutationResult<T extends Record<string, unknown>> = MutationOk<T> | MutationFail;

function isMissingColumnError(err: PostgrestError | null): boolean {
  if (!err) return false;
  return /column|does not exist|schema cache/i.test(err.message);
}

function textFromFormValue(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getThreadLabel(row: Record<string, unknown>): string {
  const keys = ["title", "subject", "topic"];
  for (const k of keys) {
    const val = row[k];
    if (typeof val === "string" && val.trim()) return val;
  }
  return "새 질문 thread";
}

function includesAny(message: string, words: string[]): boolean {
  const lower = message.toLowerCase();
  return words.some((w) => lower.includes(w.toLowerCase()));
}

async function ensureRoomScope(
  supabase: SupabaseClient,
  role: QnaRole,
  userId: string,
  roomId: string
): Promise<MutationFail | null> {
  const roomsQ = await fetchRoomsForUser(supabase, role, userId);
  if (roomsQ.error) return { ok: false, error: roomsQ.error };
  const inScope = roomsQ.rows.some((room) => room.id === roomId);
  if (!inScope) return { ok: false, error: "이 room에 대한 쓰기 권한이 없습니다." };
  return null;
}

async function insertWithCandidates<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  payloads: Record<string, unknown>[]
): Promise<MutationResult<T>> {
  let lastError = "insert 후보를 모두 실패했습니다.";
  for (const payload of payloads) {
    const { data, error } = await supabase.from(table).insert(payload).select("*").limit(1).maybeSingle();
    if (!error) return { ok: true, row: (data as T | null) ?? null };
    lastError = error.message;
    if (!isMissingColumnError(error)) return { ok: false, error: error.message };
  }
  return { ok: false, error: lastError };
}

async function updateWithCandidates<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  matchColumn: string,
  matchValue: string,
  payloads: Record<string, unknown>[]
): Promise<MutationResult<T>> {
  let lastError = "update 후보를 모두 실패했습니다.";
  for (const payload of payloads) {
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq(matchColumn, matchValue)
      .select("*")
      .limit(1)
      .maybeSingle();
    if (!error) return { ok: true, row: (data as T | null) ?? null };
    lastError = error.message;
    if (!isMissingColumnError(error)) return { ok: false, error: error.message };
  }
  return { ok: false, error: lastError };
}

function buildThreadPayloads(
  roomColumn: string,
  roomId: string,
  title: string,
  role: QnaRole,
  userId: string
): Record<string, unknown>[] {
  const titleKeys = ["title", "subject", "topic"] as const;
  const roleKeys = ["author_role", "sender_role", "writer_role"] as const;
  const userKeysCommon = ["author_id", "created_by", "user_id", "sender_id"] as const;
  const userKeysRole = role === "student" ? (["student_id", "student_user_id"] as const) : (["mentor_id", "mentor_user_id"] as const);

  const payloads: Record<string, unknown>[] = [];
  for (const t of titleKeys) {
    const base: Record<string, unknown> = { [roomColumn]: roomId, [t]: title };
    payloads.push(base);
    for (const roleKey of roleKeys) payloads.push({ ...base, [roleKey]: role });
    for (const userKey of userKeysCommon) payloads.push({ ...base, [userKey]: userId });
    for (const userKey of userKeysRole) payloads.push({ ...base, [userKey]: userId });
    for (const roleKey of roleKeys) {
      for (const userKey of userKeysCommon) payloads.push({ ...base, [roleKey]: role, [userKey]: userId });
      for (const userKey of userKeysRole) payloads.push({ ...base, [roleKey]: role, [userKey]: userId });
    }
  }
  return payloads;
}

function buildMessagePayloads(
  threadColumn: string,
  threadId: string,
  content: string,
  role: QnaRole,
  userId: string
): Record<string, unknown>[] {
  const contentKeys = ["body", "content", "text", "message"] as const;
  const roleKeys = ["author_role", "sender_role", "writer_role"] as const;
  const userKeysCommon = ["author_id", "created_by", "user_id", "sender_id"] as const;
  const userKeysRole = role === "student" ? (["student_id", "student_user_id"] as const) : (["mentor_id", "mentor_user_id"] as const);

  const payloads: Record<string, unknown>[] = [];
  for (const c of contentKeys) {
    payloads.push({ [threadColumn]: threadId, author_id: userId, [c]: content });
    payloads.push({ [threadColumn]: threadId, [c]: content, author_id: userId });
  }
  for (const c of contentKeys) {
    const base: Record<string, unknown> = { [threadColumn]: threadId, [c]: content };
    payloads.push(base);
    for (const roleKey of roleKeys) payloads.push({ ...base, [roleKey]: role });
    for (const userKey of userKeysCommon) payloads.push({ ...base, [userKey]: userId });
    for (const userKey of userKeysRole) payloads.push({ ...base, [userKey]: userId });
    for (const roleKey of roleKeys) {
      for (const userKey of userKeysCommon) payloads.push({ ...base, [roleKey]: role, [userKey]: userId });
      for (const userKey of userKeysRole) payloads.push({ ...base, [roleKey]: role, [userKey]: userId });
    }
  }
  return payloads;
}

function buildNotePayloads(content: string, userId: string): Record<string, unknown>[] {
  // staging: body only — 우선 `mentor_student_room_id` + `body` 조합
  const contentKeys = ["body", "content", "note", "text", "memo", "summary"] as const;
  const userKeys = ["updated_by", "author_id", "user_id", "mentor_id", "student_id"] as const;
  const payloads: Record<string, unknown>[] = [];

  for (const c of contentKeys) {
    const base: Record<string, unknown> = { [c]: content };
    payloads.push(base);
    for (const u of userKeys) payloads.push({ ...base, [u]: userId });
  }
  return payloads;
}

export async function createQuestionThread(params: {
  supabase: SupabaseClient;
  role: QnaRole;
  userId: string;
  roomId: string;
  title: string;
}): Promise<{ ok: true; threadId: string | null; row: Record<string, unknown> | null } | MutationFail> {
  const { supabase, role, userId, roomId, title } = params;
  if (!title.trim()) return { ok: false, error: "thread 제목을 입력하세요." };

  const scopeError = await ensureRoomScope(supabase, role, userId, roomId);
  if (scopeError) return scopeError;

  const { column: roomColumn, error: roomColumnError } = await pickExistingColumn(
    supabase,
    "question_threads",
    QUESTION_THREADS_ROOM_FK_CANDIDATES
  );
  if (!roomColumn) return { ok: false, error: roomColumnError ?? "question_threads room FK를 찾지 못했습니다." };

  const created = await insertWithCandidates<Record<string, unknown>>(
    supabase,
    "question_threads",
    buildThreadPayloads(roomColumn, roomId, title.trim(), role, userId)
  );
  if (!created.ok) return created;

  const threadId = (typeof created.row?.id === "string" ? created.row.id : null) ?? (await findNewestThreadId(supabase, roomId));
  return { ok: true, threadId, row: created.row };
}

export async function createQuestionMessage(params: {
  supabase: SupabaseClient;
  role: QnaRole;
  userId: string;
  roomId: string;
  threadId: string;
  content: string;
}): Promise<{ ok: true; row: Record<string, unknown> | null } | MutationFail> {
  const { supabase, role, userId, roomId, threadId, content } = params;
  if (!threadId.trim()) return { ok: false, error: "thread를 먼저 선택하세요." };
  if (!content.trim()) return { ok: false, error: "메시지 내용을 입력하세요." };

  const scopeError = await ensureRoomScope(supabase, role, userId, roomId);
  if (scopeError) return scopeError;

  const { column: threadColumn, error: threadColumnError } = await pickExistingColumn(supabase, "question_messages", [
    "thread_id",
    "question_thread_id",
  ]);
  if (!threadColumn) return { ok: false, error: threadColumnError ?? "question_messages thread FK를 찾지 못했습니다." };

  const created = await insertWithCandidates<Record<string, unknown>>(
    supabase,
    "question_messages",
    buildMessagePayloads(threadColumn, threadId, content.trim(), role, userId)
  );
  if (!created.ok) {
    console.error("[createQuestionMessage] insert failed", {
      threadId,
      roomId,
      messageThreadColumn: threadColumn,
      supabaseError: created.error,
    });
    return created;
  }

  return { ok: true, row: created.row };
}

export async function saveConnectionNote(params: {
  supabase: SupabaseClient;
  role: QnaRole;
  userId: string;
  roomId: string;
  content: string;
}): Promise<{ ok: true; row: Record<string, unknown> | null } | MutationFail> {
  const { supabase, role, userId, roomId, content } = params;
  if (!content.trim()) return { ok: false, error: "connection note 내용을 입력하세요." };

  const scopeError = await ensureRoomScope(supabase, role, userId, roomId);
  if (scopeError) return scopeError;

  const { column: roomColumn, error: roomColumnError } = await pickExistingColumn(
    supabase,
    "connection_notes",
    CONNECTION_NOTES_ROOM_FK_CANDIDATES
  );
  if (!roomColumn) {
    const err = roomColumnError ?? "connection_notes room FK를 찾지 못했습니다.";
    console.error("[saveConnectionNote] room FK column not found", { roomId, supabaseError: err });
    return { ok: false, error: err };
  }

  const existingQ = await supabase.from("connection_notes").select("*").eq(roomColumn, roomId).limit(1).maybeSingle();
  if (existingQ.error) {
    console.error("[saveConnectionNote] select existing failed", {
      roomId,
      roomColumn,
      supabaseError: existingQ.error.message,
    });
    return { ok: false, error: existingQ.error.message };
  }

  const notePayloads = buildNotePayloads(content.trim(), userId);
  if (existingQ.data && typeof existingQ.data.id === "string") {
    const updated = await updateWithCandidates<Record<string, unknown>>(
      supabase,
      "connection_notes",
      "id",
      existingQ.data.id,
      notePayloads
    );
    if (!updated.ok) {
      console.error("[saveConnectionNote] update failed", {
        roomId,
        roomColumn,
        noteId: existingQ.data.id,
        supabaseError: updated.error,
      });
      return updated;
    }
    return { ok: true, row: updated.row };
  }

  const insertPayloads = notePayloads.map((payload) => ({ [roomColumn]: roomId, ...payload }));
  const inserted = await insertWithCandidates<Record<string, unknown>>(supabase, "connection_notes", insertPayloads);
  if (!inserted.ok) {
    console.error("[saveConnectionNote] insert failed", {
      roomId,
      roomColumn,
      supabaseError: inserted.error,
    });
    return inserted;
  }
  return { ok: true, row: inserted.row };
}

async function findNewestThreadId(supabase: SupabaseClient, roomId: string): Promise<string | null> {
  const { column } = await pickExistingColumn(supabase, "question_threads", [...QUESTION_THREADS_ROOM_FK_CANDIDATES]);
  if (!column) return null;

  const tryOrders = ["created_at", "updated_at", "id"];
  for (const orderBy of tryOrders) {
    const q = await supabase
      .from("question_threads")
      .select("id")
      .eq(column, roomId)
      .order(orderBy, { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!q.error) {
      return typeof q.data?.id === "string" ? q.data.id : null;
    }
    if (!isMissingColumnError(q.error)) return null;
  }

  const fallback = await supabase.from("question_threads").select("id").eq(column, roomId).limit(1).maybeSingle();
  if (fallback.error) return null;
  return typeof fallback.data?.id === "string" ? fallback.data.id : null;
}

export function formatActionError(action: "thread" | "message" | "note", raw: string): string {
  if (includesAny(raw, ["쓰기 권한", "permission", "not authorized", "rls"])) {
    return "권한 오류: 이 room에서 해당 작업을 수행할 수 없습니다.";
  }
  if (includesAny(raw, ["foreign key", "violates"])) {
    return "연결 오류: room/thread 관계를 확인해 주세요.";
  }
  if (includesAny(raw, ["not-null", "null value"])) {
    return "입력 오류: 필수 필드가 비어 있습니다.";
  }
  if (includesAny(raw, ["could not find any of", "column", "schema cache"])) {
    return "스키마 오류: 필수 컬럼을 찾지 못했습니다. 테이블 컬럼명을 확인해 주세요.";
  }

  if (action === "thread") return `thread 생성 실패: ${raw}`;
  if (action === "message") return `message 저장 실패: ${raw}`;
  return "connection note를 저장할 수 없습니다.";
}

export function readThreadTitleFromForm(formData: FormData): string {
  return textFromFormValue(formData.get("threadTitle"));
}

/** threadId·본문만 — author_id 등은 서버 `auth.uid()` 전용 (폼/히든으로 받지 않음). */
export function readMessageFromForm(formData: FormData): { threadId: string; content: string } {
  return {
    threadId: textFromFormValue(formData.get("threadId")),
    content: textFromFormValue(formData.get("messageBody")),
  };
}

/** connection_notes 본문만 — room·user는 서버 액션에서만 결정 */
export function readNoteFromForm(formData: FormData): string {
  return textFromFormValue(formData.get("noteBody"));
}

export function extractNoteText(row: Record<string, unknown> | null | undefined): string {
  if (!row) return "";
  const keys = ["body", "content", "note", "text", "memo", "summary"];
  for (const k of keys) {
    const val = row[k];
    if (typeof val === "string" && val.trim()) return val;
  }
  return "";
}

export function extractThreadTitle(row: Record<string, unknown> | null | undefined): string {
  if (!row) return "";
  return getThreadLabel(row);
}
