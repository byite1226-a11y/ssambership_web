import Link from "next/link";

export function LandingCTASection() {
  const benefits = [
    { icon: "🎁", label: "무료 15질문 제공", desc: "체험 기간 동안 제공" },
    { icon: "💡", label: "1:1 맞춤 답변", desc: "전공 멘토의 상세 답변" },
    { icon: "📝", label: "연결노트 무료 제공", desc: "내 공부 흐름 정리" },
  ];

  return (
    <section className="py-12">
      <div className="relative overflow-hidden rounded-[40px] bg-[#f4f7ff] p-10 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex flex-col md:flex-row items-center gap-10 z-10 text-center md:text-left">
          {/* Gift Box Icon */}
          <div className="h-32 w-32 flex-shrink-0 animate-bounce-slow">
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="45" width="80" height="60" rx="8" fill="#3b66f5" />
              <rect x="15" y="35" width="90" height="15" rx="4" fill="#5c85ff" />
              <path d="M60 35V105" stroke="white" strokeWidth="12" />
              <path d="M15 42.5H105" stroke="white" strokeWidth="2" opacity="0.2" />
              <circle cx="45" cy="25" r="15" stroke="#3b66f5" strokeWidth="8" fill="none" />
              <circle cx="75" cy="25" r="15" stroke="#3b66f5" strokeWidth="8" fill="none" />
              <path d="M60 35L45 15M60 35L75 15" stroke="#3b66f5" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>

          <div>
            <h2 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">
              지금 가입하면 <span className="text-[#3b66f5]">1주일 무료!</span>
            </h2>
            <p className="mt-3 text-[18px] font-medium text-slate-500">
              무료 체험 기간 동안 무료 15질문을<br />
              이용할 수 있어요.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12 z-10 w-full lg:w-auto">
          <div className="flex flex-col gap-6 w-full md:w-auto">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm text-[20px]">
                  {b.icon}
                </div>
                <div>
                  <p className="text-[15px] font-black text-slate-800 leading-none">{b.label}</p>
                  <p className="mt-1.5 text-[13px] font-bold text-slate-400 leading-none">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link 
            href="/signup" 
            className="w-full md:w-auto rounded-[16px] bg-[#3b66f5] px-12 py-5 text-[18px] font-bold text-white shadow-2xl shadow-blue-200 transition-all hover:bg-[#2d52d1] hover:-translate-y-1 text-center"
          >
            무료 체험 시작하기
          </Link>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-100/50 mix-blend-multiply blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-100/50 mix-blend-multiply blur-3xl" />
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
      `}</style>
    </section>
  );
}
