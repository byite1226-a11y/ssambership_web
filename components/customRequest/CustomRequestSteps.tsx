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
    title: "상담 & 피드백",
    desc: "선택한 멘토와 함께 진행하여 피드백을 받아요.",
    icon: "✔️",
  },
] as const;

export function CustomRequestSteps() {
  return (
    <section className="space-y-6" id="flow-steps">
      <div className="border-b border-slate-200/80 pb-4">
        <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">맞춤의뢰, 이렇게 진행돼요!</h2>
        <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-600">네 단계로 천천히 진행해요.</p>
      </div>

      <div className="hidden lg:flex lg:items-stretch lg:gap-0 select-none">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex min-w-0 flex-1 items-stretch">
            <div className="flex h-full min-h-[228px] w-full flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-blue-100 bg-blue-50 text-sm font-black text-blue-700 shadow-sm ring-2 ring-blue-500/10">
                  {s.num}
                </span>
                <span className="text-2xl leading-none opacity-90" aria-hidden>
                  {s.icon}
                </span>
              </div>
              <p className="mt-5 text-base font-extrabold leading-snug text-slate-900">{s.title}</p>
              <p className="mt-2 flex-1 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">{s.desc}</p>
            </div>
            {i < STEPS.length - 1 ? (
              <div className="flex w-9 shrink-0 items-center justify-center text-slate-300" aria-hidden>
                <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <ol className="relative space-y-0 lg:hidden select-none" aria-label="맞춤의뢰 진행 단계">
        {STEPS.map((s, i) => {
          const isLast = i === STEPS.length - 1;
          return (
            <li key={s.title} className="flex gap-3.5">
              <div className="flex w-10 shrink-0 flex-col items-center pt-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-100 bg-blue-50 text-sm font-black text-blue-700 shadow-sm ring-2 ring-blue-500/10">
                  {s.num}
                </span>
                {!isLast ? <span className="my-1.5 block min-h-[18px] w-0.5 flex-1 rounded-full bg-slate-200" aria-hidden /> : null}
              </div>
              <div className={`min-w-0 flex-1 ${!isLast ? "pb-7" : ""}`}>
                <div className="min-h-[5.5rem] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-extrabold leading-snug text-slate-900">{s.title}</p>
                    <span className="text-xl leading-none opacity-90" aria-hidden>
                      {s.icon}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">{s.desc}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
