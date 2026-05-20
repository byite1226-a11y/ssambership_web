import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { firstReadableCustomTable } from "@/lib/customRequest/customRequestQueries";

type MutationResult =
  | { ok: true; id: string; row: Record<string, unknown> | null }
  | { ok: false; error: string };

function isMissingColumnError(err: PostgrestError | null): boolean {
  if (!err) return false;
  return /column|does not exist|schema cache/i.test(err.message);
}

async function insertWithCandidates(
  supabase: SupabaseClient,
  table: string,
  payloads: Record<string, unknown>[]
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  let lastError = "insert 후보를 모두 실패했습니다.";
  for (const payload of payloads) {
    const { data, error } = await supabase.from(table).insert(payload).select("*").limit(1).maybeSingle();
    if (!error) {
      return { row: (data as Record<string, unknown> | null) ?? null, error: null };
    }
    lastError = error.message;
    if (!isMissingColumnError(error)) {
      return { row: null, error: error.message };
    }
  }
  return { row: null, error: lastError };
}

function toId(row: Record<string, unknown> | null, err: string | null): MutationResult {
  if (err) return { ok: false, error: err };
  if (!row) return { ok: false, error: "삽입 행이 없습니다." };
  const raw = row.id;
  if (raw === undefined || raw === null) return { ok: false, error: "id 컬럼이 없습니다." };
  return { ok: true, id: String(raw), row };
}

export type NewCustomRequestInput = {
  category: string;
  subject: string;
  goal: string;
  body: string;
  deadline: string;
  budgetMin: string;
  budgetMax: string;
  deliverableFormat: string;
  agreedProhibited: boolean;
  agreedNoExternalContact: boolean;
  authorId: string;
  status?: "open" | "draft";
};

export async function insertCustomRequestPost(
  supabase: SupabaseClient,
  input: NewCustomRequestInput
): Promise<MutationResult> {
  const postStatus = input.status ?? "open";
  if (postStatus !== "draft" && (!input.agreedProhibited || !input.agreedNoExternalContact)) {
    return { ok: false, error: "필수 동의 항목이 필요합니다." };
  }
  const t = "custom_request_posts";
  const bMin = input.budgetMin ? Number(input.budgetMin) : null;
  const bMax = input.budgetMax ? Number(input.budgetMax) : null;
  const common = {
    subject: input.subject,
    body: input.body,
    category: input.category,
    subcategory: input.goal,
    goal: input.goal,
    title: input.subject,
    due_at: input.deadline || null,
    deadline: input.deadline || null,
    due_date: input.deadline || null,
    deliverable_type: input.deliverableFormat,
    deliverable_format: input.deliverableFormat,
    result_format: input.deliverableFormat,
    budget_min: bMin,
    budget_max: bMax,
    status: postStatus,
    state: postStatus,
    author_id: input.authorId,
  };

  const payloads: Record<string, unknown>[] = [
    { ...common },
    {
      category: input.category,
      title: input.subject,
      body: input.body,
      author_id: input.authorId,
      due_at: input.deadline || null,
    },
  ];

  const { row, error } = await insertWithCandidates(supabase, t, payloads);
  return toId(row, error);
}

export async function insertCustomRequestPostAttachment(
  supabase: SupabaseClient,
  input: {
    postId: string;
    uploadedBy: string;
    storagePath: string;
    originalFilename: string;
    mimeType: string;
    fileSizeBytes: number;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from("custom_request_post_attachments").insert({
    custom_request_post_id: input.postId,
    uploaded_by: input.uploadedBy,
    storage_path: input.storagePath,
    original_filename: input.originalFilename,
    mime_type: input.mimeType,
    file_size_bytes: input.fileSizeBytes,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export type MentorApplicationInput = {
  postId: string;
  mentorId: string;
  proposedPrice: string;
  deliveryAt: string;
  scope: string;
  coverNote: string;
  extraAnswers: string;
};

/**
 * custom_request_applications(후보) — 멘토 1지원 1행. 주문·결제·선정은 별 흐름(후속).
 */
export async function insertMentorApplication(
  supabase: SupabaseClient,
  input: MentorApplicationInput
): Promise<MutationResult> {
  const tProbe = await firstReadableCustomTable(supabase, ["custom_request_applications", "request_applications", "custom_bids"]);
  if (!tProbe.table) {
    return { ok: false, error: tProbe.error || "applications 테이블 없음" };
  }
  const t = tProbe.table;
  const { column: postCol } = await pickExistingColumn(supabase, t, [
    "post_id",
    "request_id",
    "custom_request_id",
    "custom_request_post_id",
  ]);
  if (!postCol) {
    return { ok: false, error: "post FK 컬럼을 찾을 수 없습니다." };
  }
  const { column: mentorCol } = await pickExistingColumn(supabase, t, [
    "mentor_id",
    "applicant_id",
    "user_id",
    "proposer_id",
  ]);
  if (!mentorCol) {
    return { ok: false, error: "mentor / applicant FK 컬럼을 찾을 수 없습니다." };
  }

  const { data: dup, error: dupErr } = await supabase
    .from(t)
    .select("id")
    .eq(postCol, input.postId)
    .eq(mentorCol, input.mentorId)
    .limit(1)
    .maybeSingle();
  if (dupErr) {
    if (!/column|does not exist|schema cache/i.test(dupErr.message)) {
      return { ok: false, error: dupErr.message };
    }
  } else if (dup) {
    return { ok: false, error: "ALREADY_APPLIED" };
  }

  const priceNum = input.proposedPrice ? Number.parseFloat(input.proposedPrice) : null;
  const p1: Record<string, unknown> = {
    [postCol]: input.postId,
    [mentorCol]: input.mentorId,
    proposed_price: priceNum,
    price: priceNum,
    bid_amount: priceNum,
    delivery_at: input.deliveryAt || null,
    proposed_due: input.deliveryAt || null,
    due_proposed: input.deliveryAt || null,
    scope: input.scope,
    offer_scope: input.scope,
    services_offered: input.scope,
    cover_letter: input.coverNote,
    message: input.coverNote,
    self_intro: input.coverNote,
    extra_answers: input.extraAnswers,
    answers: input.extraAnswers,
    notes: input.extraAnswers,
    status: "submitted",
    state: "submitted",
  };
  const p2: Record<string, unknown> = {
    [postCol]: input.postId,
    [mentorCol]: input.mentorId,
    content: [input.coverNote, input.extraAnswers].filter(Boolean).join("\n\n"),
  };
  const { row, error } = await insertWithCandidates(supabase, t, [p1, p2]);
  if (error) {
    const e = error;
    if (/unique|23505|duplicate|already exists/i.test(e) || e.includes("ALREADY_APPLIED")) {
      return { ok: false, error: "ALREADY_APPLIED" };
    }
  }
  return toId(row, error);
}

export type CreateOrderFromApplicationInput = {
  postId: string;
  studentId: string;
  applicationId: string;
  mentorId: string;
  /** application에서 스냅샷(지원 제안가) */
  agreedPrice: number;
};

/**
 * 멘토 1명 선정 = custom_request_orders 1행(결제·납품은 후속).
 */
export async function insertCustomRequestOrder(
  supabase: SupabaseClient,
  input: CreateOrderFromApplicationInput
): Promise<MutationResult> {
  if (!Number.isFinite(input.agreedPrice)) {
    return { ok: false, error: "ORDER_PRICE_INVALID" };
  }
  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "custom_orders", "request_orders"]);
  if (!oT.table) {
    return { ok: false, error: oT.error || "orders 테이블 없음" };
  }
  const t = oT.table;
  const ap = input.agreedPrice;
  /** 003 스키마: post_id, student_id, mentor_id NOT NULL + status 등; agreed_price 등 스냅샷 */
  const pLean: Record<string, unknown> = {
    post_id: input.postId,
    student_id: input.studentId,
    mentor_id: input.mentorId,
    application_id: input.applicationId,
    status: "pending",
    state: "pending",
    order_status: "open",
    payment_status: "unpaid",
    agreed_price: ap,
    proposed_price: ap,
    price: ap,
    amount: ap,
  };
  const p1: Record<string, unknown> = {
    post_id: input.postId,
    custom_request_post_id: input.postId,
    custom_request_id: input.postId,
    request_id: input.postId,
    student_id: input.studentId,
    buyer_id: input.studentId,
    client_id: input.studentId,
    user_id: input.studentId,
    author_id: input.studentId,
    requester_id: input.studentId,
    mentor_id: input.mentorId,
    selected_mentor_id: input.mentorId,
    assigned_mentor_id: input.mentorId,
    expert_id: input.mentorId,
    application_id: input.applicationId,
    custom_request_application_id: input.applicationId,
    selected_application_id: input.applicationId,
    status: "pending",
    state: "pending",
    order_status: "open",
    payment_status: "unpaid",
    agreed_price: ap,
    proposed_price: ap,
    price: ap,
    amount: ap,
  };
  const p2: Record<string, unknown> = {
    post_id: input.postId,
    student_id: input.studentId,
    mentor_id: input.mentorId,
    application_id: input.applicationId,
    agreed_price: ap,
    proposed_price: ap,
    price: ap,
  };
  const p3: Record<string, unknown> = {
    custom_request_post_id: input.postId,
    student_id: input.studentId,
    mentor_id: input.mentorId,
    agreed_price: ap,
  };
  const { row, error } = await insertWithCandidates(supabase, t, [pLean, p2, p3, p1]);
  return toId(row, error);
}
