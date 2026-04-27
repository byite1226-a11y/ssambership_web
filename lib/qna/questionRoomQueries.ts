import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { CONNECTION_NOTES_ROOM_FK_CANDIDATES, QUESTION_THREADS_ROOM_FK_CANDIDATES } from "@/lib/qna/questionThreadRoomRef";

type QnaRole = "student" | "mentor";

export type QnaDataState<T> = {
  rows: T[];
  error: string | null;
  loading: boolean;
};

export type QuestionRoomBundle = {
  rooms: QnaDataState<Record<string, unknown>>;
  threads: QnaDataState<Record<string, unknown>>;
  messages: QnaDataState<Record<string, unknown>>;
  notes: QnaDataState<Record<string, unknown>>;
};

function fmt(err: PostgrestError | null): string | null {
  return err ? err.message : null;
}

async function selectOrdered<T extends Record<string, unknown>>(
  run: (orderBy: string | null) => Promise<{ data: T[] | null; error: PostgrestError | null }>,
  orderCandidates: readonly string[]
): Promise<{ rows: T[]; error: string | null }> {
  for (const col of orderCandidates) {
    const res = await run(col);
    if (!res.error) {
      return { rows: (res.data as T[] | null) ?? [], error: null };
    }
    // If ordering fails because column is missing, try the next candidate.
    if (!/column|does not exist|schema cache/i.test(res.error.message)) {
      return { rows: [], error: res.error.message };
    }
  }
  const fallback = await run(null);
  return { rows: (fallback.data as T[] | null) ?? [], error: fmt(fallback.error) };
}

export async function fetchRoomsForUser(
  supabase: SupabaseClient,
  role: QnaRole,
  userId: string
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const table = "mentor_student_rooms";
  const studentCols = ["student_id", "student_user_id", "student_uid"] as const;
  const mentorCols = ["mentor_id", "mentor_user_id", "mentor_uid"] as const;
  const candidates = role === "student" ? studentCols : mentorCols;

  let lastProbeError: string | null = null;

  for (const col of candidates) {
    const probe = await supabase.from(table).select("id").eq(col, userId).limit(1);
    if (probe.error) {
      lastProbeError = probe.error.message;
      continue;
    }

    return await selectOrdered<Record<string, unknown>>(
      async (orderBy) => {
        let q = supabase.from(table).select("*").eq(col, userId);
        if (orderBy) {
          q = q.order(orderBy, { ascending: false });
        }
        return await q;
      },
      ["updated_at", "created_at", "id"]
    );
  }

  return {
    rows: [],
    error: lastProbeError ?? `mentor_student_rooms에서 사용자 컬럼을 찾지 못했습니다(tried ${candidates.join(", ")}).`,
  };
}

/**
 * 페이지 게이트: roomId 행이 현재 사용자(학생·멘토 party)와 일치하는지.
 * RLS와 별도로 서버에서 한 번 더 거른다.
 */
export async function userCanAccessMentorStudentRoom(
  supabase: SupabaseClient,
  userId: string,
  role: QnaRole,
  roomId: string
): Promise<boolean> {
  const col = role === "student" ? "student_id" : "mentor_id";
  const { data, error } = await supabase
    .from("mentor_student_rooms")
    .select("id")
    .eq("id", roomId)
    .eq(col, userId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function fetchThreadsForRoom(
  supabase: SupabaseClient,
  roomId: string
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const table = "question_threads";
  const { column, error: colErr } = await pickExistingColumn(supabase, table, [...QUESTION_THREADS_ROOM_FK_CANDIDATES]);
  if (!column) {
    return { rows: [], error: colErr ?? "question_threads: room FK column not found" };
  }

  return await selectOrdered<Record<string, unknown>>(
    async (orderBy) => {
      let q = supabase.from(table).select("*").eq(column, roomId);
      if (orderBy) {
        q = q.order(orderBy, { ascending: false });
      }
      return await q;
    },
    ["updated_at", "created_at", "id"]
  );
}

export async function fetchMessagesForThread(
  supabase: SupabaseClient,
  threadId: string
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const table = "question_messages";
  const { column, error: colErr } = await pickExistingColumn(supabase, table, ["thread_id", "question_thread_id"]);
  if (!column) {
    return { rows: [], error: colErr ?? "question_messages: thread FK column not found" };
  }

  return await selectOrdered<Record<string, unknown>>(
    async (orderBy) => {
      let q = supabase.from(table).select("*").eq(column, threadId);
      if (orderBy) {
        q = q.order(orderBy, { ascending: true });
      }
      return await q;
    },
    ["created_at", "sent_at", "id"]
  );
}

export async function fetchConnectionNotesForRoom(
  supabase: SupabaseClient,
  roomId: string
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const table = "connection_notes";
  const { column, error: colErr } = await pickExistingColumn(
    supabase,
    table,
    [...CONNECTION_NOTES_ROOM_FK_CANDIDATES]
  );
  if (!column) {
    return { rows: [], error: colErr ?? "connection_notes: room FK column not found" };
  }

  return await selectOrdered<Record<string, unknown>>(
    async (orderBy) => {
      let q = supabase.from(table).select("*").eq(column, roomId);
      if (orderBy) {
        q = q.order(orderBy, { ascending: false });
      }
      return await q;
    },
    ["updated_at", "created_at", "id"]
  );
}

function emptyBundle(partial: Partial<QuestionRoomBundle>): QuestionRoomBundle {
  const base: QuestionRoomBundle = {
    rooms: { rows: [], error: null, loading: false },
    threads: { rows: [], error: null, loading: false },
    messages: { rows: [], error: null, loading: false },
    notes: { rows: [], error: null, loading: false },
  };
  return { ...base, ...partial };
}

/**
 * 목록 페이지: rooms는 전체, 중/우/노트는 “첫 room + (가능하면) 첫 thread”까지 미리 채워 탐색 뼈대를 만든다.
 */
export async function loadQuestionRoomListBundle(
  supabase: SupabaseClient,
  role: QnaRole,
  userId: string
): Promise<QuestionRoomBundle> {
  const rooms = await fetchRoomsForUser(supabase, role, userId);
  if (rooms.error) {
    return emptyBundle({
      rooms: { rows: [], error: rooms.error, loading: false },
      threads: { rows: [], error: "rooms 조회 실패로 thread를 건너뜀", loading: false },
      messages: { rows: [], error: "thread 미선택(room 상세에서 연결)", loading: false },
      notes: { rows: [], error: "rooms 조회 실패로 notes를 건너뜀", loading: false },
    });
  }
  if (rooms.rows.length === 0) {
    return emptyBundle({
      rooms: { rows: [], error: null, loading: false },
      threads: { rows: [], error: null, loading: false },
      messages: { rows: [], error: null, loading: false },
      notes: { rows: [], error: null, loading: false },
    });
  }

  const firstId = rooms.rows[0]?.id;
  if (firstId == null || String(firstId).length === 0) {
    return emptyBundle({
      rooms: { rows: rooms.rows, error: "mentor_student_rooms row에 id가 없습니다.", loading: false },
      threads: { rows: [], error: "room id를 확인할 수 없어 thread를 열 수 없습니다.", loading: false },
      messages: { rows: [], error: "thread 미선택", loading: false },
      notes: { rows: [], error: "room id를 확인할 수 없어 notes를 열 수 없습니다.", loading: false },
    });
  }

  // 목록 페이지는 “room 큐”만 실조회하고, thread/message/notes는 room 상세(`/[roomId]`)에서 연결한다.
  return emptyBundle({
    rooms: { rows: rooms.rows, error: null, loading: false },
    threads: { rows: [], error: null, loading: false },
    messages: { rows: [], error: null, loading: false },
    notes: { rows: [], error: null, loading: false },
  });
}

export type QuestionRoomDetailLoadResult = QuestionRoomBundle & {
  /**
   * 쿼리 `?thread=` 가 이 room에 속한 thread이면 그 id, 아니면 첫 thread, 없으면 null.
   * 타 room threadId로 메시지를 끌어오지 않는다.
   */
  resolvedThreadId: string | null;
};

/**
 * 상세 페이지: roomId 단위 thread/note + threadId(옵션) 기반 message
 */
export async function loadQuestionRoomDetailBundle(
  supabase: SupabaseClient,
  userId: string,
  role: QnaRole,
  roomId: string,
  threadId: string | null
): Promise<QuestionRoomDetailLoadResult> {
  const allRooms = await fetchRoomsForUser(supabase, role, userId);
  if (allRooms.error) {
    return {
      ...emptyBundle({
        rooms: { rows: [], error: allRooms.error, loading: false },
        threads: { rows: [], error: "rooms 조회 실패", loading: false },
        messages: { rows: [], error: "thread 미확인", loading: false },
        notes: { rows: [], error: "rooms 조회 실패", loading: false },
      }),
      resolvedThreadId: null,
    };
  }

  const inScope = allRooms.rows.some((r) => r.id != null && String(r.id) === String(roomId));
  if (!inScope) {
    return {
      ...emptyBundle({
        rooms: { rows: allRooms.rows, error: "이 room에 접근할 수 없거나 목록에 없습니다.", loading: false },
        threads: { rows: [], error: null, loading: false },
        messages: { rows: [], error: null, loading: false },
        notes: { rows: [], error: null, loading: false },
      }),
      resolvedThreadId: null,
    };
  }

  const threadsQ = await fetchThreadsForRoom(supabase, roomId);
  const notesQ = await fetchConnectionNotesForRoom(supabase, roomId);

  const firstTid = typeof threadsQ.rows[0]?.id === "string" ? (threadsQ.rows[0].id as string) : null;
  const threadInRoom =
    threadId &&
    threadsQ.rows.some((r) => r.id != null && String(r.id) === String(threadId));
  let threadIdToUse: string | null = null;
  if (threadInRoom) {
    threadIdToUse = String(threadId);
  } else {
    threadIdToUse = firstTid;
  }

  const messagesQ = threadIdToUse
    ? await fetchMessagesForThread(supabase, threadIdToUse)
    : { rows: [] as Record<string, unknown>[], error: null as string | null };

  return {
    ...emptyBundle({
      rooms: { rows: allRooms.rows, error: null, loading: false },
      threads: { rows: threadsQ.rows, error: threadsQ.error, loading: false },
      messages: { rows: messagesQ.rows, error: messagesQ.error, loading: false },
      notes: { rows: notesQ.rows, error: notesQ.error, loading: false },
    }),
    resolvedThreadId: threadIdToUse,
  };
}
