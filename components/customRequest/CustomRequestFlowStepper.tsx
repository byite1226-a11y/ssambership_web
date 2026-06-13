const STEPS = [
  { n: 1, label: "카테고리" },
  { n: 2, label: "의뢰 내용" },
  { n: 3, label: "조건 설정" },
  { n: 4, label: "확인" },
] as const;

type Props = {
  /** 1~4, 현재 단계 강조 */
  activeStep: 1 | 2 | 3 | 4;
  className?: string;
  id?: string;
  /** flat: 랜딩 톤 절제형 (`.cr-landing` 하위) */
  variant?: "default" | "flat";
};

export function CustomRequestFlowStepper(props: Props) {
  const { activeStep, className = "", id, variant = "default" } = props;

  if (variant === "flat") {
    return (
      <div className={`form-stepper ${className}`.trim()}>
        <ol id={id} aria-label="맞춤의뢰 진행 단계">
          {STEPS.map((s) => {
            const done = s.n < activeStep;
            const current = s.n === activeStep;
            const state = current ? "is-current" : done ? "is-done" : "";
            return (
              <li key={s.n} className={`step-item ${state}`.trim()}>
                <span className="step-dot">{done && !current ? "✓" : s.n}</span>
                <span className="step-label">{s.label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-2xl border border-slate-200/90 bg-slate-100/50 p-4 shadow-inner sm:p-5 ${className}`}>
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
                  ? "border-transparent bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg ring-2 ring-blue-400/40"
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
