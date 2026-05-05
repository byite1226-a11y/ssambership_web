"use client";

import Link from "next/link";
import Image from "next/image";

export function HeroSection(props: { loggedIn?: boolean }) {
  return (
    <section className="relative max-w-full overflow-x-hidden pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20">
      <div className="flex flex-col items-center justify-between gap-8 lg:flex-row lg:items-center lg:gap-12">
        {/* Left Content */}
        <div className="z-10 w-full min-w-0 flex-1 text-left">
          <h1 className="text-[2.25rem] font-black leading-[1.12] tracking-[-0.03em] text-slate-900 sm:text-5xl lg:text-[56px] lg:leading-[1.1] lg:tracking-[-0.04em]">
            {props.loggedIn ? (
              <>
                공부의 해답을,<br />
                <span className="text-[#3b66f5]">쌤버십 멘토에게</span>
              </>
            ) : (
              <>
                공부는 혼자,<br />
                <span className="text-[#3b66f5]">성장은 함께</span>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-[480px] text-[15px] font-medium leading-relaxed text-slate-500 sm:mt-6 sm:text-[17px] lg:text-[18px]">
            검증된 대학생 멘토와 1:1로 연결되어
            <br />
            질문하고, 배우고, 함께 성장하세요.
          </p>
          <div className="mt-8 flex w-full min-w-0 flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href={props.loggedIn ? "/question-room" : "/mentors"}
              className="inline-flex w-full items-center justify-center rounded-[12px] bg-[#3b66f5] px-6 py-3.5 text-[16px] font-bold text-white shadow-xl shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-[#2d52d1] sm:w-auto sm:px-10 sm:py-4 sm:text-[17px]"
            >
              {props.loggedIn ? "질문방 바로가기" : "멘토 찾기"}
            </Link>
            <Link
              href={props.loggedIn ? "/mentors" : "/signup"}
              className="inline-flex w-full items-center justify-center rounded-[12px] border border-[#3b66f5] px-6 py-3.5 text-[16px] font-bold text-[#3b66f5] transition-all hover:bg-blue-50 sm:w-auto sm:px-10 sm:py-4 sm:text-[17px]"
            >
              {props.loggedIn ? "멘토 찾기" : "무료 체험 시작하기"}
            </Link>
          </div>
        </div>

        {/* Right Illustration/Image with Floating Cards */}
        <div className="relative z-20 flex w-full min-w-0 flex-1 justify-center lg:justify-end">
          <div className="relative h-[min(72vw,320px)] w-full max-w-[540px] sm:h-[380px] lg:h-[440px]">
            {/* Main Hero Visual - High-quality Korean Student Mentoring Image */}
            <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-2xl sm:rounded-[36px] lg:rounded-[40px]">
              <Image 
                src="/landing/hero-student-mentoring.png" 
                alt="Korean student studying for mentoring" 
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 540px"
              />
              {/* Subtle overlay to blend with brand colors */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#3b66f5]/5 to-transparent pointer-events-none" />
            </div>

            {/* Floating Card 1: Mentor Badge — hidden on small screens to avoid horizontal overflow */}
            <div className="absolute -top-6 left-[10%] z-30 hidden w-fit min-w-[160px] animate-bounce-slow items-center gap-3 rounded-2xl border border-blue-50 bg-white p-3 shadow-xl sm:flex">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm bg-blue-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-blue-500">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
              </div>
              <div className="whitespace-nowrap overflow-hidden">
                <p className="text-[12px] font-bold text-slate-800">대학생 멘토</p>
                <p className="text-[11px] font-medium text-slate-500">질문 답변 완료</p>
              </div>
            </div>

            {/* Floating Card 2 */}
            <div className="absolute top-[15%] right-2 z-30 hidden w-fit min-w-[150px] animate-float-delayed items-center gap-3 rounded-2xl border border-orange-50 bg-white p-4 shadow-xl sm:flex lg:-right-6">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" />
                </svg>
              </div>
              <div className="whitespace-nowrap overflow-hidden pr-2">
                <p className="text-[13px] font-bold text-slate-800">새 답변 도착</p>
              </div>
            </div>

            {/* Floating Card 3 */}
            <div className="absolute bottom-[20%] left-2 z-30 hidden w-fit min-w-[170px] animate-float items-center gap-3 rounded-2xl border border-indigo-50 bg-white p-3 shadow-xl sm:flex lg:-left-8">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875V1.5H5.625z" />
                </svg>
              </div>
              <div className="whitespace-nowrap overflow-hidden pr-2">
                <p className="text-[12px] font-bold text-slate-800">학습 노트 업데이트</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite; animation-delay: 1s; }
        .animate-bounce-slow { animation: bounce-slow 6s ease-in-out infinite; }
      `}</style>
    </section>
  );
}
