import Link from "next/link";

function TrustInfoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 22s7-3.5 7-10.5A7 7 0 0 0 5 11.5C5 18.5 12 22 12 22Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 16.5V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M12 14.2c.25-1.7 1.8-1.8 1.8-3.1 0-1-1-1.6-1.8-1.6-1.2 0-1.8.9-1.8 1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrustShieldIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 3.5L5.5 6.5V12c0 4.2 2.4 6.4 6.5 8.3 4.1-1.9 6.5-4.1 6.5-8.3V6.5L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.2 12.2L11.2 14.1 15.4 9.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SignupTrustBlock() {
  return (
    <div
      className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:gap-6 lg:grid-cols-2"
      role="group"
      aria-label="가입·보안 안내"
    >
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]"
            aria-hidden
          >
            <TrustInfoIcon className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl">안내 사항</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              멘토는 가입 후 학교·전공 인증 단계가 있어요. 인증 메일이 스팸함으로 갈 수 있으니 꼭 확인해 주세요. 개인정보 처리는{" "}
              <Link href="/legal/privacy" className="font-bold text-[#2563EB] underline">
                개인정보처리방침
              </Link>
              에서 확인할 수 있어요.
            </p>
          </div>
        </div>
      </aside>
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#059669]"
            aria-hidden
          >
            <TrustShieldIcon className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl">안전한 연동</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              로그인·계정 정보와 (멘토 가입 시) 첨부 파일은 안전하게 보호돼요. 비밀번호는 8자 이상으로 설정해 주세요.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
