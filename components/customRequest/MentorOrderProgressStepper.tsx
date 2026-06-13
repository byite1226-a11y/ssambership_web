type Props = {
  steps: readonly string[];
  activeIndex: number;
  className?: string;
};

export function MentorOrderProgressStepper(props: Props) {
  const { steps, activeIndex, className = "" } = props;
  return (
    <ol className={`space-y-0 ${className}`} aria-label="주문 진행 단계">
      {steps.map((label, index) => {
        const done = index < activeIndex;
        const current = index === activeIndex;
        return (
          <li key={label} className="relative flex gap-3 pb-6 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                className={`absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5 ${done ? "bg-[#1A56DB]" : "bg-slate-200"}`}
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                current
                  ? "bg-[#1A56DB] text-white ring-4 ring-[#1A56DB]/20"
                  : done
                    ? "bg-emerald-500 text-white"
                    : "border-2 border-slate-200 bg-white text-slate-400"
              }`}
            >
              {done && !current ? "✓" : index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={`text-sm font-extrabold ${current ? "text-[#1A56DB]" : done ? "text-slate-800" : "text-slate-500"}`}
              >
                {label}
              </p>
              {current ? <p className="mt-0.5 text-[11px] font-semibold text-[#1A56DB]">현재 단계</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
