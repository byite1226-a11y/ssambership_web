import Link from "next/link";
import type { ReactNode } from "react";
import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";
import type { AppRole } from "@/lib/types/user";

type ShellArea = "public" | "student" | "mentor" | "admin";

type AppShellProps = {
  area: ShellArea;
  children: ReactNode;
  sessionRole?: AppRole | null;
};

const globalNav = [
  { href: "/mentors", label: "멘토 찾기" },
  { href: "/login", label: "로그인" },
  { href: "/community", label: "커뮤니티" },
  { href: "/custom-request", label: "맞춤의뢰" },
];

const areaTone: Record<ShellArea, { badge: string; badgeClass: string }> = {
  public: { badge: "Public", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  student: { badge: "Student", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  mentor: { badge: "Mentor", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  admin: { badge: "Admin", badgeClass: "bg-violet-50 text-violet-700 border-violet-200" },
};

export function AppShell({ area, children, sessionRole = null }: AppShellProps) {
  const effectiveArea: ShellArea = (sessionRole ?? area) as ShellArea;
  const tone = areaTone[effectiveArea];
  const showAuthedCtas = area === "public" && sessionRole != null;
  const homeHref =
    sessionRole === "mentor"
      ? getPostLoginPath("mentor")
      : sessionRole === "student"
        ? getPostLoginPath("student")
        : sessionRole === "admin"
          ? getPostLoginPath("admin")
          : "/";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-xl font-black tracking-tight text-blue-700">
            쌤버십
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {globalNav.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${tone.badgeClass}`}>{tone.badge}</span>
            {showAuthedCtas ? (
              <Link
                href={homeHref}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                {sessionRole === "mentor" ? "멘토 홈" : sessionRole === "admin" ? "관리자" : "내 홈"}
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700">
                  로그인
                </Link>
                <Link href="/signup" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
