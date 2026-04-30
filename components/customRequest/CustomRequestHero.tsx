import Link from "next/link";

export function CustomRequestHero() {
  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50/50 shadow-sm">
      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:gap-8 sm:p-7 lg:p-8">
        <div className="flex min-w-0 flex-col justify-center">
          <h2 className="text-balance break-words text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            혼자 해결하기 어려운 공부, 전문 멘토와 함께 해결해요!
          </h2>
          <p className="mt-3 text-pretty break-words text-sm leading-relaxed text-slate-600 sm:mt-4 sm:text-base">
            학교 공부, 진로 고민, 학습 방법까지 — 내 상황에 맞는 도움을 요청하고, 멘토의 제안을 비교한 뒤 한 분을 골라 이어갈 수 있어요.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center">
            <Link
              href="/custom-request/new"
              className="inline-flex min-h-[48px] min-w-0 flex-1 items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-extrabold text-white shadow-sm hover:bg-indigo-500 min-[400px]:max-w-xs"
            >
              의뢰 요청 등록하기
            </Link>
            <Link
              href="/custom-request/orders"
              className="inline-flex min-h-[48px] min-w-0 flex-1 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-center text-sm font-extrabold text-indigo-900 shadow-sm hover:bg-indigo-100 min-[400px]:max-w-xs"
            >
              내 진행 의뢰 보기
            </Link>
            <a
              href="#flow-steps"
              className="inline-flex min-h-[48px] min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-extrabold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              이용 가이드 보기
            </a>
          </div>
        </div>
        <div className="flex min-h-[10rem] items-stretch sm:min-h-0">
          <div className="flex w-full flex-col justify-between rounded-2xl border border-indigo-100/60 bg-gradient-to-b from-indigo-100/40 to-white p-5 shadow-inner sm:p-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-800/80">맞춤 의뢰</p>
              <p className="mt-2 break-words text-sm font-bold leading-relaxed text-slate-800">
                제목·예산·일정을 정리해 올리면, 멘토가 가격과 진행 방식을 제안해요.
              </p>
            </div>
            <div className="mt-4 flex items-end justify-end gap-1 text-4xl opacity-90" aria-hidden>
              <span>📚</span>
              <span>✨</span>
            </div>
            <p className="mt-3 text-xs break-words text-slate-500">첨부·결제·납품은 이후 단계에서 안내돼요.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
