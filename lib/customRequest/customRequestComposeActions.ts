"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  deleteCustomRequestDraftPost,
  insertCustomRequestPost,
  insertCustomRequestPostAttachment,
  updateCustomRequestDraftPost,
} from "@/lib/customRequest/customRequestMutations";
import { isAuthorOfPost, loadCustomPostById } from "@/lib/customRequest/customRequestQueries";
import { isDraftCustomRequestPost } from "@/lib/customRequest/customRequestPostMappers";
import { findRestrictedPhraseInText, maskContactInUserText } from "@/lib/safety/trustSafetyText";
import {
  buildPostAttachmentStorageObjectPath,
  getOriginalFilenameForDisplay,
  getPostAttachmentFilesFromFormData,
  POST_ATTACHMENT_MAX_FILE_BYTES,
  POST_ATTACHMENT_MAX_FILES,
  POST_ATTACHMENT_STORAGE_BUCKET,
  removePostAttachmentStorageObjectBestEffort,
  validatePostAttachmentFileForUpload,
  validatePostAttachmentFileMagicBytes,
  validatePostAttachmentStoragePath,
} from "@/lib/customRequest/postAttachmentFiles";
import { CUSTOM_REQUEST_BANNED_WARNING } from "@/lib/customRequest/bannedPhrases";

const NEW = "/custom-request/new";

function errRedirect(msg: string, draftId?: string | null) {
  const qs = new URLSearchParams();
  qs.set("error", msg);
  if (draftId) qs.set("draftId", draftId);
  return `${NEW}?${qs.toString()}`;
}

export async function submitCustomRequestNew(formData: FormData) {
  const { user } = await requireRole("student");
  const supabase = await createClient();

  const intent = String(formData.get("intent") ?? "submit");
  const isDraft = intent === "draft";
  const draftId = String(formData.get("draftId") ?? "").trim() || null;

  const category = String(formData.get("category") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "").trim();
  const budgetMin = String(formData.get("budgetMin") ?? "").trim();
  const budgetMax = String(formData.get("budgetMax") ?? "").trim();
  const deliverableFormat = String(formData.get("deliverableFormat") ?? "").trim();
  const agreed = formData.get("agreeProhibited") === "on" && formData.get("agreeNoExternal") === "on";

  if (draftId) {
    const existing = await loadCustomPostById(supabase, draftId);
    if (!existing.row || !isAuthorOfPost(user.id, existing.row).ok || !isDraftCustomRequestPost(existing.row)) {
      redirect(errRedirect("임시저장 글을 찾을 수 없거나 이어서 작성할 수 없습니다."));
    }
  }

  if (!isDraft && (!category || !subject || !body)) {
    redirect(errRedirect("카테고리·제목·의뢰 내용을 입력하세요.", draftId));
  }
  if (!isDraft && !deadline) {
    redirect(errRedirect("마감일을 선택해 주세요.", draftId));
  }

  const combined = `${subject}\n${goal}\n${body}`;
  const banned = findRestrictedPhraseInText(combined);
  if (!isDraft && banned) {
    redirect(errRedirect(CUSTOM_REQUEST_BANNED_WARNING, draftId));
  }
  if (!isDraft && !agreed) {
    redirect(errRedirect("금지행위 동의·외부 연락 금지에 동의해 주세요.", draftId));
  }

  const bMinNum = budgetMin ? Number(budgetMin) : null;
  const bMaxNum = budgetMax ? Number(budgetMax) : null;
  if (!isDraft && ((bMinNum != null && bMinNum < 1000) || (bMaxNum != null && bMaxNum > 200000))) {
    redirect(errRedirect("예산은 1,000~200,000 캐시 범위로 입력해 주세요.", draftId));
  }

  // 안전필터(의뢰 내용): 학생이 작성해 멘토들에게 노출되는 필드의 연락처를 마스킹한다.
  // (대필 금지어 차단은 위에서 이미 적용됨. 임시저장이어도 마스킹은 적용.)
  const maskedSubject = maskContactInUserText(subject);
  const maskedGoal = maskContactInUserText(goal);
  const maskedBody = maskContactInUserText(body);
  const maskedDeliverableFormat = maskContactInUserText(deliverableFormat);

  const attachFiles = getPostAttachmentFilesFromFormData(formData, "postAttachmentFiles");
  if (attachFiles.length > POST_ATTACHMENT_MAX_FILES) {
    redirect(errRedirect(`첨부 파일은 최대 ${POST_ATTACHMENT_MAX_FILES}개까지입니다.`, draftId));
  }
  const preparedFiles: { file: File; buffer: ArrayBuffer; originalName: string }[] = [];
  for (const file of attachFiles) {
    if (file.size > POST_ATTACHMENT_MAX_FILE_BYTES) {
      redirect(errRedirect("첨부 파일은 각 50MB 이하여야 합니다.", draftId));
    }
    const verr = validatePostAttachmentFileForUpload({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (verr) {
      redirect(errRedirect(verr, draftId));
    }
    const resolvedOriginalName = getOriginalFilenameForDisplay(file.name);
    if (resolvedOriginalName == null) {
      redirect(errRedirect("파일 이름이 비어 있거나 사용할 수 없습니다.", draftId));
    }
    const fileBuffer = await file.arrayBuffer();
    const mErr = validatePostAttachmentFileMagicBytes(file.type, fileBuffer);
    if (mErr) {
      redirect(errRedirect(mErr, draftId));
    }
    preparedFiles.push({ file, buffer: fileBuffer, originalName: resolvedOriginalName });
  }

  const input = {
    category,
    subject: maskedSubject,
    goal: maskedGoal,
    body: maskedBody,
    deadline,
    budgetMin,
    budgetMax,
    deliverableFormat: maskedDeliverableFormat,
    agreedProhibited: true,
    agreedNoExternalContact: true,
    authorId: user.id,
    status: isDraft ? "draft" : "open",
  } as const;

  const r = draftId
    ? await updateCustomRequestDraftPost(supabase, draftId, input)
    : await insertCustomRequestPost(supabase, input);

  if (!r.ok) {
    redirect(errRedirect(r.error, draftId));
  }

  if (preparedFiles.length > 0) {
    const row = r.row;
    if (!row || isAuthorOfPost(user.id, row).ok === false) {
      redirect(errRedirect("의뢰 등록 직후 본인 확인에 실패해 첨부를 저장할 수 없습니다.", draftId));
    }
    for (const { file, buffer, originalName } of preparedFiles) {
      const { objectPath } = buildPostAttachmentStorageObjectPath(r.id, file.type, file.name);
      const pCheck = validatePostAttachmentStoragePath(objectPath, r.id);
      if (pCheck.ok === false) {
        redirect(errRedirect(pCheck.userMessage, draftId));
      }
      const { error: upErr } = await supabase.storage
        .from(POST_ATTACHMENT_STORAGE_BUCKET)
        .upload(objectPath, buffer, {
          contentType: file.type && file.type.length > 0 ? file.type : "application/octet-stream",
          upsert: false,
        });
      if (upErr) {
        console.error("[submitCustomRequestNew] post attachment storage upload", upErr);
        redirect(errRedirect(upErr.message || "첨부 업로드에 실패했습니다. 잠시 후 다시 시도하세요.", draftId));
      }
      const ins = await insertCustomRequestPostAttachment(supabase, {
        postId: r.id,
        uploadedBy: user.id,
        storagePath: objectPath,
        originalFilename: originalName,
        mimeType: (file.type || "application/octet-stream").toLowerCase(),
        fileSizeBytes: file.size,
      });
      if (ins.ok === false) {
        await removePostAttachmentStorageObjectBestEffort(supabase, objectPath);
        redirect(errRedirect(`첨부 메타 저장 실패: ${ins.error}`, draftId));
      }
    }
  }

  revalidatePath("/custom-request");
  revalidatePath("/custom-request/posts");
  revalidatePath(`/custom-request/${r.id}`);
  revalidatePath(`/custom-request/${r.id}/applications`, "page");
  if (isDraft) redirect("/custom-request/posts?draft=1");
  redirect(`/custom-request/${r.id}/applications`);
}

export async function deleteCustomRequestDraftAction(formData: FormData) {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const postId = String(formData.get("postId") ?? "").trim();

  if (!postId) {
    const qs = new URLSearchParams({ draft: "1", error: "삭제할 임시저장 글을 찾을 수 없습니다." });
    redirect(`/custom-request/posts?${qs.toString()}`);
  }

  const existing = await loadCustomPostById(supabase, postId);
  if (!existing.row || !isAuthorOfPost(user.id, existing.row).ok || !isDraftCustomRequestPost(existing.row)) {
    const qs = new URLSearchParams({ draft: "1", error: "삭제할 수 없는 임시저장 글입니다." });
    redirect(`/custom-request/posts?${qs.toString()}`);
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "서비스 클라이언트 초기화에 실패했습니다.";
    const qs = new URLSearchParams({ draft: "1", error: msg });
    redirect(`/custom-request/posts?${qs.toString()}`);
  }

  const deleted = await deleteCustomRequestDraftPost(admin, postId);
  if (!deleted.ok) {
    const qs = new URLSearchParams({ draft: "1", error: deleted.error });
    redirect(`/custom-request/posts?${qs.toString()}`);
  }

  revalidatePath("/custom-request/posts");
  revalidatePath("/custom-request");
  redirect("/custom-request/posts?draft=1&deleted=1");
}
