import { NextResponse } from "next/server";
import { getQnaApiSession } from "@/lib/qna/questionRoomApiAuth";
import { createStudentQuestionThread } from "@/lib/qna/questionRoomThreadService";
import { normalizeQuestionSubjectCode } from "@/lib/qna/questionSubjects";
export async function POST(req: Request) {
  const session = await getQnaApiSession();
  if (!session.ok) {
    return NextResponse.json({ ok: false, error: session.error }, { status: session.status });
  }
  if (session.actor !== "student") {
    return NextResponse.json(
      { ok: false, error: "질문 주제는 학생만 만들 수 있습니다." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const o = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const roomId = typeof o.roomId === "string" ? o.roomId.trim() : "";
  const title =
    (typeof o.title === "string" ? o.title : typeof o.threadTitle === "string" ? o.threadTitle : "").trim();
  const subjectRaw =
    (typeof o.subjectTag === "string"
      ? o.subjectTag
      : typeof o.subject === "string"
        ? o.subject
        : ""
    ).trim() || null;
  const subject = normalizeQuestionSubjectCode(subjectRaw);
  const topic = typeof o.topic === "string" ? o.topic.trim() || null : null;

  if (!roomId) {
    return NextResponse.json({ ok: false, error: "roomId가 필요합니다." }, { status: 400 });
  }

  const result = await createStudentQuestionThread(
    session.supabase,
    session.user.id,
    roomId,
    title,
    subject,
    topic
  );
  if (!result.ok) {
    const status = result.status;
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        code: status === 429 ? "weekly_limit_exceeded" : undefined,
      },
      { status }
    );
  }

  return NextResponse.json({
    ok: true,
    threadId: result.threadId,
    message: "질문 주제가 생성되었습니다.",
  });
}
