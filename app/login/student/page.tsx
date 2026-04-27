import { Suspense } from "react";
import Link from "next/link";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { RoleLoginForm } from "@/components/auth/RoleLoginForm";
import { loginFormHeadline } from "@/components/auth/loginRoleContent";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { LoginPageFooter } from "@/components/auth/LoginPageFooter";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginStudentPage(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const n = sp.next;
  const initialNext = (typeof n === "string" ? n : Array.isArray(n) ? n[0] : null) ?? null;
  const termsUrl = process.env.NEXT_PUBLIC_LEGAL_TERMS_URL;
  const privacyUrl = process.env.NEXT_PUBLIC_LEGAL_PRIVACY_URL;
  const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL;
  const h = loginFormHeadline.student;
  const backToRolePicker = initialNext ? `/login?next=${encodeURIComponent(initialNext)}` : "/login";

  return (
    <AuthPageLayout
      noCard
      loginLayout
      title={h.title}
      description={<p>{h.description}</p>}
      headerPrefix={
        <Link
          href={backToRolePicker}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900 sm:text-base"
        >
          <span aria-hidden>←</span> 유형 선택으로
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-md space-y-6 sm:space-y-7">
        <div className="rounded-3xl border-2 border-sky-200/60 bg-sky-50/30 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(37,99,235,0.1)] sm:p-7">
          <Suspense fallback={<p className="text-center text-sm text-slate-500">로그인 폼을 불러오는 중…</p>}>
            <RoleLoginForm
              role="student"
              emailId="rl-email-stu"
              passwordId="rl-pw-stu"
              submitLabel="로그인"
              initialNext={initialNext}
              rolePickerHref={backToRolePicker}
            />
          </Suspense>
        </div>
        <div className="px-0.5">
          <SocialAuthButtons tone="student" disabled />
        </div>
        <p className="text-center text-sm text-slate-600">
          <Link href="/signup" className="font-extrabold text-blue-600 underline decoration-blue-200 underline-offset-4">
            학생 회원가입
          </Link>
        </p>
      </div>
      <div className="mt-10">
        <LoginPageFooter termsUrl={termsUrl} privacyUrl={privacyUrl} supportUrl={supportUrl} />
      </div>
    </AuthPageLayout>
  );
}
