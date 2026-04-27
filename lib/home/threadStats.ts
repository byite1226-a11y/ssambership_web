import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchThreadsForRoom } from "@/lib/qna/questionRoomQueries";

type Row = Record<string, unknown>;

function statusText(r: Row): string {
  return String(r.status ?? r.state ?? r.stage ?? "").toLowerCase();
}

/** 멘토가 답할 차례일 가능성이 높은 스레드(휴리스틱) */
export function threadLikelyNeedsMentor(r: Row): boolean {
  const s = statusText(r);
  if (!s) return true;
  if (/(closed|resolved|done|complete|answered|mentor_replied|mentor_done)/i.test(s)) return false;
  if (/(pending|open|waiting|new|unanswered|student_asked|awaiting_mentor|need_mentor)/i.test(s)) return true;
  return true;
}

/** 아직 열린 것으로 보는 스레드 */
function threadIsOpen(r: Row): boolean {
  const s = statusText(r);
  if (/(closed|resolved|done|complete)/i.test(s)) return false;
  return true;
}

export type RoomThreadStats = {
  openThreads: number;
  mentorQueueEstimate: number;
  /** 샘플한 room 수(상한) */
  roomsSampled: number;
  error: string | null;
};

/**
 * room id 목록에 대해 question_threads를 room별로 조회해 집계(최대 maxRooms).
 */
export async function aggregateThreadStatsForRooms(
  supabase: SupabaseClient,
  roomIds: string[],
  options: { maxRooms: number; mode: "mentor" | "student" }
): Promise<RoomThreadStats> {
  const slice = roomIds.filter((id) => typeof id === "string" && id).slice(0, options.maxRooms);
  let openThreads = 0;
  let mentorQueueEstimate = 0;
  let err: string | null = null;

  for (const roomId of slice) {
    const t = await fetchThreadsForRoom(supabase, roomId);
    if (t.error) {
      err = t.error;
      continue;
    }
    for (const row of t.rows) {
      if (!threadIsOpen(row)) continue;
      openThreads += 1;
      if (options.mode === "mentor" && threadLikelyNeedsMentor(row)) {
        mentorQueueEstimate += 1;
      }
    }
  }

  return {
    openThreads,
    mentorQueueEstimate,
    roomsSampled: slice.length,
    error: err,
  };
}
