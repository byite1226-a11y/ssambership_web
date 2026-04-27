"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
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

    setSuccess("로그인에 성공했습니다. 잠시 후 이동합니다.");
    const fromQuery = safeInternalNextPath(initialNext);
    const nextPath = resolvePostLoginPath(fromQuery ?? null, profile.role);
    setTimeout(() => {
      router.push(nextPath);
      router.refresh();
    }, 800);
    setLoading(false);
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
        <p className="mt-1.5 text-right text-sm text-slate-400">
          <span className="cursor-not-allowed border-b border-dotted border-slate-300" title="준비 중">
            비밀번호를 잊으셨나요? (준비 중)
          </span>
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
