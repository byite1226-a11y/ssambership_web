import { redirect } from "next/navigation";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { resolvePostLoginPath, safeInternalNextPath } from "@/lib/auth/getPostLoginPath";
import { adminEmailLoginAction } from "@/lib/auth/adminLoginActions";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function pickParam(sp: Record<string, string | string[] | undefined>, key: string): string | null {
  const v = sp[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v) && v[0] && typeof v[0] === "string") return v[0].trim();
  return null;
}

export default async function AdminLoginPage(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const err = pickParam(sp, "error");
  const nextRaw = pickParam(sp, "next");
  const nextSafe = safeInternalNextPath(nextRaw);

  const { user, profile } = await getServerUserWithProfile();
  if (user && profile?.role === "admin") {
    redirect(resolvePostLoginPath(nextSafe, "admin"));
  }

  return (
    <div className="min-h-svh bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-md pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">관리자 로그인</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          쌤버십 운영자 전용 페이지입니다. 관리자 계정으로 로그인해주세요.
        </p>

        {err ? (
          <p className="mt-6 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm font-semibold text-red-100" role="alert">
            {err}
          </p>
        ) : null}

        <form action={adminEmailLoginAction} className="mt-8 space-y-5">
          {nextSafe && !nextSafe.startsWith("/admin/login") ? (
            <input type="hidden" name="next" value={nextSafe} />
          ) : null}
          <div>
            <label htmlFor="admin-login-email" className="block text-sm font-bold text-slate-200">
              이메일
            </label>
            <input
              id="admin-login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-slate-500 focus:border-slate-500 focus:ring-2"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label htmlFor="admin-login-password" className="block text-sm font-bold text-slate-200">
              비밀번호
            </label>
            <input
              id="admin-login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-slate-500 focus:border-slate-500 focus:ring-2"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-3 text-base font-extrabold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500"
          >
            관리자 로그인
          </button>
        </form>
      </div>
    </div>
  );
}
