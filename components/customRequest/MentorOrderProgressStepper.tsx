type Props = {
  steps: readonly string[];
  activeIndex: number;
  className?: string;
  /** 강조색 — 멘토 화면은 "green"(#059669). 기본 "blue"(#2563EB)는 기존 동작 유지(다른 사용처 불변). */
  accent?: "blue" | "green";
};

export function MentorOrderProgressStepper(props: Props) {
  const { steps, activeIndex, className = "", accent = "blue" } = props;
  const accentBg = accent === "green" ? "bg-[#059669]" : "bg-[#2563EB]";
  const accentRing = accent === "green" ? "ring-[#059669]/20" : "ring-[#2563EB]/20";
  const accentText = accent === "green" ? "text-[#059669]" : "text-[#2563EB]";
  return (
    <ol className={`space-y-0 ${className}`} aria-label="주문 진행 단계">
      {steps.map((label, index) => {
        const done = index < activeIndex;
        const current = index === activeIndex;
        return (
          <li key={label} className="relative flex gap-3 pb-6 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                className={`absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5 ${done ? accentBg : "bg-slate-200"}`}
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                current
                  ? `${accentBg} text-white ring-4 ${accentRing}`
                  : done
                    ? "bg-emerald-500 text-white"
                    : "border-2 border-slate-200 bg-white text-slate-400"
              }`}
            >
              {done && !current ? "✓" : index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={`text-sm font-extrabold ${current ? accentText : done ? "text-slate-800" : "text-slate-500"}`}
              >
                {label}
              </p>
              {current ? <p className={`mt-0.5 text-[11px] font-semibold ${accentText}`}>현재 단계</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
