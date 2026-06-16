"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { assertMentorApprovedForAction } from "@/lib/mentor/mentorVerificationGate";
import { fetchMentorIndividualQuestionPrice } from "@/lib/individualQuestion/individualQuestionPricing";
import { type IndividualQuestionEscrowResult } from "@/lib/individualQuestion/individualQuestionTypes";
import { amountCentsFromCashKrw } from "@/lib/subscribe/mentorPlanPricing";
import {
  fileHasContent,
  uploadIndividualQuestionAttachment,
} from "@/lib/individualQuestion/individualQuestionAttachmentStorage";
import { expiryDateForStatus, type IndividualQuestionExpirableStatus } from "@/lib/individualQuestion/individualQuestionExpiryConfig";
import { fetchUserDisplayName, insertNotificationBestEffort } from "@/lib/notifications/notificationInsert";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const STUDENT_LIST_PATH = "/individual-questions";
const MENTOR_LIST_PATH = "/mentor/individual-questions";

type IndividualQuestionRpcResult = IndividualQuestionEscrowResult | IndividualQuestionEscrowResult[] | null;

function textValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string): string | null {
  const value = textValue(formData, key);
  return value.length > 0 ? value : null;
}

function positiveIntegerValue(formData: FormData, key: string): number | null {
  const raw = textValue(formData, key).replace(/[,\s]/g, "");
  if (!/^\d+$/.test(raw)) return null;
  const value = Number.parseInt(raw, 10);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function firstRpcResult(data: IndividualQuestionRpcResult): IndividualQuestionEscrowResult | null {
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

function actionError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function createErrorMessage(codeOrMessage: string | null | undefined): string {
  const value = (codeOrMessage ?? "").toLowerCase();
  if (value.includes("insufficient") || value.includes("cash_insufficient")) {
    return "캐시가 부족해요. 충전 후 다시 질문해 주세요.";
  }
  if (value.includes("mentor_not_approved")) {
    return "아직 승인되지 않은 멘토에게는 개별 질문을 보낼 수 없어요.";
  }
  if (value.includes("invalid_price")) {
    return "개별 질문 단가가 올바르지 않습니다.";
  }
  return "개별 질문을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

async function setQuestionExpiryBestEffort(
  supabase: ReturnType<typeof createServiceRoleClient>,
  questionId: string,
  status: IndividualQuestionExpirableStatus
): Promise<void> {
  const expiresAt = expiryDateForStatus(status).toISOString();
  const { error } = await supabase
    .from("individual_questions")
    .update({ expires_at: expiresAt })
    .eq("id", questionId)
    .eq("status", status);
  if (error) {
    console.error("[individualQuestion] expires_at update failed", {
      questionId,
      status,
      error: error.message,
    });
  }
}

function mentorDisplayLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "멘토";
  return trimmed.endsWith("멘토") ? trimmed : `${trimmed} 멘토`;
}

async function safeDisplayName(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  fallback: string
): Promise<string> {
  try {
    const name = await fetchUserDisplayName(supabase, userId);
    return name && name !== "사용자" ? name : fallback;
  } catch (error) {
    console.error("[individualQuestion] display name lookup failed", { userId, error });
    return fallback;
  }
}

// 지정형 질문 도착 → 지정 멘토에게 best-effort 알림. (생성 1회 전환에서만 호출 → 멱등)
async function notifyDirectQuestionArrival(
  supabase: ReturnType<typeof createServiceRoleClient>,
  args: { mentorId: string; questionId: string; studentId: string }
): Promise<void> {
  const studentName = await safeDisplayName(supabase, args.studentId, "학생");
  await insertNotificationBestEffort({
    recipientUserId: args.mentorId,
    type: "individual_question_assigned",
    title: "새 개별 질문이 도착했어요",
    body: `${studentName}님이 개별 질문을 보냈어요. 답변을 작성해 주세요.`,
    link: `${MENTOR_LIST_PATH}/${args.questionId}`,
    metadata: { questionId: args.questionId, questionType: "direct" },
  });
}

// 공개 질문 claim → 학생에게 best-effort 알림. (claim은 원자적 1회 전환 → 멱등)
async function notifyOpenQuestionClaimed(
  supabase: ReturnType<typeof createServiceRoleClient>,
  args: { studentId: string; questionId: string; mentorId: string }
): Promise<void> {
  const mentorName = mentorDisplayLabel(await safeDisplayName(supabase, args.mentorId, "멘토"));
  await insertNotificationBestEffort({
    recipientUserId: args.studentId,
    type: "individual_question_claimed",
    title: "멘토가 답변을 맡았어요",
    body: `${mentorName}가 공개 질문을 맡았어요. 곧 답변을 받을 수 있어요.`,
    link: `${STUDENT_LIST_PATH}/${args.questionId}`,
    metadata: { questionId: args.questionId, questionType: "open" },
  });
}

// 답변 등록 → 학생에게 best-effort 알림. (status=answered 전환 후 1회 → 멱등) 아직 지급 전.
async function notifyAnswerRegistered(
  supabase: ReturnType<typeof createServiceRoleClient>,
  args: { studentId: string; questionId: string }
): Promise<void> {
  await insertNotificationBestEffort({
    recipientUserId: args.studentId,
    type: "individual_question_answered",
    title: "답변이 등록되었어요",
    body: "개별 질문에 답변이 등록되었어요. 내용을 확인하고 [해결됨]을 누르면 예치 캐시가 멘토에게 지급돼요.",
    link: `${STUDENT_LIST_PATH}/${args.questionId}`,
    metadata: { questionId: args.questionId },
  });
}

// 학생 확정 → 멘토에게 best-effort 알림. (release 성공 1회 → 멱등)
async function notifyAnswerConfirmed(
  supabase: ReturnType<typeof createServiceRoleClient>,
  args: { mentorId: string; questionId: string }
): Promise<void> {
  await insertNotificationBestEffort({
    recipientUserId: args.mentorId,
    type: "individual_question_released",
    title: "학생이 답변을 확정했어요",
    body: "학생이 답변을 확정해 예치 캐시가 지급되었어요.",
    link: `${MENTOR_LIST_PATH}/${args.questionId}`,
    metadata: { questionId: args.questionId },
  });
}

export async function createDirectIndividualQuestionAction(formData: FormData) {
  const { user } = await requireRole("student");
  const mentorId = textValue(formData, "mentorId");
  const idempotencyKey = textValue(formData, "idempotencyKey");
  const title = textValue(formData, "title");
  const body = textValue(formData, "body");
  const subject = optionalText(formData, "subject");
  const topic = optionalText(formData, "topic");
  const attachment = formData.get("attachment");
  const returnPath = mentorId ? `/mentors/${encodeURIComponent(mentorId)}/individual-question/new` : "/mentors";

  if (!mentorId) actionError("/mentors", "멘토 정보가 올바르지 않습니다.");
  if (!idempotencyKey) actionError(returnPath, "제출 정보가 만료되었습니다. 다시 시도해 주세요.");
  if (!title || !body) actionError(returnPath, "제목과 내용을 모두 입력해 주세요.");

  const supabase = await createClient();
  const approval = await assertMentorApprovedForAction(supabase, mentorId);
  if (!approval.ok) actionError(`/mentors/${encodeURIComponent(mentorId)}`, "승인된 멘토에게만 개별 질문을 보낼 수 있어요.");

  const price = await fetchMentorIndividualQuestionPrice(supabase, mentorId);
  if (!price.amountCents) {
    actionError(`/mentors/${encodeURIComponent(mentorId)}`, "이 멘토는 아직 개별 질문 단가를 설정하지 않았어요.");
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc("create_individual_question_with_hold", {
    p_student_id: user.id,
    p_question_type: "direct",
    p_mentor_id: mentorId,
    p_subject: subject,
    p_topic: topic,
    p_title: title,
    p_body: body,
    p_price_cents: price.amountCents,
    p_idempotency_key: idempotencyKey,
  });

  const result = firstRpcResult(data as IndividualQuestionRpcResult);
  if (error || !result?.ok || !result.question_id) {
    actionError(returnPath, createErrorMessage(error?.message ?? result?.code ?? result?.message));
  }

  if (result.code !== "already_exists") {
    await setQuestionExpiryBestEffort(admin, result.question_id, "assigned");
    await notifyDirectQuestionArrival(admin, {
      mentorId,
      questionId: result.question_id,
      studentId: user.id,
    });
  }

  if (result.code !== "already_exists" && attachment instanceof File && fileHasContent(attachment)) {
    const upload = await uploadIndividualQuestionAttachment(admin, {
      questionId: result.question_id,
      messageId: null,
      file: attachment,
    });
    if (!upload.ok) {
      redirect(`${STUDENT_LIST_PATH}/${result.question_id}?created=1&warning=${encodeURIComponent(upload.error)}`);
    }
  }

  revalidatePath(STUDENT_LIST_PATH);
  revalidatePath(MENTOR_LIST_PATH);
  revalidatePath(`/mentors/${mentorId}`);
  redirect(`${STUDENT_LIST_PATH}/${result.question_id}?created=1`);
}

export async function createOpenIndividualQuestionAction(formData: FormData) {
  const { user } = await requireRole("student");
  const idempotencyKey = textValue(formData, "idempotencyKey");
  const title = textValue(formData, "title");
  const body = textValue(formData, "body");
  const subject = optionalText(formData, "subject");
  const topic = optionalText(formData, "topic");
  // 폼 입력은 캐시(=원) 단위. 저장은 정규 cents(=캐시×100)로 변환.
  const priceCash = positiveIntegerValue(formData, "priceCents");
  const attachment = formData.get("attachment");
  const returnPath = `${STUDENT_LIST_PATH}/new`;

  if (!idempotencyKey) actionError(returnPath, "제출 정보가 만료되었습니다. 다시 시도해 주세요.");
  if (!title || !body) actionError(returnPath, "제목과 내용을 모두 입력해 주세요.");
  // 금액 자유화: 최소/최대 강제 없음. 단 0·음수·빈값은 차단(positiveIntegerValue가 양수만 반환).
  if (!priceCash) {
    actionError(returnPath, "예치할 금액을 0보다 큰 캐시로 입력해 주세요.");
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc("create_individual_question_with_hold", {
    p_student_id: user.id,
    p_question_type: "open",
    p_mentor_id: null,
    p_subject: subject,
    p_topic: topic,
    p_title: title,
    p_body: body,
    p_price_cents: amountCentsFromCashKrw(priceCash),
    p_idempotency_key: idempotencyKey,
  });

  const result = firstRpcResult(data as IndividualQuestionRpcResult);
  if (error || !result?.ok || !result.question_id) {
    actionError(returnPath, createErrorMessage(error?.message ?? result?.code ?? result?.message));
  }

  if (result.code !== "already_exists") {
    await setQuestionExpiryBestEffort(admin, result.question_id, "open");
  }

  if (result.code !== "already_exists" && attachment instanceof File && fileHasContent(attachment)) {
    const upload = await uploadIndividualQuestionAttachment(admin, {
      questionId: result.question_id,
      messageId: null,
      file: attachment,
    });
    if (!upload.ok) {
      redirect(`${STUDENT_LIST_PATH}/${result.question_id}?created=1&warning=${encodeURIComponent(upload.error)}`);
    }
  }

  revalidatePath(STUDENT_LIST_PATH);
  revalidatePath(MENTOR_LIST_PATH);
  redirect(`${STUDENT_LIST_PATH}/${result.question_id}?created=1`);
}

export async function claimOpenIndividualQuestionAction(formData: FormData) {
  const { user } = await requireRole("mentor");
  const questionId = textValue(formData, "questionId");
  if (!questionId) actionError(MENTOR_LIST_PATH, "질문 정보가 올바르지 않습니다.");

  const supabase = await createClient();
  const approval = await assertMentorApprovedForAction(supabase, user.id);
  if (!approval.ok) actionError(MENTOR_LIST_PATH, "승인 완료 후 공개 질문을 가져갈 수 있어요.");

  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc("claim_individual_question", {
    p_question_id: questionId,
    p_mentor_id: user.id,
  });
  const result = firstRpcResult(data as IndividualQuestionRpcResult);
  if (error || !result?.ok || !result.question_id) {
    actionError(MENTOR_LIST_PATH, "이미 다른 멘토가 답변을 맡았어요. 목록을 새로 확인해 주세요.");
  }

  await setQuestionExpiryBestEffort(admin, result.question_id, "claimed");

  const { data: claimedRow } = await admin
    .from("individual_questions")
    .select("student_id")
    .eq("id", result.question_id)
    .maybeSingle();
  const claimedStudentId = typeof claimedRow?.student_id === "string" ? claimedRow.student_id : null;
  if (claimedStudentId) {
    await notifyOpenQuestionClaimed(admin, {
      studentId: claimedStudentId,
      questionId: result.question_id,
      mentorId: user.id,
    });
  }

  revalidatePath(MENTOR_LIST_PATH);
  revalidatePath(`${MENTOR_LIST_PATH}/${result.question_id}`);
  revalidatePath(STUDENT_LIST_PATH);
  revalidatePath(`${STUDENT_LIST_PATH}/${result.question_id}`);
  redirect(`${MENTOR_LIST_PATH}/${result.question_id}?claimed=1`);
}

export async function answerDirectIndividualQuestionAction(formData: FormData) {
  const { user } = await requireRole("mentor");
  const questionId = textValue(formData, "questionId");
  const body = textValue(formData, "body");
  const attachment = formData.get("attachment");
  const detailPath = questionId ? `${MENTOR_LIST_PATH}/${encodeURIComponent(questionId)}` : MENTOR_LIST_PATH;

  if (!questionId) actionError(MENTOR_LIST_PATH, "질문 정보가 올바르지 않습니다.");
  if (!body) actionError(detailPath, "답변 내용을 입력해 주세요.");

  const supabase = await createClient();
  const approval = await assertMentorApprovedForAction(supabase, user.id);
  if (!approval.ok) actionError(detailPath, "승인 완료 후 개별 질문에 답변할 수 있어요.");

  const admin = createServiceRoleClient();
  const { data: question, error: questionError } = await admin
    .from("individual_questions")
    .select("id, student_id, question_type, designated_mentor_id, claimed_mentor_id, status, release_ledger_id, refund_ledger_id")
    .eq("id", questionId)
    .maybeSingle();

  const row = question as
    | {
        id: string;
        student_id: string | null;
        question_type: string;
        designated_mentor_id: string | null;
        claimed_mentor_id: string | null;
        status: string;
        release_ledger_id: string | null;
        refund_ledger_id: string | null;
      }
    | null;

  if (questionError || !row) actionError(MENTOR_LIST_PATH, "개별 질문을 찾을 수 없습니다.");
  const ownsDirect = row.question_type === "direct" && row.designated_mentor_id === user.id;
  const ownsOpen = row.question_type === "open" && row.claimed_mentor_id === user.id;
  if (!ownsDirect && !ownsOpen) {
    actionError(MENTOR_LIST_PATH, "이 질문에 답변할 권한이 없습니다.");
  }
  if (row.refund_ledger_id || row.status === "refunded" || row.status === "expired" || row.status === "canceled") {
    actionError(detailPath, "이미 종료된 질문에는 답변할 수 없습니다.");
  }
  if (row.release_ledger_id || row.status === "released") {
    actionError(detailPath, "이미 답변 완료 처리된 질문입니다.");
  }
  const canAnswerDirect = ownsDirect && row.status === "assigned";
  const canAnswerOpen = ownsOpen && row.status === "claimed";
  if (!canAnswerDirect && !canAnswerOpen) {
    actionError(detailPath, "현재 상태에서는 답변 완료 처리를 할 수 없습니다.");
  }

  const { data: message, error: messageError } = await admin
    .from("individual_question_messages")
    .insert({
      question_id: questionId,
      author_id: user.id,
      body,
    })
    .select("id")
    .single();

  const messageId = typeof message?.id === "string" ? message.id : null;
  if (messageError || !messageId) {
    actionError(detailPath, "답변을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  if (attachment instanceof File && fileHasContent(attachment)) {
    const upload = await uploadIndividualQuestionAttachment(admin, {
      questionId,
      messageId,
      file: attachment,
    });
    if (!upload.ok) {
      actionError(detailPath, upload.error);
    }
  }

  const { error: updateError } = await admin
    .from("individual_questions")
    .update({
      status: "answered",
      answered_at: new Date().toISOString(),
    })
    .eq("id", questionId)
    .eq("status", row.status)
    .or(`designated_mentor_id.eq.${user.id},claimed_mentor_id.eq.${user.id}`);

  if (updateError) {
    actionError(detailPath, "답변 상태를 저장하지 못했습니다.");
  }

  // 지급은 즉시 하지 않는다. 학생이 [해결됨]으로 확정할 때 release를 호출(2단계 정산).
  if (row.student_id) {
    await notifyAnswerRegistered(admin, { studentId: row.student_id, questionId });
  }

  revalidatePath(MENTOR_LIST_PATH);
  revalidatePath(`${MENTOR_LIST_PATH}/${questionId}`);
  revalidatePath(STUDENT_LIST_PATH);
  revalidatePath(`${STUDENT_LIST_PATH}/${questionId}`);
  redirect(`${MENTOR_LIST_PATH}/${questionId}?answered=1`);
}

// 학생이 답변을 확정([해결됨]) → 그때 멘토 지급(release). 본인·answered 상태만.
export async function confirmIndividualQuestionAnswerAction(formData: FormData) {
  const { user } = await requireRole("student");
  const questionId = textValue(formData, "questionId");
  const detailPath = questionId ? `${STUDENT_LIST_PATH}/${encodeURIComponent(questionId)}` : STUDENT_LIST_PATH;
  if (!questionId) actionError(STUDENT_LIST_PATH, "질문 정보가 올바르지 않습니다.");

  const admin = createServiceRoleClient();
  const { data: question, error: questionError } = await admin
    .from("individual_questions")
    .select("id, student_id, status, designated_mentor_id, claimed_mentor_id, release_ledger_id")
    .eq("id", questionId)
    .maybeSingle();

  const row = question as
    | {
        id: string;
        student_id: string | null;
        status: string;
        designated_mentor_id: string | null;
        claimed_mentor_id: string | null;
        release_ledger_id: string | null;
      }
    | null;

  if (questionError || !row) actionError(STUDENT_LIST_PATH, "개별 질문을 찾을 수 없습니다.");
  if (row.student_id !== user.id) actionError(STUDENT_LIST_PATH, "이 질문을 확정할 권한이 없습니다.");
  if (row.release_ledger_id || row.status === "released") {
    redirect(`${detailPath}?resolved=1`);
  }
  if (row.status === "refunded" || row.status === "expired" || row.status === "canceled") {
    actionError(detailPath, "이미 종료된 질문입니다.");
  }
  if (row.status !== "answered") {
    actionError(detailPath, "멘토 답변이 등록된 뒤에 확정할 수 있어요.");
  }

  // 지급은 070 RPC만 경유(멱등). 지갑 직접 조작 금지.
  const { data: payoutData, error: payoutError } = await admin.rpc("release_individual_question_payout", {
    p_question_id: questionId,
  });
  const payout = firstRpcResult(payoutData as IndividualQuestionRpcResult);
  if (payoutError || !payout?.ok) {
    actionError(detailPath, "지급 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const mentorId = row.claimed_mentor_id ?? row.designated_mentor_id;
  if (mentorId) {
    await notifyAnswerConfirmed(admin, { mentorId, questionId });
  }

  revalidatePath(MENTOR_LIST_PATH);
  revalidatePath(`${MENTOR_LIST_PATH}/${questionId}`);
  revalidatePath(STUDENT_LIST_PATH);
  revalidatePath(`${STUDENT_LIST_PATH}/${questionId}`);
  redirect(`${detailPath}?resolved=1`);
}
