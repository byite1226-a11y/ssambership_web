"use server";

import { redirect } from "next/navigation";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { resolvePostLoginPath, safeInternalNextPath } from "@/lib/auth/getPostLoginPath";
import { createClient } from "@/lib/supabase/server";

function q(next: string | null, error?: string) {
  const p = new URLSearchParams();
  if (error) p.set("error", error);
  if (next) p.set("next", next);
  const qs = p.toString();
  return qs ? `/admin/login?${qs}` : "/admin/login";
}

function textFromForm(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * 관리자 전용 로그인. Supabase Auth 후 `public.users.role = admin`만 통과.
 * service_role 미사용.
 */
export async function adminEmailLoginAction(formData: FormData) {
  const email = textFromForm(formData.get("email"));
  const password = textFromForm(formData.get("password"));
  const nextRaw = textFromForm(formData.get("next"));
  const nextSafe = safeInternalNextPath(nextRaw);
  const nextParam = nextSafe && !nextSafe.startsWith("/admin/login") ? nextSafe : null;

  if (!email || !password) {
    redirect(q(nextParam, "이메일 또는 비밀번호를 확인해주세요."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect(q(nextParam, "이메일 또는 비밀번호를 확인해주세요."));
  }

  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    redirect(q(nextParam, "이메일 인증이 완료된 관리자 계정만 로그인할 수 있습니다."));
  }

  const { data: profile, error: pe } = await getUserProfileById(supabase, data.user.id);
  if (pe || !profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    redirect(q(nextParam, "관리자 권한이 없는 계정입니다."));
  }

  const dest = resolvePostLoginPath(nextParam, "admin");
  redirect(dest);
}
