"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function textFromForm(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function publicOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "";
}

/**
 * Supabase Auth 비밀번호 재설정 메일 발송.
 * Redirect URL은 Supabase Dashboard의 Redirect allowlist에 등록되어 있어야 합니다.
 */
export async function requestPasswordResetAction(formData: FormData) {
  const email = textFromForm(formData.get("email")).toLowerCase();
  if (!email) {
    redirect("/forgot-password?error=empty_email");
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const inferred = host ? `${proto}://${host}`.replace(/\/$/, "") : "";
  const origin = publicOrigin() || inferred;
  if (!origin) {
    redirect("/forgot-password?error=missing_site_url");
  }

  const redirectTo = `${origin}/auth/update-password`;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    const code = error.message.length > 120 ? "reset_failed" : encodeURIComponent(error.message);
    redirect(`/forgot-password?error=${code}`);
  }

  redirect("/forgot-password?sent=1");
}
