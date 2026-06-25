import type { SupabaseClient } from "@supabase/supabase-js";

export type MentorAcademicRecordChangeStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "resubmit_required";

export type MentorAcademicRecordChangeRow = {
  id: string;
  mentor_id: string;
  status: MentorAcademicRecordChangeStatus;
  requested_university_name: string | null;
  change_reason: string | null;
  document_storage_ref: string | null;
  approved_university_name: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
};

export const MENTOR_ACADEMIC_RECORD_CHANGE_TABLE = "mentor_academic_record_change_requests" as const;

export const MENTOR_ACADEMIC_RECORD_CHANGE_COLUMNS = [
  "id",
  "mentor_id",
  "status",
  "requested_university_name",
  "change_reason",
  "document_storage_ref",
  "approved_university_name",
  "reviewed_by",
  "reviewed_at",
  "reject_reason",
  "created_at",
  "updated_at",
].join(", ");

export async function fetchLatestMentorAcademicRecordChange(
  supabase: SupabaseClient,
  mentorId: string
): Promise<{ row: MentorAcademicRecordChangeRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from(MENTOR_ACADEMIC_RECORD_CHANGE_TABLE)
    .select(MENTOR_ACADEMIC_RECORD_CHANGE_COLUMNS)
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { row: null, error: error.message };
  }

  return { row: (data as MentorAcademicRecordChangeRow | null) ?? null, error: null };
}
