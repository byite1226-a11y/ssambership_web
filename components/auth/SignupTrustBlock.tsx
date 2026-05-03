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
      className="mt-12 grid grid-cols-1 gap-5 sm:mt-14 sm:gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-8"
      role="group"
      aria-label="가입·보안 안내"
    >
      <aside className="rounded-[2rem] border border-sky-200/55 bg-sky-50/70 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_6px_28px_-6px_rgba(14,165,233,0.08)] sm:p-9 md:p-10">
        <div className="flex items-start gap-4 sm:gap-5">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm sm:h-16 sm:w-16"
            aria-hidden
          >
            <TrustInfoIcon className="h-8 w-8 sm:h-9 sm:w-9" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl md:text-2xl">안내 사항</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-700 sm:mt-4 sm:text-lg md:leading-8">
              멘토는 대학(재) 인증·심사 단계가 이어질 수 있어요. 제출한 자료·프로필은 심사·이의·갱신(정책)에 맞게 조회·보관·삭제가
              관리됩니다. 스팸함을 비우지 말고 인증 메일을 꼭 확인해 주세요.
            </p>
          </div>
        </div>
      </aside>
      <aside className="rounded-[2rem] border border-emerald-200/55 bg-emerald-50/55 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_6px_28px_-6px_rgba(16,185,129,0.08)] sm:p-9 md:p-10">
        <div className="flex items-start gap-4 sm:gap-5">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-sm sm:h-16 sm:w-16"
            aria-hidden
          >
            <TrustShieldIcon className="h-8 w-8 sm:h-9 sm:w-9" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl md:text-2xl">안전한 연동</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-700 sm:mt-4 sm:text-lg md:leading-8">
              로그인·계정 정보·(멘토 가입 시) 첨부 파일은 팀이 설정한 접근 권한과 보안 정책에 따라 처리돼요. 비밀번호는 서비스가
              권장하는 강도를 지키는 것이 좋아요(이미 6자 이상 검사).
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
