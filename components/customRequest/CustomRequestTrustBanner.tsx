import Link from "next/link";

export function CustomRequestTrustBanner() {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-blue-100/90 bg-gradient-to-br from-slate-50 via-blue-50/35 to-indigo-50/25 shadow-[0_4px_20px_rgba(30,64,175,0.07)] ring-1 ring-slate-900/[0.03]"
      aria-label="거래 안내"
    >
      <div className="flex flex-col gap-8 p-7 sm:flex-row sm:items-stretch sm:gap-10 sm:p-9">
        <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
          <div className="hidden shrink-0 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm sm:flex sm:flex-col sm:items-center sm:justify-center select-none">
            <span className="text-3xl leading-none" aria-hidden>
              🛡️
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-800/80">안전·신뢰</p>
            <h2 className="mt-2 text-base font-extrabold leading-snug text-slate-900 sm:text-lg">
              안전하고 올바른 학습 문화를 함께 만들어요!
            </h2>
            <ul className="mt-4 space-y-3.5 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white shadow-sm select-none">
                  ✓
                </span>
                <span>제출용 과제, 보고서, 세목 등의 작성 대행은 제공하지 않아요.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white shadow-sm select-none">
                  ✓
                </span>
                <span>부정행위, 표절, 복사/붙여넣기 제출을 유도하는 요청은 허용하지 않아요.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white shadow-sm select-none">
                  ✓
                </span>
                <span>모든 상담과 거래는 플랫폼 내에서 안전하게 이루어집니다.</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col justify-center border-t border-slate-200/60 pt-6 sm:w-52 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
          <Link
            href="/custom-request/new"
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
          >
            의뢰 요청 등록하기 &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
