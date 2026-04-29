const STEPS = [
  { n: 1, label: "의뢰 요청 등록" },
  { n: 2, label: "멘토 지원" },
  { n: 3, label: "멘토 선택" },
  { n: 4, label: "상담 & 피드백" },
] as const;

type Props = {
  /** 1~4, 현재 단계 강조 */
  activeStep: 1 | 2 | 3 | 4;
  className?: string;
  id?: string;
};

export function CustomRequestFlowStepper(props: Props) {
  const { activeStep, className = "", id } = props;
  return (
    <ol
      id={id}
      className={`grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 ${className}`}
      aria-label="맞춤의뢰 진행 단계"
    >
      {STEPS.map((s) => {
        const done = s.n < activeStep;
        const current = s.n === activeStep;
        return (
          <li
            key={s.n}
            className={`relative flex flex-col rounded-2xl border px-2.5 py-2.5 text-center sm:px-3 sm:py-3 ${
              current
                ? "border-indigo-300 bg-indigo-50/90 shadow-sm ring-1 ring-indigo-200"
                : done
                  ? "border-slate-200 bg-white"
                  : "border-slate-100 bg-slate-50/80 text-slate-500"
            }`}
          >
            <span
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-black sm:h-8 sm:w-8 ${
                current
                  ? "bg-indigo-600 text-white"
                  : done
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-600"
              }`}
            >
              {done ? "✓" : s.n}
            </span>
            <span
              className={`mt-1.5 break-words text-[11px] font-extrabold leading-tight sm:text-xs ${
                current ? "text-indigo-950" : done ? "text-slate-800" : "text-slate-500"
              }`}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
