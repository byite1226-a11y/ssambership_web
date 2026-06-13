import { Suspense } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LoginSingleRoleCard } from "@/components/auth/LoginDualRolePanel";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginStudentPage(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const n = sp.next;
  const initialNext = (typeof n === "string" ? n : Array.isArray(n) ? n[0] : null) ?? null;
  const backToRolePicker = initialNext ? `/login?next=${encodeURIComponent(initialNext)}` : "/login";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F9FAFB]">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div className="mb-4">
          <Link
            href={backToRolePicker}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <span aria-hidden>←</span> 유형 선택으로
          </Link>
        </div>
        <header className="mb-7 flex flex-col items-center text-center">
          <BrandLogo href="/" className="justify-center" />
        </header>
        <Suspense
          fallback={
            <div className="grid min-h-[420px] place-items-center rounded-2xl border border-gray-200 bg-white text-sm text-gray-500">
              로그인 화면을 불러오는 중…
            </div>
          }
        >
          <LoginSingleRoleCard role="student" initialNext={initialNext} />
        </Suspense>
      </main>
    </div>
  );
}
