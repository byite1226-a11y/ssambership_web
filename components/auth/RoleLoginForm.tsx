"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { resolvePostLoginPath, safeInternalNextPath } from "@/lib/auth/getPostLoginPath";
import { mapSupabaseAuthError } from "@/lib/utils/mapSupabaseAuthError";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import type { AuthLoginRole } from "./loginRoleContent";
import type { UserRow } from "@/lib/types/user";

const inputByRole: Record<AuthLoginRole, string> = {
  student:
    "w-full min-h-12 rounded-2xl border-2 border-sky-200/80 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/60 sm:min-h-[3.1rem] sm:px-5",
  mentor:
    "w-full min-h-12 rounded-2xl border-2 border-emerald-200/80 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200/60 sm:min-h-[3.1rem] sm:px-5",
};

const labelByRole: Record<AuthLoginRole, string> = {
  student: "text-sm font-bold text-slate-800 sm:text-base",
  mentor: "text-sm font-bold text-slate-800 sm:text-base",
};

const ctaByRole: Record<AuthLoginRole, string> = {
  student:
    "w-full min-h-14 rounded-2xl bg-blue-600 text-base font-extrabold text-white shadow-[0_8px_24px_-4px_rgba(37,99,235,0.5)] transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[3.5rem] sm:rounded-3xl sm:text-lg",
  mentor:
    "w-full min-h-14 rounded-2xl bg-emerald-700 text-base font-extrabold text-white shadow-[0_8px_24px_-4px_rgba(4,120,87,0.45)] transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[3.5rem] sm:rounded-3xl sm:text-lg",
};

type RoleLoginFormProps = {
  role: AuthLoginRole;
  emailId: string;
  passwordId: string;
  submitLabel: string;
  /** /login?next=... → /login/student?next=... 으로 전달 */
  initialNext?: string | null;
  /** «유형 선택» 링크: `next` 유지하려면 `/login?next=...` */
  rolePickerHref?: string;
};

export function RoleLoginForm({ role, emailId, passwordId, submitLabel, initialNext, rolePickerHref = "/login" }: RoleLoginFormProps) {
  const searchParams = useSearchParams();
  const signupFollowUp = searchParams.get("message") === "signup-check-email";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const supabase = createClient();
    let userId: string | null = null;

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setLoading(false);
        setError(mapSupabaseAuthError(signInError.message));
        return;
      }
      if (!data.user) {
        setError("로그인 정보를 가져오지 못했습니다. 다시 시도해 주세요.");
        setLoading(false);
        return;
      }
      userId = data.user.id;
      if (!data.user.email_confirmed_at) {
        try {
          await supabase.auth.signOut();
        } catch {
          /* */
        }
        setLoading(false);
        setError(
          "이메일 인증이 아직 완료되지 않았습니다. 메일함(스팸 함 포함)의 링크로 인증한 뒤 다시 시도해 주세요."
        );
        return;
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setError(mapSupabaseAuthError(m));
      setLoading(false);
      return;
    }

    let profile: UserRow | null = null;
    let profErr: string | null = null;
    try {
      if (!userId) {
        throw new Error("user id");
      }
      const { data, error: pe } = await getUserProfileById(supabase, userId);
      if (pe) {
        profErr = pe.message;
      } else {
        profile = data;
      }
    } catch (e) {
      profErr = e instanceof Error ? e.message : String(e);
    }
    if (profErr) {
      try {
        await supabase.auth.signOut();
      } catch {
        /* */
      }
      setError(`프로필을 불러오는 중 오류: ${mapDataErrorMessage(profErr)}`);
      setLoading(false);
      return;
    }
    if (!profile) {
      try {
        await supabase.auth.signOut();
      } catch {
        /* */
      }
      setError(
        "가입 프로필(공용 users)이 없습니다. `001_initial_auth_profile.sql` 적용·가입 흐름을 확인하거나 운영자에 문의해 주세요."
      );
      setLoading(false);
      return;
    }

    if (role === "mentor" && profile.role !== "mentor") {
      try {
        await supabase.auth.signOut();
      } catch {
        /* */
      }
      setError("이 로그인 화면은 멘토 계정 전용입니다. 학생 계정이면 학생 로그인을 이용해 주세요.");
      setLoading(false);
      return;
    }
    if (role === "student" && profile.role !== "student") {
      try {
        await supabase.auth.signOut();
      } catch {
        /* */
      }
      setError("이 로그인 화면은 학생 계정 전용입니다. 멘토 계정이면 멘토 로그인을 이용해 주세요.");
      setLoading(false);
      return;
    }

    const fromQuery = safeInternalNextPath(initialNext);
    const nextPath = resolvePostLoginPath(fromQuery ?? null, profile.role);

    setSuccess("로그인에 성공했습니다. 이동합니다.");
    setLoading(false);
    /**
     * `router.push`만 쓰면 브라우저에 방금 쓴 세션 쿠키가 다음 RSC 요청에 아직 안 실릴 수 있어
     * `(mentor)` 레이아웃의 `requireRole`이 비로그인으로 판단하는 레이스가 난다.
     * 전체 문서 네비게이션으로 확실히 같은 쿠키 저장소를 쓰는 요청을 보낸다.
     */
    window.setTimeout(() => {
      window.location.assign(nextPath);
    }, 150);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {signupFollowUp && !error ? (
        <p
          className={
            role === "mentor"
              ? "rounded-2xl border-2 border-emerald-200/90 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 sm:text-base"
              : "rounded-2xl border-2 border-sky-200/90 bg-sky-50 px-4 py-3 text-sm text-sky-900 sm:text-base"
          }
          role="status"
        >
          회원가입이 접수됐어요. 이메일을 열고 인증 링크를 눌러 주시면, 이어서 아래에서 로그인하실 수 있어요. 메일이 안
          보이면 스팸함을 확인해 주세요.
        </p>
      ) : null}
      {error ? (
        <p
          className="rounded-2xl border-2 border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-800 sm:text-base"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="rounded-2xl border-2 border-emerald-200/90 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 sm:text-base"
          role="status"
        >
          {success}
        </p>
      ) : null}

      <div>
        <label htmlFor={emailId} className={labelByRole[role]}>
          이메일
        </label>
        <input
          id={emailId}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputByRole[role] + " mt-2 block"}
          placeholder="name@example.com"
          disabled={loading}
        />
      </div>
      <div>
        <label htmlFor={passwordId} className={labelByRole[role]}>
          비밀번호
        </label>
        <input
          id={passwordId}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputByRole[role] + " mt-2 block"}
          disabled={loading}
        />
        <p className="mt-1.5 text-right text-sm text-slate-500">
          <Link href="/forgot-password" className="font-semibold text-blue-600 underline decoration-blue-200 underline-offset-4 hover:text-blue-800">
            비밀번호를 잊으셨나요?
          </Link>
        </p>
      </div>

      <button type="submit" disabled={loading} className={ctaByRole[role]}>
        {loading ? "처리 중…" : submitLabel}
      </button>

      <p className="text-center text-sm text-slate-600 sm:text-base">
        <Link href={rolePickerHref} className="font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-800">
          ← 로그인 유형 다시 선택
        </Link>
      </p>
    </form>
  );
}
