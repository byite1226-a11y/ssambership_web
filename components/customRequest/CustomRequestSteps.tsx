const STEPS = [
  {
    num: "1",
    title: "의뢰 요청 등록",
    desc: "도움이 필요한 내용을 자세히 작성하고 예산과 희망 완료일을 설정해요.",
    icon: "📝"
  },
  {
    num: "2",
    title: "멘토 지원",
    desc: "적합한 멘토들이 의뢰 내용을 보고 지원서를 제출해요.",
    icon: "👥"
  },
  {
    num: "3",
    title: "멘토 선택",
    desc: "지원서를 비교하고 후기를 참고하여 원하는 멘토를 선택해요.",
    icon: "⭐"
  },
  {
    num: "4",
    title: "상담 & 피드백",
    desc: "선택한 멘토와 함께 진행하여 피드백을 받아요.",
    icon: "✔️"
  },
] as const;

export function CustomRequestSteps() {
  return (
    <section className="space-y-4" id="flow-steps">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        맞춤의뢰, 이렇게 진행돼요!
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 select-none">
        {STEPS.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3 transition hover:border-slate-300 relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-600 border border-blue-100">
                  {s.num}
                </span>
                <span className="text-xl opacity-80">{s.icon}</span>
              </div>
              <p className="mt-3.5 text-base font-extrabold text-slate-900">{s.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 font-medium break-words">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
