"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireQnaActor } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { draftToParam } from "@/lib/qna/draftQuery";
import { QUESTION_THREADS_ROOM_FK_CANDIDATES, threadRowBelongsToMentorStudentRoom } from "@/lib/qna/questionThreadRoomRef";
import { userMatchesMentorInRoomRow, userMatchesStudentInRoomRow } from "@/lib/qna/questionRoomQueries";
import { assertThreadCreationSubscriptionAllowed } from "@/lib/qna/questionThreadSubscriptionGuard";
import {
  createQuestionMessage,
  createQuestionThread,
  formatActionError,
  readMessageFromForm,
  readNoteFromForm,
  readThreadTitleFromForm,
  saveConnectionNote,
} from "@/lib/qna/questionRoomMutations";
import { markQuestionThreadAnsweredForMentor, resolveMentorIdForRoom } from "@/lib/qna/questionRoomThreadService";
import {
  fetchUserDisplayName,
  insertNotificationBestEffort,
} from "@/lib/notifications/notificationInsert";

/**
 * formatActionError 결과에도 Postgrest/HTTP/긴 raw가 남을 수 있으므로, URL 쿼리(사용자 노출)엔 이 함수를 쓴다.
 */
function userFacingActionError(action: "thread" | "message" | "note", err: string): string {
  const s = String(err);
  if (
    /PGRST|postgrest|pg[_\d]|https?:\/\/|\"(hint|code|details)\"|permission denied|violates|relation|schema cache|does not exist|Could not find|42703|42P01|22P02|23503/i.test(
      s
    ) ||
    s.length > 400
  ) {
    if (action === "thread") {
      return "질문 주제를 추가하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }
    if (action === "message") {
      return "메시지를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }
    return "메모를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return formatActionError(action, s);
}

function textFromForm(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function listPathForActor(actor: "student" | "mentor"): string {
  return actor === "mentor" ? "/mentor/question-room" : "/question-room";
}

function detailBasePath(roomId: string, actor: "student" | "mentor"): string {
  return actor === "mentor" ? `/mentor/question-room/${roomId}` : `/question-room/${roomId}`;
}

function buildRedirectUrl(
  roomId: string,
  actor: "student" | "mentor",
  p: {
    thread?: string | null;
    ok?: string | null;
    error?: string | null;
    kind?: "thread" | "message" | "note";
    draftThread?: string;
    draftMessage?: string;
    draftNote?: string;
  }
): string {
  const basePath = detailBasePath(roomId, actor);
  const qs = new URLSearchParams();
  if (p.thread) qs.set("thread", p.thread);
  if (p.ok) qs.set("ok", p.ok);
  if (p.error) qs.set("error", p.error);
  if (p.kind) qs.set("kind", p.kind);
  if (p.draftThread !== undefined) qs.set("dThread", draftToParam(p.draftThread));
  if (p.draftMessage !== undefined) qs.set("dMessage", draftToParam(p.draftMessage));
  if (p.draftNote !== undefined) qs.set("dNote", draftToParam(p.draftNote));
  qs.set("t", Date.now().toString());
  const query = qs.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * `auth.uid()`가 해당 room의 student_id / mentor_id 중 하나와 일치하는지,
 * 그리고 `actor`(DB 프로필)와 같은 당사자 열인지 검증. connection_notes 포함 모든 QnA 쓰기에 공통.
 */
async function assertMentorStudentRoomParty(
  supabase: SupabaseClient,
  roomId: string,
  userId: string,
  actor: "student" | "mentor"
): Promise<string | null> {
  const { data, error } = await supabase.from("mentor_student_rooms").select("*").eq("id", roomId).maybeSingle();
  if (error) {
    console.error("[assertMentorStudentRoomParty] mentor_student_rooms select", { roomId, code: error.code, message: error.message });
    return "room 정보를 확인하는 중 오류가 났습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (!data) return "이 room을 찾을 수 없습니다.";
  const row = data as Record<string, unknown>;
  const isStudent = userMatchesStudentInRoomRow(row, userId);
  const isMentor = userMatchesMentorInRoomRow(row, userId);
  if (!isStudent && !isMentor) {
    return "이 room의 학생·멘토 당사자가 아닙니다.";
  }
  if (actor === "student" && !isStudent) {
    return "이 room의 학생(의뢰자)만 이 작업을 할 수 있습니다.";
  }
  if (actor === "mentor" && !isMentor) {
    return "이 room의 멘토만 이 작업을 할 수 있습니다.";
  }
  return null;
}

/** thread가 해당 mentor_student_room(=roomId)에 속하는지 */
async function assertThreadBelongsToRoom(
  supabase: SupabaseClient,
  roomId: string,
  threadId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("question_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();
  if (error) {
    console.error("[assertThreadBelongsToRoom] question_threads select", { roomId, threadId, code: error.code, message: error.message });
    return "thread를 확인하는 중 오류가 났습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (!data) return "thread를 찾을 수 없습니다.";
  const row = data as Record<string, unknown>;
  if (!threadRowBelongsToMentorStudentRoom(row, roomId)) {
    const roomFkSnapshot: Record<string, unknown> = {};
    for (const k of QUESTION_THREADS_ROOM_FK_CANDIDATES) {
      if (k in row) roomFkSnapshot[k] = row[k];
    }
    console.error("[assertThreadBelongsToRoom] mismatch", {
      roomId,
      threadId,
      roomFkCandidates: [...QUESTION_THREADS_ROOM_FK_CANDIDATES],
      roomFkSnapshot,
    });
    return "이 thread는 현재 room에 속하지 않습니다.";
  }
  return null;
}

export async function createQuestionThreadAction(formData: FormData) {
  const { user, actor } = await requireQnaActor();
  const roomId = textFromForm(formData.get("roomId"));
  const contextThreadId = textFromForm(formData.get("contextThreadId")) || null;
  if (!roomId) {
    redirect(listPathForActor(actor) + "?error=" + encodeURIComponent("room 정보가 없습니다."));
  }

  if (actor === "mentor") {
    const supabaseEarly = await createClient();
    const roomErrEarly = await assertMentorStudentRoomParty(supabaseEarly, roomId, user.id, actor);
    if (roomErrEarly) {
      redirect(listPathForActor(actor) + "?error=" + encodeURIComponent(roomErrEarly));
    }
    redirect(
      buildRedirectUrl(roomId, actor, {
        thread: contextThreadId,
        kind: "thread",
        error: "질문 주제(스레드)는 학생만 새로 만들 수 있습니다. 학생이 주제를 만든 뒤 해당 스레드에 답변해 주세요.",
        draftThread: readThreadTitleFromForm(formData),
      })
    );
  }

  const supabase = await createClient();
  const roomErr = await assertMentorStudentRoomParty(supabase, roomId, user.id, actor);
  if (roomErr) {
    redirect(
      buildRedirectUrl(roomId, actor, {
        thread: contextThreadId,
        kind: "thread",
        error: userFacingActionError("thread", roomErr),
        draftThread: readThreadTitleFromForm(formData),
      })
    );
  }

  const subGate = await assertThreadCreationSubscriptionAllowed(supabase, roomId, actor, { isNewThread: true });
  if (!subGate.ok) {
    redirect(
      buildRedirectUrl(roomId, actor, {
        thread: contextThreadId,
        kind: "thread",
        error: subGate.userMessage,
        draftThread: readThreadTitleFromForm(formData),
      })
    );
  }

  const title = readThreadTitleFromForm(formData);
  const result = await createQuestionThread({
    supabase,
    role: actor,
    userId: user.id,
    roomId,
    title,
  });

  if (!result.ok) {
    redirect(
      buildRedirectUrl(roomId, actor, {
        thread: contextThreadId,
        kind: "thread",
        error: userFacingActionError("thread", result.error),
        draftThread: title,
      })
    );
  }

  const nextThreadId = result.threadId ?? contextThreadId;
  revalidatePath(detailBasePath(roomId, actor));
  redirect(
    buildRedirectUrl(roomId, actor, {
      thread: nextThreadId ?? null,
      kind: "thread",
      ok: "thread가 생성되어 자동 선택되었습니다.",
    })
  );
}

export async function createQuestionMessageAction(formData: FormData) {
  const { user, actor } = await requireQnaActor();
  const roomId = textFromForm(formData.get("roomId"));
  if (!roomId) {
    redirect(listPathForActor(actor) + "?error=" + encodeURIComponent("room 정보가 없습니다."));
  }

  const supabase = await createClient();
  /* question_messages.author_id = user.id (서버) — 폼/히든에서 user id 수신 없음 */
  const roomErr = await assertMentorStudentRoomParty(supabase, roomId, user.id, actor);
  const { threadId, content } = readMessageFromForm(formData);
  const fallbackThread = threadId || textFromForm(formData.get("contextThreadId")) || null;

  if (roomErr) {
    redirect(
      buildRedirectUrl(roomId, actor, {
        thread: fallbackThread,
        kind: "message",
        error: userFacingActionError("message", roomErr),
        draftMessage: content,
      })
    );
  }

  const subGate = await assertThreadCreationSubscriptionAllowed(supabase, roomId, actor, { isNewThread: false });
  if (!subGate.ok) {
    redirect(
      buildRedirectUrl(roomId, actor, {
        thread: fallbackThread,
        kind: "message",
        error: subGate.userMessage,
        draftMessage: content,
      })
    );
  }

  if (threadId) {
    const tErr = await assertThreadBelongsToRoom(supabase, roomId, threadId);
    if (tErr) {
      redirect(
        buildRedirectUrl(roomId, actor, {
          thread: fallbackThread,
          kind: "message",
          error: userFacingActionError("message", tErr),
          draftMessage: content,
        })
      );
    }
  }

  const result = await createQuestionMessage({
    supabase,
    role: actor,
    userId: user.id,
    roomId,
    threadId,
    content,
  });

  if (!result.ok) {
    redirect(
      buildRedirectUrl(roomId, actor, {
        thread: threadId || fallbackThread,
        kind: "message",
        error: userFacingActionError("message", result.error),
        draftMessage: content,
      })
    );
  }

  if (actor === "mentor" && threadId) {
    const answered = await markQuestionThreadAnsweredForMentor(supabase, user.id, roomId, threadId);
    if (!answered.ok) {
      console.error("[createQuestionMessageAction] mark answered", answered.error);
    } else {
      const pair = await resolveMentorIdForRoom(supabase, roomId);
      const studentId = pair.studentId;
      if (studentId) {
        const mentorName = await fetchUserDisplayName(supabase, user.id);
        const link = `/question-room/${encodeURIComponent(roomId)}?thread=${encodeURIComponent(threadId)}`;
        await insertNotificationBestEffort({
          recipientUserId: studentId,
          type: "question_answered",
          title: "새 답변이 도착했어요",
          body: `${mentorName}님이 답변을 남겼습니다.`,
          link,
          metadata: { room_id: roomId, thread_id: threadId },
        });
      }
    }
  }

  revalidatePath(detailBasePath(roomId, actor));
  redirect(
    buildRedirectUrl(roomId, actor, {
      thread: threadId || fallbackThread,
      kind: "message",
      ok: actor === "mentor" ? "답변이 저장되었습니다. 입력창을 초기화했습니다." : "질문이 저장되었습니다. 입력창을 초기화했습니다.",
    })
  );
}

/**
 * P0: 질문/답변 메시지 전송. `createQuestionMessageAction`과 동일하며 room·thread·역할을 서버에서 다시 검증한다.
 * (폼의 `actor`·hidden id만으로는 권한을 판단하지 않음.)
 */
export const sendQuestionMessageAction = createQuestionMessageAction;

/**
 * STEP 5: 질문방 채팅 파일/사진 첨부 전송.
 * 파일을 private 버킷에 업로드 → 서명 URL을 메시지 본문(첨부 마커)으로 저장.
 * room/thread/역할은 서버에서 재검증한다.
 */
export async function sendQuestionAttachmentAction(formData: FormData) {
  const { uploadQuestionRoomAttachment, buildAttachmentMessageBody } = await import(
    "@/lib/qna/questionRoomAttachmentStorage"
  );
  const { user, actor } = await requireQnaActor();
  const roomId = textFromForm(formData.get("roomId"));
  const threadId = textFromForm(formData.get("threadId"));
  if (!roomId) {
    redirect(listPathForActor(actor) + "?error=" + encodeURIComponent("room 정보가 없습니다."));
  }
  const fallbackThread = threadId || textFromForm(formData.get("contextThreadId")) || null;

  const file = formData.get("attachment");
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      buildRedirectUrl(roomId, actor, {
        thread: fallbackThread,
        kind: "message",
        error: "첨부할 파일을 선택해 주세요.",
      })
    );
  }
  if (!threadId) {
    redirect(
      buildRedirectUrl(roomId, actor, {
        thread: fallbackThread,
        kind: "message",
        error: "질문을 먼저 선택한 뒤 파일을 첨부해 주세요.",
      })
    );
  }

  const supabase = await createClient();
  const roomErr = await assertMentorStudentRoomParty(supabase, roomId, user.id, actor);
  if (roomErr) {
    redirect(
      buildRedirectUrl(roomId, actor, { thread: fallbackThread, kind: "message", error: userFacingActionError("message", roomErr) })
    );
  }
  const tErr = await assertThreadBelongsToRoom(supabase, roomId, threadId);
  if (tErr) {
    redirect(
      buildRedirectUrl(roomId, actor, { thread: fallbackThread, kind: "message", error: userFacingActionError("message", tErr) })
    );
  }

  const typedFile = file as File;
  const buffer = Buffer.from(await typedFile.arrayBuffer());
  const uploaded = await uploadQuestionRoomAttachment(supabase, {
    roomId,
    threadId,
    buffer,
    mime: typedFile.type || "application/octet-stream",
    name: typedFile.name || "attachment",
  });
  if (uploaded.error || !uploaded.url) {
    redirect(
      buildRedirectUrl(roomId, actor, {
        thread: threadId,
        kind: "message",
        error: uploaded.error ?? "첨부 업로드에 실패했습니다.",
      })
    );
  }

  const body = buildAttachmentMessageBody({
    isImage: uploaded.isImage,
    filename: uploaded.filename,
    url: uploaded.url,
  });

  const result = await createQuestionMessage({ supabase, role: actor, userId: user.id, roomId, threadId, content: body });
  if (!result.ok) {
    redirect(
      buildRedirectUrl(roomId, actor, { thread: threadId, kind: "message", error: userFacingActionError("message", result.error) })
    );
  }

  if (actor === "mentor") {
    const answered = await markQuestionThreadAnsweredForMentor(supabase, user.id, roomId, threadId);
    if (answered.ok) {
      const pair = await resolveMentorIdForRoom(supabase, roomId);
      if (pair.studentId) {
        const mentorName = await fetchUserDisplayName(supabase, user.id);
        await insertNotificationBestEffort({
          recipientUserId: pair.studentId,
          type: "question_answered",
          title: "새 답변이 도착했어요",
          body: `${mentorName}님이 파일을 보냈습니다.`,
          link: `/question-room/${encodeURIComponent(roomId)}?thread=${encodeURIComponent(threadId)}`,
          metadata: { room_id: roomId, thread_id: threadId },
        });
      }
    }
  }

  revalidatePath(detailBasePath(roomId, actor));
  redirect(
    buildRedirectUrl(roomId, actor, { thread: threadId, kind: "message", ok: "첨부를 전송했습니다." })
  );
}

export async function saveConnectionNoteAction(formData: FormData) {
  const { user, actor } = await requireQnaActor();
  const roomId = textFromForm(formData.get("roomId"));
  const contextThreadId = textFromForm(formData.get("contextThreadId")) || null;
  if (!roomId) {
    redirect(listPathForActor(actor) + "?error=" + encodeURIComponent("room 정보가 없습니다."));
  }

  const supabase = await createClient();
  const roomErr = await assertMentorStudentRoomParty(supabase, roomId, user.id, actor);
  const content = readNoteFromForm(formData);

  if (roomErr) {
    redirect(
      buildRedirectUrl(roomId, actor, {
        thread: contextThreadId,
        kind: "note",
        error: userFacingActionError("note", roomErr),
        draftNote: content,
      })
    );
  }

  const result = await saveConnectionNote({
    supabase,
    role: actor,
    userId: user.id,
    roomId,
    content,
  });

  if (!result.ok) {
    redirect(
      buildRedirectUrl(roomId, actor, {
        thread: contextThreadId,
        kind: "note",
        error: userFacingActionError("note", result.error),
        draftNote: content,
      })
    );
  }

  revalidatePath(detailBasePath(roomId, actor));
  redirect(
    buildRedirectUrl(roomId, actor, {
      thread: contextThreadId,
      kind: "note",
      ok: "connection note를 저장했습니다.",
    })
  );
}
