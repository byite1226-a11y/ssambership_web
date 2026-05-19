import { NextResponse } from "next/server";
import { getQnaApiSession } from "@/lib/qna/questionRoomApiAuth";
import { markQuestionThreadAnsweredForMentor } from "@/lib/qna/questionRoomThreadService";

type RouteContext = { params: Promise<{ threadId: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const session = await getQnaApiSession();
  if (!session.ok) {
    return NextResponse.json({ ok: false, error: session.error }, { status: session.status });
  }
  if (session.actor !== "mentor") {
    return NextResponse.json(
      { ok: false, error: "멘토만 답변 완료 상태로 변경할 수 있습니다." },
      { status: 403 }
    );
  }

  const { threadId } = await context.params;
  if (!threadId?.trim()) {
    return NextResponse.json({ ok: false, error: "threadId가 필요합니다." }, { status: 400 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const o = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const roomId = typeof o.roomId === "string" ? o.roomId.trim() : "";
  if (!roomId) {
    return NextResponse.json({ ok: false, error: "roomId가 필요합니다." }, { status: 400 });
  }

  const result = await markQuestionThreadAnsweredForMentor(
    session.supabase,
    session.user.id,
    roomId,
    threadId.trim()
  );
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: "답변 도착 상태로 변경되었습니다." });
}
