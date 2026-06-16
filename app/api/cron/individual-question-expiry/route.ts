import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { runIndividualQuestionExpiryBatch } from "@/lib/individualQuestion/individualQuestionExpiryBatch";
import { individualQuestionExpiryEnabled } from "@/lib/individualQuestion/individualQuestionExpiryConfig";

export const dynamic = "force-dynamic";

function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  const headerSecret = req.headers.get("x-cron-secret")?.trim() ?? "";

  return (
    (bearer.length > 0 && timingSafeStringEqual(bearer, secret)) ||
    (headerSecret.length > 0 && timingSafeStringEqual(headerSecret, secret))
  );
}

function parseAt(req: NextRequest): Date | null {
  const raw = req.nextUrl.searchParams.get("at");
  if (!raw) return new Date();
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!individualQuestionExpiryEnabled()) {
    console.info("[individual-question-expiry-cron] disabled by INDIVIDUAL_QUESTION_EXPIRY_ENABLED");
    return NextResponse.json({
      ok: true,
      disabled: true,
      message: "INDIVIDUAL_QUESTION_EXPIRY_ENABLED is not true; no-op.",
    });
  }

  const at = parseAt(req);
  if (!at) {
    return NextResponse.json({ ok: false, error: "invalid_at", message: "at must be an ISO timestamp" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const summary = await runIndividualQuestionExpiryBatch(supabase, at);

  return NextResponse.json({
    ok: summary.errors.length === 0,
    ...summary,
  });
}
