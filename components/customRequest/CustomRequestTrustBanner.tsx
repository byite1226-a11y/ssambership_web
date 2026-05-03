import Link from "next/link";

export function CustomRequestTrustBanner() {
  return (
    <section
      className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/30 to-indigo-50/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition hover:shadow-sm select-none"
      aria-label="거래 안내"
    >
      <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
        <span className="text-4xl bg-white p-3 rounded-2xl border border-blue-50 shadow-sm">🛡️</span>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            안전하고 올바른 학습 문화를 함께 만들어요!
          </h2>
          <ul className="mt-2.5 space-y-1 text-xs sm:text-sm break-words text-slate-600 font-medium leading-relaxed">
            <li className="flex items-center gap-1.5">
              <span className="text-blue-500 font-bold select-none">✓</span> 제출용 과제, 보고서, 세목 등의 작성 대행은 제공하지 않아요.
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-blue-500 font-bold select-none">✓</span> 부정행위, 표절, 복사/붙여넣기 제출을 유도하는 요청은 허용하지 않아요.
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-blue-500 font-bold select-none">✓</span> 모든 상담과 거래는 플랫폼 내에서 안전하게 이루어집니다.
            </li>
          </ul>
        </div>
      </div>
      <div className="shrink-0 flex items-center justify-center w-full md:w-auto">
        <Link
          href="/custom-request/new"
          className="inline-flex min-h-[48px] w-full md:w-auto items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 transition"
        >
          의뢰 요청 등록하기 &rarr;
        </Link>
      </div>
    </section>
  );
}
