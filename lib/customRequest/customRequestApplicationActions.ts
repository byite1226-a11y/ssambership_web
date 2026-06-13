"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  insertCustomRequestApplicationAttachment,
  insertMentorApplication,
} from "@/lib/customRequest/customRequestMutations";
import { firstReadableCustomTable, pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import {
  fetchUserDisplayName,
  insertNotificationBestEffort,
} from "@/lib/notifications/notificationInsert";
import { assertMentorApprovedForAction } from "@/lib/mentor/mentorVerificationGate";
import {
  APPLICATION_ATTACHMENT_MAX_FILE_BYTES,
  APPLICATION_ATTACHMENT_MAX_FILES,
  APPLICATION_ATTACHMENT_STORAGE_BUCKET,
  buildApplicationAttachmentStorageObjectPath,
  getApplicationAttachmentFilesFromFormData,
  getOriginalFilenameForDisplay,
  removeApplicationAttachmentStorageObjectBestEffort,
  validateApplicationAttachmentFileForUpload,
  validateApplicationAttachmentFileMagicBytes,
  validateApplicationAttachmentStoragePath,
} from "@/lib/customRequest/applicationAttachmentFiles";

function back(postId: string, msg: string, returnContext: "mentor" | "public"): never {
  const qs = new URLSearchParams();
  qs.set("error", msg);
  if (returnContext === "mentor") {
    redirect(`/mentor/custom-request/posts/${postId}/apply?${qs.toString()}`);
  }
  redirect(`/custom-request/${postId}?${qs.toString()}`);
}

function onFailure(postId: string, code: string | undefined, returnContext: "mentor" | "public"): never {
  const userMsg =
    code === "ALREADY_APPLIED"
      ? "이미 이 의뢰에 제출하신 지원이 있습니다. 중복 제출은 할 수 없습니다."
      : "잠시 후 다시 시도해 주세요.";
  back(postId, userMsg, returnContext);
}

export async function submitMentorCustomRequestApplication(formData: FormData) {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const returnContext: "mentor" | "public" =
    String(formData.get("returnContext") ?? "").trim() === "mentor" ? "mentor" : "public";
  const postId = String(formData.get("postId") ?? "").trim();
  if (!postId) {
    if (returnContext === "mentor") {
      redirect("/mentor/custom-request/posts");
    }
    redirect("/custom-request");
  }
  const mentorGate = await assertMentorApprovedForAction(supabase, user.id);
  if (!mentorGate.ok) {
    back(postId, mentorGate.error, returnContext);
  }
  const proposedPrice = String(formData.get("proposedPrice") ?? "").trim();
  const deliveryAt = String(formData.get("deliveryAt") ?? "").trim();
  const coverNote = String(formData.get("coverNote") ?? "").trim();
  const extraAnswers = String(formData.get("extraAnswers") ?? "").trim();
  const scope = coverNote;

  if (!proposedPrice || !deliveryAt || !coverNote) {
    back(postId, "제안 가격, 예상 납기, 제안 내용을 모두 입력해 주세요.", returnContext);
  }

  const attachFiles = getApplicationAttachmentFilesFromFormData(formData, "applicationAttachmentFiles");
  if (attachFiles.length > APPLICATION_ATTACHMENT_MAX_FILES) {
    back(postId, `첨부 파일은 최대 ${APPLICATION_ATTACHMENT_MAX_FILES}개까지입니다.`, returnContext);
  }
  const preparedFiles: { file: File; buffer: ArrayBuffer; originalName: string }[] = [];
  for (const file of attachFiles) {
    if (file.size > APPLICATION_ATTACHMENT_MAX_FILE_BYTES) {
      back(postId, "첨부 파일은 각 20MB 이하여야 합니다.", returnContext);
    }
    const verr = validateApplicationAttachmentFileForUpload({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (verr) {
      back(postId, verr, returnContext);
    }
    const resolvedOriginalName = getOriginalFilenameForDisplay(file.name);
    if (resolvedOriginalName == null) {
      back(postId, "파일 이름이 비어 있거나 사용할 수 없습니다.", returnContext);
    }
    const fileBuffer = await file.arrayBuffer();
    const mErr = validateApplicationAttachmentFileMagicBytes(file.type, fileBuffer);
    if (mErr) {
      back(postId, mErr, returnContext);
    }
    preparedFiles.push({ file, buffer: fileBuffer, originalName: resolvedOriginalName });
  }

  const r = await insertMentorApplication(supabase, {
    postId,
    mentorId: user.id,
    proposedPrice,
    deliveryAt,
    scope,
    coverNote,
    extraAnswers,
  });
  if (!r.ok) {
    onFailure(postId, r.error, returnContext);
  }
  const applicationId = r.id;

  if (preparedFiles.length > 0) {
    for (const { file, buffer, originalName } of preparedFiles) {
      const { objectPath } = buildApplicationAttachmentStorageObjectPath(applicationId, file.type, file.name);
      const pCheck = validateApplicationAttachmentStoragePath(objectPath, applicationId);
      if (pCheck.ok === false) {
        back(postId, pCheck.userMessage, returnContext);
      }
      const { error: upErr } = await supabase.storage
        .from(APPLICATION_ATTACHMENT_STORAGE_BUCKET)
        .upload(objectPath, buffer, {
          contentType: file.type && file.type.length > 0 ? file.type : "application/octet-stream",
          upsert: false,
        });
      if (upErr) {
        console.error("[submitMentorCustomRequestApplication] application attachment storage upload", upErr);
        back(postId, upErr.message || "첨부 업로드에 실패했습니다. 잠시 후 다시 시도하세요.", returnContext);
      }
      const ins = await insertCustomRequestApplicationAttachment(supabase, {
        applicationId,
        uploadedBy: user.id,
        storagePath: objectPath,
        originalFilename: originalName,
        mimeType: (file.type || "application/octet-stream").toLowerCase(),
        fileSizeBytes: file.size,
      });
      if (ins.ok === false) {
        await removeApplicationAttachmentStorageObjectBestEffort(supabase, objectPath);
        back(postId, `첨부 메타 저장 실패: ${ins.error}`, returnContext);
      }
    }
  }

  const pT = await firstReadableCustomTable(supabase, ["custom_request_posts", "request_posts"]);
  if (pT.table) {
    const { data: postRow } = await supabase.from(pT.table).select("*").eq("id", postId).maybeSingle();
    if (postRow) {
      const authorId = pickDisplayField(postRow as Record<string, unknown>, [
        "author_id",
        "student_id",
        "user_id",
        "requester_id",
        "client_id",
      ]);
      if (authorId && authorId !== "—") {
        const mentorName = await fetchUserDisplayName(supabase, user.id);
        await insertNotificationBestEffort({
          recipientUserId: authorId,
          type: "new_application",
          title: "새 지원서가 도착했어요",
          body: `${mentorName}님이 의뢰에 지원했습니다.`,
          link: `/custom-request/${encodeURIComponent(postId)}/applications/waiting`,
          metadata: { post_id: postId, mentor_id: user.id },
        });
      }
    }
  }

  revalidatePath("/custom-request");
  revalidatePath(`/custom-request/${postId}`);
  revalidatePath(`/custom-request/${postId}/applications`, "page");
  revalidatePath("/mentor/custom-request", "layout");
  revalidatePath("/mentor/custom-request/posts", "page");
  revalidatePath(`/mentor/custom-request/posts/${postId}`, "page");
  revalidatePath(`/mentor/custom-request/posts/${postId}/apply`, "page");

  if (returnContext === "mentor") {
    redirect(`/mentor/custom-request/posts/${postId}?submitted=1`);
  }
  redirect(`/custom-request/${postId}?ok=1`);
}
