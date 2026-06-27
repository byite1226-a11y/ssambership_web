const STEPS = [
  { n: 1, label: "요청 내용 작성" },
  { n: 2, label: "요청 정보 확인" },
  { n: 3, label: "멘토 지원 대기" },
  { n: 4, label: "멘토 선택" },
] as const;

type Props = {
  /** 1~4, 현재 단계 강조 */
  activeStep: 1 | 2 | 3 | 4;
  className?: string;
  id?: string;
};

export function CustomRequestStudentPostFlowStepper(props: Props) {
  const { activeStep, className = "", id } = props;
  return (
    <div
      className={`w-full rounded-2xl border border-slate-200/90 bg-slate-100/50 p-4 shadow-inner sm:p-5 ${className}`}
    >
      <ol
        id={id}
        className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        aria-label="맞춤의뢰 진행 단계"
      >
        {STEPS.map((s) => {
          const done = s.n < activeStep;
          const current = s.n === activeStep;
          return (
            <li
              key={s.n}
              className={`flex min-h-[5.75rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 px-2 py-3 text-center sm:min-h-[6.25rem] sm:px-3 sm:py-4 ${
                current
                  ? "border-transparent bg-[#2563EB] text-white shadow-lg ring-2 ring-[#2563EB]/30"
                  : done
                    ? "border-slate-200/90 bg-white text-slate-800 shadow-sm"
                    : "border-slate-200/70 bg-slate-50 text-slate-500"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black sm:h-10 sm:w-10 sm:text-sm ${
                  current
                    ? "bg-white/20 text-white ring-2 ring-white/30"
                    : done
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {done && !current ? "✓" : s.n}
              </span>
              <span
                className={`max-w-[9rem] text-[11px] font-extrabold leading-tight sm:max-w-none sm:text-xs ${
                  current ? "text-white" : done ? "text-slate-800" : "text-slate-500"
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
