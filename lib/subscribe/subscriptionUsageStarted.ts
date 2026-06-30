import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 학원법 별표4 "이용 개시(교습 시작)" 판정 — 첫 질문 작성 여부.
 *
 * 판정 신호: 해당 (student, mentor) 페어의 mentor_student_rooms 안에서
 *  current_period_start 이후 question_threads 가 1건 이상 생성됐는지.
 *
 * 스키마 변경 없이 기존 RLS·인덱스(qt_select_via_room + idx_qt_msr) 그대로 사용.
 * service_role 클라이언트로 호출하는 것을 전제(서버 액션·내부 표시 용도).
 */
export async function hasSubscriptionUsageStartedForPair(
  supabase: SupabaseClient,
  args: {
    studentId: string;
    mentorId: string;
    periodStartIso: string | null;
  }
): Promise<boolean> {
  if (!args.periodStartIso) return false;
  const start = new Date(args.periodStartIso);
  if (Number.isNaN(start.getTime())) return false;

  const { data: roomRows, error: roomErr } = await supabase
    .from("mentor_student_rooms")
    .select("id")
    .eq("student_id", args.studentId)
    .eq("mentor_id", args.mentorId)
    .limit(1);
  if (roomErr) {
    console.warn("[hasSubscriptionUsageStartedForPair] room lookup", {
      error: roomErr.message,
      studentId: args.studentId,
      mentorId: args.mentorId,
    });
    return false;
  }
  const room = (roomRows ?? [])[0] as { id?: string } | undefined;
  if (!room?.id) return false;

  const { count, error: threadErr } = await supabase
    .from("question_threads")
    .select("id", { count: "exact", head: true })
    .eq("mentor_student_room_id", room.id)
    .gte("created_at", start.toISOString());
  if (threadErr) {
    console.warn("[hasSubscriptionUsageStartedForPair] thread count", {
      error: threadErr.message,
      roomId: room.id,
    });
    return false;
  }
  return (count ?? 0) > 0;
}

/**
 * 여러 (subscriptionId, studentId, mentorId, periodStartIso) 페어를 한 번에 판정.
 * 학생 구독 관리 화면처럼 N개 카드에서 동시에 표시할 때 사용.
 *
 * 단순 병렬 호출 — N이 작아 별도 배치 쿼리(IN/JOIN)는 지금 시점에 과제.
 */
export async function bulkHasSubscriptionUsageStarted(
  supabase: SupabaseClient,
  pairs: Array<{
    subscriptionId: string;
    studentId: string;
    mentorId: string;
    periodStartIso: string | null;
  }>
): Promise<Map<string, boolean>> {
  const out = new Map<string, boolean>();
  await Promise.all(
    pairs.map(async (p) => {
      const v = await hasSubscriptionUsageStartedForPair(supabase, p);
      out.set(p.subscriptionId, v);
    })
  );
  return out;
}
