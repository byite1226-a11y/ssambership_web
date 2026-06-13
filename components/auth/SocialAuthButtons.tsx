type SocialAuthButtonsProps = {
  /** 학생 카드: 블루 톤, 멘토: 민트/그린 */
  tone: "student" | "mentor";
  disabled?: boolean;
  /** 랜딩 카드: 구분선·여백 축소 */
  compact?: boolean;
  /** /login 랜딩: 터치·가독성을 키운 큰 칩 (compact와 함께 쓰지 말 것) */
  size?: "default" | "landing";
};

const baseBtn =
  "inline-flex w-full min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl border px-2 py-2.5 text-xs font-bold transition sm:gap-2 sm:px-2.5 sm:text-sm";
const baseBtnH = "min-h-11 sm:min-h-[2.9rem] md:min-h-12";
const baseBtnHCompact = "min-h-10 sm:min-h-11";
const baseBtnHLanding =
  "min-h-12 min-w-0 !px-2.5 !py-3 !text-sm sm:!min-h-14 sm:!px-3 sm:!py-3.5 sm:!text-base md:!min-h-[3.4rem] md:rounded-3xl";

const toneClass: Record<SocialAuthButtonsProps["tone"], string> = {
  student:
    "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
  mentor:
    "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
};

function GoogleIcon() {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M21.6 12.2c0-.6-.1-1.1-.2-1.6H12v3.1h5.4a3.6 3.6 0 0 1-1.6 2.3v1.9h2.6c1.5-1.4 2.2-3.4 2.2-5.7z"
          fill="#4285F4"
        />
        <path
          d="M12 22c2.2 0 4.1-.7 5.4-1.9l-2.6-1.9c-.7.5-1.6.8-2.8.8-2.1 0-3.9-1.4-4.6-3.3H4.6v1.9A8 8 0 0 0 12 22z"
          fill="#34A853"
        />
        <path
          d="M7.4 14.6a4.7 4.7 0 0 0 0-3.1V9.5H4.6a7.9 7.9 0 0 0 0 5l2.8-1.9z"
          fill="#FBBC05"
        />
        <path
          d="M12 6.3c1.2 0 2.2.4 3 1.1l2.2-2.2A7.8 7.8 0 0 0 12 4a8 8 0 0 0-7.4 4.9l2.8 2.1C8.1 7.7 9.9 6.3 12 6.3z"
          fill="#EA4335"
        />
      </svg>
    </span>
  );
}

function KakaoIcon() {
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FEE500] text-[#191919]"
      aria-hidden
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3C6.5 3 2 6.1 2 10c0 2.1 1.2 3.9 3 5.1v4.1l3.3-1.6c.8.1 1.5.1 1.7.1 5.5 0 10-3.1 10-6.5S17.5 3 12 3z" />
      </svg>
    </span>
  );
}

function NaverIcon() {
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#03C75A] text-base font-extrabold text-white"
      aria-hidden
    >
      N
    </span>
  );
}

export function SocialAuthButtons({ tone, disabled = true, compact = false, size = "default" }: SocialAuthButtonsProps) {
  const c = toneClass[tone];
  const h = compact ? baseBtnHCompact : size === "landing" ? baseBtnHLanding : baseBtnH;
  const landing = size === "landing" && !compact;
  return (
    <div aria-label="소셜 로그인 (준비 중)">
      <div
        className={`flex items-center ${compact ? "gap-2" : landing ? "gap-3" : "gap-2.5"}`}
        role="separator"
      >
        <div className="h-px flex-1 bg-slate-200" />
        <span
          className={`shrink-0 font-extrabold text-slate-500 ${compact ? "text-[11px] sm:text-sm" : landing ? "text-sm sm:text-base" : "text-[11px] sm:text-sm"}`}
        >
          또는
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <p
        className={`text-center text-slate-500 ${compact ? "mt-1 text-[10px] sm:text-xs" : landing ? "mt-2 text-xs sm:mt-2.5 sm:text-sm" : "mt-1.5 text-[10px] sm:text-xs"}`}
      >
        소셜로 계속하기 (준비 중)
      </p>
      <div
        className={`grid grid-cols-3 ${compact ? "mt-2 gap-1.5 sm:gap-2" : landing ? "mt-4 gap-2.5 sm:mt-5 sm:gap-3" : "mt-3.5 gap-1.5 sm:gap-2"}`}
      >
        <button
          type="button"
          disabled={disabled}
          className={`${baseBtn} ${h} ${c}`}
          title="Google 로그인은 준비 중입니다"
        >
          <GoogleIcon />
          <span className="min-w-0 truncate">Google</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          className={`${baseBtn} ${h} ${c}`}
          title="카카오 로그인은 준비 중입니다"
        >
          <KakaoIcon />
          <span className="min-w-0 truncate">카카오</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          className={`${baseBtn} ${h} ${c}`}
          title="네이버 로그인은 준비 중입니다"
        >
          <NaverIcon />
          <span className="min-w-0 truncate">네이버</span>
        </button>
      </div>
    </div>
  );
}
