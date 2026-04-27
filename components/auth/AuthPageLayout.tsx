import type { ReactNode } from "react";
import { AuthTopNav } from "./AuthTopNav";

type AuthPageLayoutProps = {
  title: string;
  /** h1에 덧씌울 클래스(예: 회원가입 네이비 톤) */
  titleClassName?: string;
  description?: ReactNode;
  headerPrefix?: ReactNode;
  wide?: boolean;
  noCard?: boolean;
  /**
   * 회원가입 전용: 전폭 캔버스, 큰 헤더·카드 패딩, 은은한 섀도.
   */
  signupLayout?: boolean;
  /** 로그인 시안: 흰 배경·중앙형·제목 블루 */
  loginLayout?: boolean;
  /** /login 랜딩만: 상·하단 여백·제목-콘텐츠 간격을 조여 첫 화면 밀도에 맞춤 */
  loginLandingCompact?: boolean;
  /** /login 랜딩만: 네비·본문 캔버스를 살짝 넓혀 2열 카드가 시안처럼 넉넉하게 */
  loginLandingWideCanvas?: boolean;
  children: ReactNode;
};

const signupShadow =
  "shadow-[0_1px_2px_rgba(15,23,42,0.03),0_10px_32px_-12px_rgba(15,23,42,0.10)]";

export function AuthPageLayout({
  title,
  titleClassName,
  description,
  headerPrefix,
  wide,
  noCard,
  signupLayout,
  loginLayout,
  loginLandingCompact = false,
  loginLandingWideCanvas = false,
  children,
}: AuthPageLayoutProps) {
  const cardMax = signupLayout ? "" : wide ? "max-w-3xl" : "max-w-md";
  const loginNavAndInnerMax = loginLayout
    ? loginLandingWideCanvas
      ? "max-w-7xl 2xl:max-w-[min(100%,96rem)]"
      : "max-w-6xl xl:max-w-7xl"
    : "max-w-6xl";
  const signupOuter =
    "flex w-full min-w-0 flex-1 flex-col items-stretch px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 xl:px-10 xl:py-6 2xl:px-14";
  const loginOuter = loginLandingCompact
    ? `flex w-full min-w-0 flex-1 flex-col items-stretch bg-white sm:items-center ${
        loginLandingWideCanvas
          ? "px-4 py-7 sm:px-6 sm:py-9 md:px-8 md:py-10 lg:px-10 lg:py-11 xl:px-12"
          : "px-3 py-5 sm:px-5 sm:py-6 md:py-7"
      }`
    : "flex w-full min-w-0 flex-1 flex-col items-stretch bg-white px-4 py-8 sm:items-center sm:px-6 sm:py-10 md:py-12";
  const defaultOuter = `flex flex-1 flex-col items-stretch sm:items-center ${
    signupLayout ? "" : loginLayout ? "px-4 py-8 sm:px-6" : "px-4 py-8 sm:px-6"
  }`;
  const cardClass = signupLayout
    ? `w-full min-w-0 max-w-7xl ${signupShadow} rounded-[2rem] border border-slate-200/50 bg-white/98 p-6 backdrop-blur-sm sm:mx-auto sm:rounded-[2.25rem] sm:p-9 md:p-12 xl:px-16 xl:pb-14 xl:pt-12 2xl:px-20`
    : "rounded-2xl border border-blue-100/90 bg-white/90 p-6 shadow-lg shadow-blue-200/20 backdrop-blur-sm sm:p-8";
  const h1Class = [
    signupLayout
      ? "text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.5rem] md:leading-tight xl:text-[2.65rem]"
      : loginLayout
        ? loginLandingCompact
          ? loginLandingWideCanvas
            ? "text-center text-3xl font-extrabold leading-[1.12] tracking-tight text-blue-600 sm:text-4xl sm:leading-tight md:text-5xl md:leading-[1.1] lg:text-[3rem] lg:leading-[1.08] xl:text-[3.15rem]"
            : "text-center text-[1.7rem] font-extrabold leading-tight tracking-tight text-blue-600 sm:text-3xl sm:leading-tight md:text-4xl md:leading-[1.12] lg:text-[2.4rem]"
          : "text-center text-3xl font-extrabold tracking-tight text-blue-600 sm:text-4xl sm:leading-tight md:text-5xl md:leading-[1.15] lg:text-[2.75rem]"
        : "text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.1rem]",
    titleClassName,
  ]
    .filter(Boolean)
    .join(" ");
  const descClass = signupLayout
    ? "mt-3 max-w-5xl text-base leading-relaxed text-slate-500 sm:text-lg md:text-xl"
    : loginLayout
      ? loginLandingCompact
        ? loginLandingWideCanvas
          ? "mx-auto mt-4 max-w-3xl text-center text-base font-medium leading-relaxed text-slate-600 sm:mt-5 sm:text-lg md:mt-6 md:text-xl md:leading-relaxed"
          : "mx-auto mt-1.5 max-w-xl text-center text-sm font-medium leading-relaxed text-slate-500 sm:mt-2 sm:text-base md:text-[1.05rem]"
        : "mx-auto mt-2.5 max-w-xl text-center text-base font-medium leading-relaxed text-slate-500 sm:mt-3 sm:text-lg md:mt-4 md:text-[1.125rem]"
      : "mt-3 max-w-4xl text-base leading-relaxed text-slate-600";

  return (
    <div
      className={
        signupLayout
          ? "flex min-h-full w-full flex-1 flex-col bg-[#f4f7fb]"
          : loginLayout
            ? "flex min-h-full w-full flex-1 flex-col bg-white"
            : "flex min-h-full w-full flex-1 flex-col bg-gradient-to-b from-slate-50 via-blue-50/60 to-slate-100/90"
      }
    >
      <AuthTopNav
        size={signupLayout ? "hero" : "default"}
        loginPageNav={!!loginLayout}
        contentClassName={loginLayout ? loginNavAndInnerMax : undefined}
      />
      <div className={signupLayout ? signupOuter : loginLayout ? loginOuter : defaultOuter}>
        {noCard ? (
          <div className={`w-full ${loginLayout ? loginNavAndInnerMax : "max-w-6xl"} ${loginLayout ? "mx-auto" : ""}`}>
            {headerPrefix ? <div className="mb-4">{headerPrefix}</div> : null}
            <h1 className={h1Class}>{title}</h1>
            {description ? <div className={descClass}>{description}</div> : null}
            <div
              className={
                loginLayout && loginLandingCompact && loginLandingWideCanvas
                  ? "mt-8 sm:mt-10 md:mt-12 lg:mt-14"
                  : loginLayout && loginLandingCompact
                    ? "mt-4 sm:mt-5"
                    : "mt-7"
              }
            >
              {children}
            </div>
          </div>
        ) : (
          <div className={[cardMax, cardClass].filter(Boolean).join(" ")}>
            {headerPrefix ? <div className="mb-4">{headerPrefix}</div> : null}
            <h1 className={h1Class}>{title}</h1>
            {description ? <div className={descClass}>{description}</div> : null}
            <div className={signupLayout ? "mt-8 sm:mt-10 xl:mt-12" : "mt-6"}>{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}
