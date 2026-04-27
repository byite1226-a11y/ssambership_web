/**
 * question_threads.Room(= mentor_student_rooms.id) 를 가리키는 FK 컬럼명 후보.
 * pickExistingColumn / assert / 조회·insert 모두 이 순서를 맞출 것.
 */
export const QUESTION_THREADS_ROOM_FK_CANDIDATES = [
  "room_id",
  "mentor_student_room_id",
  "msr_id",
  "mentor_student_room",
  "student_room_id",
] as const;

/** connection_notes — staging: mentor_student_room_id, body, … (room_id 없음) */
export const CONNECTION_NOTES_ROOM_FK_CANDIDATES = [
  "mentor_student_room_id",
  "room_id",
  "msr_id",
] as const;

/**
 * row에 room FK 값이 `mentorStudentRoomId`와 일치하는지(어느 후보 열이든).
 */
export function threadRowBelongsToMentorStudentRoom(
  row: Record<string, unknown> | null | undefined,
  mentorStudentRoomId: string
): boolean {
  if (!row) return false;
  const want = mentorStudentRoomId.trim().toLowerCase();
  for (const k of QUESTION_THREADS_ROOM_FK_CANDIDATES) {
    const v = row[k];
    if (v == null) continue;
    if (String(v).trim().toLowerCase() === want) return true;
  }
  return false;
}
