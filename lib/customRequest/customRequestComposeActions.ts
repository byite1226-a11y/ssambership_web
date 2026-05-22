"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { insertCustomRequestPost, insertCustomRequestPostAttachment } from "@/lib/customRequest/customRequestMutations";
import { isAuthorOfPost } from "@/lib/customRequest/customRequestQueries";
import { findBannedPhrase } from "@/lib/customRequest/bannedPhrases";
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

function errRedirect(msg: string) {
  const qs = new URLSearchParams();
  qs.set("error", msg);
  return `${NEW}?${qs.toString()}`;
}

export async function submitCustomRequestNew(formData: FormData) {
  const { user } = await requireRole("student");
  const supabase = await createClient();

  const intent = String(formData.get("intent") ?? "submit");
  const isDraft = intent === "draft";

  const category = String(formData.get("category") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "").trim();
  const budgetMin = String(formData.get("budgetMin") ?? "").trim();
  const budgetMax = String(formData.get("budgetMax") ?? "").trim();
  const deliverableFormat = String(formData.get("deliverableFormat") ?? "").trim();
  const agreed = formData.get("agreeProhibited") === "on" && formData.get("agreeNoExternal") === "on";

  if (!isDraft && (!category || !subject || !body)) {
    redirect(errRedirect("카테고리·제목·의뢰 내용을 입력하세요."));
  }
  if (!isDraft && body.length < 50) {
    redirect(errRedirect("의뢰 내용은 최소 50자 이상 입력해 주세요."));
  }
  if (!isDraft && !deadline) {
    redirect(errRedirect("마감일을 선택해 주세요."));
  }

  const combined = `${subject}\n${goal}\n${body}`;
  const banned = findBannedPhrase(combined);
  if (!isDraft && banned) {
    redirect(errRedirect(CUSTOM_REQUEST_BANNED_WARNING));
  }
  if (!isDraft && !agreed) {
    redirect(errRedirect("금지행위 동의·외부 연락 금지에 동의해 주세요."));
  }

  const bMinNum = budgetMin ? Number(budgetMin) : null;
  const bMaxNum = budgetMax ? Number(budgetMax) : null;
  if (!isDraft && ((bMinNum != null && bMinNum < 10000) || (bMaxNum != null && bMaxNum > 200000))) {
    redirect(errRedirect("예산은 10,000~200,000 캐시 범위로 입력해 주세요."));
  }

  const attachFiles = getPostAttachmentFilesFromFormData(formData, "postAttachmentFiles");
  if (attachFiles.length > POST_ATTACHMENT_MAX_FILES) {
    redirect(errRedirect(`첨부 파일은 최대 ${POST_ATTACHMENT_MAX_FILES}개까지입니다.`));
  }
  const preparedFiles: { file: File; buffer: ArrayBuffer; originalName: string }[] = [];
  for (const file of attachFiles) {
    if (file.size > POST_ATTACHMENT_MAX_FILE_BYTES) {
      redirect(errRedirect("첨부 파일은 각 50MB 이하여야 합니다."));
    }
    const verr = validatePostAttachmentFileForUpload({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (verr) {
      redirect(errRedirect(verr));
    }
    const resolvedOriginalName = getOriginalFilenameForDisplay(file.name);
    if (resolvedOriginalName == null) {
      redirect(errRedirect("파일 이름이 비어 있거나 사용할 수 없습니다."));
    }
    const fileBuffer = await file.arrayBuffer();
    const mErr = validatePostAttachmentFileMagicBytes(file.type, fileBuffer);
    if (mErr) {
      redirect(errRedirect(mErr));
    }
    preparedFiles.push({ file, buffer: fileBuffer, originalName: resolvedOriginalName });
  }

  const r = await insertCustomRequestPost(supabase, {
    category,
    subject,
    goal,
    body,
    deadline,
    budgetMin,
    budgetMax,
    deliverableFormat,
    agreedProhibited: true,
    agreedNoExternalContact: true,
    authorId: user.id,
    status: isDraft ? "draft" : "open",
  });

  if (!r.ok) {
    redirect(errRedirect(r.error));
  }

  if (preparedFiles.length > 0) {
    const row = r.row;
    if (!row || isAuthorOfPost(user.id, row).ok === false) {
      redirect(errRedirect("의뢰 등록 직후 본인 확인에 실패해 첨부를 저장할 수 없습니다."));
    }
    for (const { file, buffer, originalName } of preparedFiles) {
      const { objectPath } = buildPostAttachmentStorageObjectPath(r.id, file.type, file.name);
      const pCheck = validatePostAttachmentStoragePath(objectPath, r.id);
      if (pCheck.ok === false) {
        redirect(errRedirect(pCheck.userMessage));
      }
      const { error: upErr } = await supabase.storage
        .from(POST_ATTACHMENT_STORAGE_BUCKET)
        .upload(objectPath, buffer, {
          contentType: file.type && file.type.length > 0 ? file.type : "application/octet-stream",
          upsert: false,
        });
      if (upErr) {
        console.error("[submitCustomRequestNew] post attachment storage upload", upErr);
        redirect(errRedirect(upErr.message || "첨부 업로드에 실패했습니다. 잠시 후 다시 시도하세요."));
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
        redirect(errRedirect(`첨부 메타 저장 실패: ${ins.error}`));
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
