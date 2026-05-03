import Link from "next/link";

export function CustomRequestHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-sky-50 via-white to-slate-50/90 shadow-[0_4px_24px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.04]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-500/[0.06] to-transparent" aria-hidden />
      <div className="relative grid gap-8 p-7 sm:grid-cols-2 sm:gap-10 sm:p-9 lg:gap-12 lg:p-11">
        <div className="flex min-w-0 flex-col justify-center">
          <h1 className="text-balance break-words text-[1.65rem] font-black leading-[1.18] tracking-tight text-slate-900 sm:text-4xl sm:leading-[1.15]">
            혼자 해결하기 어려운 공부, <span className="text-blue-600">전문 멘토와 함께</span> 해결해요!
          </h1>
          <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-600 sm:mt-5 sm:text-base sm:leading-relaxed">
            학교 공부, 진로 고민, 학습 방법까지 — 내 상황에 맞는 도움을 요청하고, 멘토의 제안을 비교한 뒤 한 분을 골라 이어갈 수 있어요.
          </p>
          <div className="mt-7 flex flex-wrap items-stretch gap-3 sm:mt-8">
            <Link
              href="/custom-request/new"
              className="inline-flex min-h-[52px] min-w-[10rem] items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
            >
              의뢰 요청 등록하기
            </Link>
            <Link
              href="/custom-request/orders"
              className="inline-flex min-h-[52px] min-w-[10rem] items-center justify-center rounded-2xl border-2 border-slate-200/90 bg-white/95 px-6 py-3.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-white"
            >
              내 진행 의뢰 보기
            </Link>
            <a
              href="#categories"
              className="inline-flex min-h-[52px] min-w-[10rem] items-center justify-center rounded-2xl border-2 border-slate-200/90 bg-white/95 px-6 py-3.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-white"
            >
              이용 가이드 보기
            </a>
          </div>
          <p className="mt-5 max-w-xl text-xs font-medium leading-relaxed text-slate-500">
            🛡️ 대필/완성 대행은 제공하지 않습니다. 학습 코칭·피드백 중심으로 도움을 드려요.
          </p>
        </div>
        <div className="flex min-h-[14rem] flex-col sm:min-h-[17rem]">
          <div className="flex h-full flex-col rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_12px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-600/90">맞춤 의뢰</p>
            <p className="mt-3 break-words text-sm font-bold leading-relaxed text-slate-800 sm:text-[0.95rem]">
              제목·예산·일정을 정리해 올리면, 멘토가 가격과 진행 방식을 제안해요.
            </p>
            <div className="mt-5 flex flex-1 items-end justify-end gap-2 text-4xl opacity-90" aria-hidden>
              <span>📚</span>
              <span>✨</span>
            </div>
            <p className="mt-4 border-t border-slate-100 pt-4 text-xs font-medium leading-relaxed text-slate-500">
              첨부·결제·납품은 이후 단계에서 안내돼요.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
