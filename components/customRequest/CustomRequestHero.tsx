import Link from "next/link";

const PROCESS_ROWS = [
  {
    title: "의뢰 요청 등록",
    desc: "필요한 내용·예산·희망 일정을 정리해 올려요.",
  },
  {
    title: "멘토 지원",
    desc: "멘토가 의뢰를 보고 제안을 보내요.",
  },
  {
    title: "멘토 선택",
    desc: "제안을 비교하고 한 분을 골라요.",
  },
  {
    title: "상담 & 피드백",
    desc: "선택한 멘토와 코칭·피드백을 이어가요.",
  },
] as const;

export type CustomRequestHeroProps = {
  role?: string | null;
};

export function CustomRequestHero({ role = null }: CustomRequestHeroProps) {
  const isMentor = role === "mentor";

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-sky-50/50 shadow-[0_8px_40px_rgba(15,23,42,0.1)] ring-1 ring-slate-900/[0.04]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-500/[0.07] to-transparent" aria-hidden />
        <div className="relative grid min-h-[min(28rem,calc(100vh-12rem))] grid-cols-1 gap-10 p-8 sm:p-10 lg:min-h-[26rem] lg:grid-cols-2 lg:gap-14 lg:p-12 xl:min-h-[28rem] xl:p-14">
          {/* 좌측 랜딩 */}
          <div className="flex min-w-0 flex-col justify-between gap-10">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-700/90">맞춤의뢰</p>
              <h1 className="mt-3 max-w-[22rem] text-balance text-3xl font-black leading-[1.12] tracking-tight text-slate-900 sm:max-w-xl sm:text-4xl sm:leading-[1.1] lg:text-[2.65rem] lg:leading-[1.08]">
                혼자 해결하기 어려운 공부, <span className="text-blue-600">전문 멘토와 함께</span> 해결해요!
              </h1>
              <p className="mt-5 max-w-xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                학교 공부, 진로 고민, 학습 방법까지 — 요청을 올리고 멘토 제안을 비교한 뒤, 한 분을 골라 이어갈 수 있어요.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {isMentor ? (
                  <>
                    <Link
                      href="/mentor/custom-request/dashboard"
                      className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-center text-sm font-extrabold text-white shadow-md transition hover:bg-blue-700 sm:flex-none sm:min-w-[11rem]"
                    >
                      내 진행 의뢰 보기
                    </Link>
                    <Link
                      href="/mentor/custom-request/posts"
                      className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border-2 border-slate-300/90 bg-white px-6 py-3.5 text-center text-sm font-extrabold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 sm:flex-none sm:min-w-[11rem]"
                    >
                      새 의뢰 목록 보기
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/custom-request/new"
                      className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-center text-sm font-extrabold text-white shadow-md transition hover:bg-blue-700 sm:flex-none sm:min-w-[11rem]"
                    >
                      의뢰 요청 등록하기
                    </Link>
                    <Link
                      href="/custom-request/orders"
                      className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border-2 border-slate-300/90 bg-white px-6 py-3.5 text-center text-sm font-extrabold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 sm:flex-none sm:min-w-[11rem]"
                    >
                      내 진행 의뢰 보기
                    </Link>
                  </>
                )}
                <a
                  href="#categories"
                  className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/80 px-6 py-3.5 text-center text-sm font-extrabold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50/40 sm:flex-none sm:min-w-[11rem]"
                >
                  이용 가이드 보기
                </a>
              </div>
            </div>
            <p className="max-w-xl rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-xs font-medium leading-relaxed text-slate-600 shadow-sm">
              <span className="mr-1.5" aria-hidden>
                🛡️
              </span>
              대필/완성 대행은 제공하지 않습니다. 학습 코칭·피드백 중심으로 도움을 드려요.
            </p>
          </div>

          {/* 우측 진행 프로세스 */}
          <div className="flex min-h-[20rem] flex-col lg:min-h-0">
            <div className="flex h-full flex-1 flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-8">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">진행 프로세스</p>
              <p className="mt-2 text-lg font-black text-slate-900">요청부터 피드백까지</p>
              <div className="mt-6 flex-1">
                <ul className="divide-y divide-slate-100">
                  {PROCESS_ROWS.map((row, i) => (
                    <li key={row.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md ring-4 ring-blue-500/15">
                        {i + 1}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-sm font-extrabold text-slate-900">{row.title}</p>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">{row.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-6 border-t border-slate-100 pt-4 text-xs font-medium leading-relaxed text-slate-500">
                결제·납품은 주문방에서 단계별로 이어집니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
