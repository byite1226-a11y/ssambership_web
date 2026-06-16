"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { assertMentorApprovedForAction } from "@/lib/mentor/mentorVerificationGate";
import { fetchMentorIndividualQuestionPrice } from "@/lib/individualQuestion/individualQuestionPricing";
import type { IndividualQuestionEscrowResult } from "@/lib/individualQuestion/individualQuestionTypes";
import {
  fileHasContent,
  uploadIndividualQuestionAttachment,
} from "@/lib/individualQuestion/individualQuestionAttachmentStorage";
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
    .select("id, question_type, designated_mentor_id, status, release_ledger_id, refund_ledger_id")
    .eq("id", questionId)
    .maybeSingle();

  const row = question as
    | {
        id: string;
        question_type: string;
        designated_mentor_id: string | null;
        status: string;
        release_ledger_id: string | null;
        refund_ledger_id: string | null;
      }
    | null;

  if (questionError || !row) actionError(MENTOR_LIST_PATH, "개별 질문을 찾을 수 없습니다.");
  if (row.question_type !== "direct" || row.designated_mentor_id !== user.id) {
    actionError(MENTOR_LIST_PATH, "이 질문에 답변할 권한이 없습니다.");
  }
  if (row.refund_ledger_id || row.status === "refunded" || row.status === "expired" || row.status === "canceled") {
    actionError(detailPath, "이미 종료된 질문에는 답변할 수 없습니다.");
  }
  if (row.release_ledger_id || row.status === "released") {
    actionError(detailPath, "이미 답변 완료 처리된 질문입니다.");
  }
  if (row.status !== "assigned") {
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
    .eq("status", "assigned")
    .eq("designated_mentor_id", user.id);

  if (updateError) {
    actionError(detailPath, "답변 상태를 저장하지 못했습니다.");
  }

  const { data: payoutData, error: payoutError } = await admin.rpc("release_individual_question_payout", {
    p_question_id: questionId,
  });
  const payout = firstRpcResult(payoutData as IndividualQuestionRpcResult);
  if (payoutError || !payout?.ok) {
    actionError(detailPath, "답변은 저장되었지만 지급 처리에 실패했습니다. 관리자에게 문의해 주세요.");
  }

  revalidatePath(MENTOR_LIST_PATH);
  revalidatePath(`${MENTOR_LIST_PATH}/${questionId}`);
  revalidatePath(STUDENT_LIST_PATH);
  revalidatePath(`${STUDENT_LIST_PATH}/${questionId}`);
  redirect(`${MENTOR_LIST_PATH}/${questionId}?answered=1`);
}
