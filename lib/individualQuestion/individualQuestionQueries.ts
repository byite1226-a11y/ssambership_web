import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IndividualQuestionStatus } from "@/lib/individualQuestion/individualQuestionTypes";
import { signIndividualQuestionAttachment } from "@/lib/individualQuestion/individualQuestionAttachmentStorage";

export type IndividualQuestionRow = {
  id: string;
  student_id: string;
  question_type: "direct" | "open";
  designated_mentor_id: string | null;
  claimed_mentor_id: string | null;
  claimed_at: string | null;
  subject: string | null;
  topic: string | null;
  title: string;
  body: string;
  price_cents: number;
  status: IndividualQuestionStatus | string;
  expires_at: string | null;
  answered_at: string | null;
  released_at: string | null;
  refunded_at: string | null;
  hold_ledger_id: string | null;
  release_ledger_id: string | null;
  refund_ledger_id: string | null;
  created_at: string;
  updated_at: string;
};

export type IndividualQuestionMessageRow = {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type IndividualQuestionAttachmentRow = {
  id: string;
  question_id: string;
  message_id: string | null;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  created_at: string;
};

export type IndividualQuestionAttachmentView = IndividualQuestionAttachmentRow & {
  signedUrl: string | null;
};

export type IndividualQuestionListItem = IndividualQuestionRow & {
  studentName: string;
  mentorName: string;
};

export type IndividualQuestionDetail = IndividualQuestionListItem & {
  messages: Array<IndividualQuestionMessageRow & { authorName: string; authorRole: "student" | "mentor" | "unknown" }>;
  attachments: IndividualQuestionAttachmentView[];
};

type UserNameRow = {
  id: string;
  full_name?: string | null;
  nickname?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

const QUESTION_COLUMNS =
  "id, student_id, question_type, designated_mentor_id, claimed_mentor_id, claimed_at, subject, topic, title, body, price_cents, status, expires_at, answered_at, released_at, refunded_at, hold_ledger_id, release_ledger_id, refund_ledger_id, created_at, updated_at";

function displayName(row: UserNameRow | null | undefined, fallback: string): string {
  const value = row?.full_name?.trim() || row?.nickname?.trim() || row?.name?.trim() || row?.email?.trim();
  return value || fallback;
}

async function fetchUserNameMap(supabase: SupabaseClient, ids: string[]): Promise<Map<string, UserNameRow>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, UserNameRow>();
  if (uniqueIds.length === 0) return map;

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, nickname, name, email, role")
    .in("id", uniqueIds);

  if (error || !data) return map;
  for (const row of data as UserNameRow[]) {
    if (row.id) map.set(row.id, row);
  }
  return map;
}

function enrichQuestions(rows: IndividualQuestionRow[], names: Map<string, UserNameRow>): IndividualQuestionListItem[] {
  return rows.map((row) => {
    const mentorId = row.designated_mentor_id ?? row.claimed_mentor_id;
    return {
      ...row,
      studentName: displayName(names.get(row.student_id), "학생"),
      mentorName: displayName(mentorId ? names.get(mentorId) : null, "멘토"),
    };
  });
}

export function formatIndividualQuestionPrice(amountCents: number | null | undefined): string {
  const value = typeof amountCents === "number" && Number.isFinite(amountCents) ? amountCents : 0;
  return `${Math.trunc(value).toLocaleString("ko-KR")}캐시`;
}

export function formatIndividualQuestionDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export function individualQuestionStatusLabel(status: string | null | undefined): string {
  switch ((status ?? "").toLowerCase()) {
    case "assigned":
      return "전달됨";
    case "answered":
      return "답변됨";
    case "released":
      return "완료";
    case "refunded":
      return "환불";
    case "expired":
      return "만료";
    case "canceled":
      return "취소";
    case "open":
      return "공개 대기";
    case "claimed":
      return "멘토 배정";
    default:
      return "진행 중";
  }
}

export function individualQuestionStatusBadgeClass(status: string | null | undefined): string {
  switch ((status ?? "").toLowerCase()) {
    case "released":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "answered":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "assigned":
    case "claimed":
    case "open":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "refunded":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "expired":
    case "canceled":
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export async function fetchStudentDirectIndividualQuestions(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ rows: IndividualQuestionListItem[]; error: string | null }> {
  const { data, error } = await supabase
    .from("individual_questions")
    .select(QUESTION_COLUMNS)
    .eq("student_id", studentId)
    .eq("question_type", "direct")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) return { rows: [], error: error.message };
  const rows = (data ?? []) as IndividualQuestionRow[];
  const names = await fetchUserNameMap(
    supabase,
    rows.flatMap((row) => [row.student_id, row.designated_mentor_id ?? row.claimed_mentor_id ?? ""])
  );
  return { rows: enrichQuestions(rows, names), error: null };
}

export async function fetchMentorDirectIndividualQuestions(
  supabase: SupabaseClient,
  mentorId: string
): Promise<{ rows: IndividualQuestionListItem[]; error: string | null }> {
  const { data, error } = await supabase
    .from("individual_questions")
    .select(QUESTION_COLUMNS)
    .eq("question_type", "direct")
    .eq("designated_mentor_id", mentorId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) return { rows: [], error: error.message };
  const rows = (data ?? []) as IndividualQuestionRow[];
  const names = await fetchUserNameMap(
    supabase,
    rows.flatMap((row) => [row.student_id, row.designated_mentor_id ?? ""])
  );
  return { rows: enrichQuestions(rows, names), error: null };
}

export async function fetchIndividualQuestionDetail(
  supabase: SupabaseClient,
  questionId: string
): Promise<{ detail: IndividualQuestionDetail | null; error: string | null }> {
  const { data: question, error: questionError } = await supabase
    .from("individual_questions")
    .select(QUESTION_COLUMNS)
    .eq("id", questionId)
    .maybeSingle();

  if (questionError) return { detail: null, error: questionError.message };
  if (!question) return { detail: null, error: "개별 질문을 찾을 수 없습니다." };

  const row = question as IndividualQuestionRow;
  const [messagesResp, attachmentsResp] = await Promise.all([
    supabase
      .from("individual_question_messages")
      .select("id, question_id, author_id, body, created_at")
      .eq("question_id", questionId)
      .order("created_at", { ascending: true }),
    supabase
      .from("individual_question_attachments")
      .select("id, question_id, message_id, storage_path, file_name, mime_type, created_at")
      .eq("question_id", questionId)
      .order("created_at", { ascending: true }),
  ]);

  if (messagesResp.error) return { detail: null, error: messagesResp.error.message };
  if (attachmentsResp.error) return { detail: null, error: attachmentsResp.error.message };

  const messages = (messagesResp.data ?? []) as IndividualQuestionMessageRow[];
  const attachments = (attachmentsResp.data ?? []) as IndividualQuestionAttachmentRow[];
  const names = await fetchUserNameMap(
    supabase,
    [
      row.student_id,
      row.designated_mentor_id ?? "",
      row.claimed_mentor_id ?? "",
      ...messages.map((message) => message.author_id),
    ].filter(Boolean)
  );

  const [enriched] = enrichQuestions([row], names);
  const signedAttachments = await Promise.all(
    attachments.map(async (attachment) => ({
      ...attachment,
      signedUrl: await signIndividualQuestionAttachment(supabase, attachment.storage_path),
    }))
  );

  return {
    detail: {
      ...enriched,
      messages: messages.map((message) => {
        const role = names.get(message.author_id)?.role;
        return {
          ...message,
          authorName: displayName(names.get(message.author_id), "사용자"),
          authorRole: role === "student" || role === "mentor" ? role : "unknown",
        };
      }),
      attachments: signedAttachments,
    },
    error: null,
  };
}
