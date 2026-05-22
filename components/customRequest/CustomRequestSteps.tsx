import { ChevronRight } from "lucide-react";

const STEPS = [
  {
    num: "1",
    title: "의뢰 요청 등록",
    desc: "도움이 필요한 내용을 자세히 작성하고 예산과 희망 완료일을 설정해요.",
    icon: "📝",
  },
  {
    num: "2",
    title: "멘토 지원",
    desc: "적합한 멘토들이 의뢰 내용을 보고 지원서를 제출해요.",
    icon: "👥",
  },
  {
    num: "3",
    title: "멘토 선택",
    desc: "지원서를 비교하고 후기를 참고하여 원하는 멘토를 선택해요.",
    icon: "⭐",
  },
  {
    num: "4",
    title: "납품 확인",
    desc: "납품 파일을 확인하고 완료하면 의뢰가 마무리돼요.",
    icon: "✔️",
  },
] as const;

export function CustomRequestSteps() {
  return (
    <section className="w-full scroll-mt-24" id="flow-steps">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
        <header className="border-b border-slate-200/90 pb-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-violet-700/90">진행 방식</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">맞춤의뢰, 이렇게 진행돼요!</h2>
          <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-slate-600">네 단계로 안내에 따라 진행해요.</p>
        </header>

        {/* Desktop: 동일 폭·높이 카드 + chevron */}
        <div className="mt-8 hidden lg:flex lg:items-stretch lg:justify-between lg:gap-0 select-none">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex min-w-0 flex-1 items-stretch">
              <article className="flex h-full min-h-[200px] w-full flex-col rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/60 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-violet-200 bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white shadow-md">
                    {s.num}
                  </span>
                  <span className="text-2xl leading-none opacity-90" aria-hidden>
                    {s.icon}
                  </span>
                </div>
                <p className="mt-4 text-base font-extrabold leading-snug text-slate-900">{s.title}</p>
                <p className="mt-1 flex-1 text-xs font-medium leading-relaxed text-slate-600">{s.desc}</p>
              </article>
              {i < STEPS.length - 1 ? (
                <div className="flex w-10 shrink-0 items-center justify-center text-slate-300" aria-hidden>
                  <ChevronRight className="h-6 w-6" strokeWidth={2} />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* Mobile: 세로 타임라인 */}
        <ol className="mt-8 space-y-0 lg:hidden select-none" aria-label="맞춤의뢰 진행 단계">
          {STEPS.map((s, i) => {
            const isLast = i === STEPS.length - 1;
            return (
              <li key={s.title} className="flex gap-4">
                <div className="flex w-11 shrink-0 flex-col items-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-violet-200 bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white shadow-md">
                    {s.num}
                  </span>
                  {!isLast ? <span className="my-1 min-h-[28px] w-0.5 flex-1 rounded-full bg-slate-200" aria-hidden /> : null}
                </div>
                <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-8"}`}>
                  <article className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-extrabold text-slate-900">{s.title}</p>
                      <span className="text-xl" aria-hidden>
                        {s.icon}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{s.desc}</p>
                  </article>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
