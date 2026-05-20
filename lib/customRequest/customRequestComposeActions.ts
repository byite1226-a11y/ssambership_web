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
  getPostAttachmentFileFromFormData,
  getOriginalFilenameForDisplay,
  POST_ATTACHMENT_STORAGE_BUCKET,
  removePostAttachmentStorageObjectBestEffort,
  validatePostAttachmentFileForUpload,
  validatePostAttachmentFileMagicBytes,
  validatePostAttachmentStoragePath,
} from "@/lib/customRequest/postAttachmentFiles";

const NEW = "/custom-request/new";

function errRedirect(msg: string) {
  const qs = new URLSearchParams();
  qs.set("error", msg);
  return `${NEW}?${qs.toString()}`;
}

export async function submitCustomRequestNew(formData: FormData) {
  const { user } = await requireRole("student");
  const supabase = await createClient();

  const category = String(formData.get("category") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "").trim();
  const budgetMin = String(formData.get("budgetMin") ?? "").trim();
  const budgetMax = String(formData.get("budgetMax") ?? "").trim();
  const deliverableFormat = String(formData.get("deliverableFormat") ?? "").trim();
  const agreed = formData.get("agreeProhibited") === "on" && formData.get("agreeNoExternal") === "on";

  if (!category || !subject || !body) {
    redirect(errRedirect("카테고리·과목(제목)·설명을 입력하세요."));
  }

  const combined = `${subject}\n${goal}\n${body}`;
  const banned = findBannedPhrase(combined);
  if (banned) {
    redirect(errRedirect(`금지 표현이 포함되어 있습니다: "${banned}". 대필·대신 작성 요청은 등록할 수 없습니다.`));
  }
  if (!agreed) {
    redirect(errRedirect("금지행위 동의·외부 연락 금지에 동의해 주세요."));
  }

  const file = getPostAttachmentFileFromFormData(formData, "postAttachmentFile");
  let fileBuffer: ArrayBuffer | null = null;
  let resolvedOriginalName: string | null = null;
  if (file) {
    const verr = validatePostAttachmentFileForUpload({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (verr) {
      redirect(errRedirect(verr));
    }
    resolvedOriginalName = getOriginalFilenameForDisplay(file.name);
    if (resolvedOriginalName == null) {
      redirect(errRedirect("파일 이름이 비어 있거나 사용할 수 없습니다."));
    }
    fileBuffer = await file.arrayBuffer();
    const mErr = validatePostAttachmentFileMagicBytes(file.type, fileBuffer);
    if (mErr) {
      redirect(errRedirect(mErr));
    }
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
  });

  if (!r.ok) {
    redirect(errRedirect(r.error));
  }

  if (file && fileBuffer && resolvedOriginalName) {
    const row = r.row;
    if (!row || isAuthorOfPost(user.id, row).ok === false) {
      redirect(errRedirect("의뢰 등록 직후 본인 확인에 실패해 첨부를 저장할 수 없습니다."));
    }
    const { objectPath } = buildPostAttachmentStorageObjectPath(r.id, file.type, file.name);
    const pCheck = validatePostAttachmentStoragePath(objectPath, r.id);
    if (pCheck.ok === false) {
      redirect(errRedirect(pCheck.userMessage));
    }
    const { error: upErr } = await supabase.storage
      .from(POST_ATTACHMENT_STORAGE_BUCKET)
      .upload(objectPath, fileBuffer, {
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
      originalFilename: resolvedOriginalName,
      mimeType: (file.type || "application/octet-stream").toLowerCase(),
      fileSizeBytes: file.size,
    });
    if (ins.ok === false) {
      await removePostAttachmentStorageObjectBestEffort(supabase, objectPath);
      redirect(errRedirect(`첨부 메타 저장 실패: ${ins.error}`));
    }
  }

  revalidatePath("/custom-request");
  revalidatePath(`/custom-request/${r.id}`);
  revalidatePath(`/custom-request/${r.id}/applications`, "page");
  redirect(`/custom-request/${r.id}/applications`);
}
