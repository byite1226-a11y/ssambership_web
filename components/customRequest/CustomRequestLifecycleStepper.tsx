const STEPS = [
  { n: 1, label: "등록" },
  { n: 2, label: "비교" },
  { n: 3, label: "선택" },
  { n: 4, label: "진행" },
  { n: 5, label: "완료" },
] as const;

export type CustomRequestLifecycleStep = "register" | "compare" | "select" | "progress" | "complete";

const STEP_INDEX: Record<CustomRequestLifecycleStep, number> = {
  register: 1,
  compare: 2,
  select: 3,
  progress: 4,
  complete: 5,
};

type Props = {
  active: CustomRequestLifecycleStep;
  className?: string;
  id?: string;
};

/** 의뢰 등록 이후 학생 진행단계 — flat 톤(보라 그라데이션 없음) */
export function CustomRequestLifecycleStepper(props: Props) {
  const { active, className = "", id } = props;
  const activeIndex = STEP_INDEX[active];

  return (
    <div className={`form-stepper-lifecycle ${className}`.trim()}>
      <ol id={id} aria-label="맞춤의뢰 진행단계">
        {STEPS.map((s) => {
          const done = s.n < activeIndex;
          const current = s.n === activeIndex;
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
