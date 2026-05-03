import Link from "next/link";

export function CustomRequestHero() {
  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/30">
      <div className="grid gap-6 p-6 sm:grid-cols-2 sm:gap-8 sm:p-8 lg:p-10">
        <div className="flex min-w-0 flex-col justify-center">
          <h1 className="text-balance break-words text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
            혼자 해결하기 어려운 공부, <span className="text-blue-600">전문 멘토와 함께</span> 해결해요!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:mt-4 sm:text-base">
            학교 공부, 진로 고민, 학습 방법까지 — 내 상황에 맞는 도움을 요청하고, 멘토의 제안을 비교한 뒤 한 분을 골라 이어갈 수 있어요.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/custom-request/new"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 transition"
            >
              의뢰 요청 등록하기
            </Link>
            <Link
              href="/custom-request/orders"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition"
            >
              내 진행 의뢰 보기
            </Link>
            <a
              href="#categories"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition"
            >
              이용 가이드 보기
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500 font-medium">
            🛡️ 대필/완성 대행은 제공하지 않습니다. 학습 코칭·피드백 중심으로 도움을 드려요.
          </p>
        </div>
        <div className="flex min-h-[10rem] items-stretch sm:min-h-0 select-none">
          <div className="flex w-full flex-col justify-between rounded-xl border border-indigo-50 bg-gradient-to-b from-indigo-50/30 to-white p-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-blue-600/80">맞춤 의뢰</p>
              <p className="mt-2 break-words text-sm font-bold leading-relaxed text-slate-800">
                제목·예산·일정을 정리해 올리면, 멘토가 가격과 진행 방식을 제안해요.
              </p>
            </div>
            <div className="mt-4 flex items-end justify-end gap-1 text-4xl opacity-90" aria-hidden>
              <span>📚</span>
              <span>✨</span>
            </div>
            <p className="mt-3 text-xs break-words text-slate-500 font-medium">
              첨부·결제·납품은 이후 단계에서 안내돼요.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
