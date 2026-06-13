import { cn } from "@/lib/utils/cn";
import type { DsProgressStep } from "@/lib/design-system/progressTimeline";

export type ProgressTimelineProps = {
  steps: readonly DsProgressStep[];
  /** 0-based 현재 단계 인덱스 */
  currentIndex: number;
  orientation?: "horizontal" | "vertical";
  className?: string;
};

function stepState(index: number, currentIndex: number): "done" | "current" | "upcoming" {
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "current";
  return "upcoming";
}

/**
 * 맞춤의뢰 단계 타임라인 — 완료/현재/예정 대비 뚜렷.
 * horizontal: 목록 카드 · vertical: 작업방 우측.
 */
export function ProgressTimeline(props: ProgressTimelineProps) {
  const { steps, currentIndex, orientation = "horizontal", className } = props;

  if (orientation === "vertical") {
    return (
      <ol className={cn("relative flex flex-col gap-0 pl-0.5", className)} aria-label="진행 단계">
        {steps.map((step, index) => {
          const state = stepState(index, currentIndex);
          const isLast = index === steps.length - 1;
          return (
            <li key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepNode index={index} state={state} />
                {!isLast ? (
                  <div
                    className={cn(
                      "my-1 w-0.5 flex-1 min-h-[1.25rem] rounded-full",
                      state === "done" ? "bg-ds-accent-mentor" : "bg-ds-border-subtle",
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className={cn("pb-4", isLast && "pb-0")}>
                <p
                  className={cn(
                    "text-ds-label font-bold leading-snug",
                    state === "current" && "text-ds-accent-mentor",
                    state === "done" && "text-ds-primary",
                    state === "upcoming" && "text-ds-tertiary font-semibold",
                  )}
                >
                  {step.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol
      className={cn("flex w-full items-start gap-0", className)}
      aria-label="진행 단계"
    >
      {steps.map((step, index) => {
        const state = stepState(index, currentIndex);
        const isLast = index === steps.length - 1;
        return (
          <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {index > 0 ? (
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    index <= currentIndex ? "bg-ds-accent-mentor" : "bg-ds-border-subtle",
                  )}
                  aria-hidden
                />
              ) : (
                <span className="flex-1" aria-hidden />
              )}
              <StepNode index={index} state={state} />
              {!isLast ? (
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    index < currentIndex ? "bg-ds-accent-mentor" : "bg-ds-border-subtle",
                  )}
                  aria-hidden
                />
              ) : (
                <span className="flex-1" aria-hidden />
              )}
            </div>
            <p
              className={cn(
                "mt-2 max-w-[4.5rem] text-center text-[10px] font-semibold leading-tight",
                state === "current" && "font-bold text-ds-accent-mentor",
                state === "done" && "text-ds-secondary",
                state === "upcoming" && "text-ds-tertiary",
              )}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function StepNode(props: { index: number; state: "done" | "current" | "upcoming" }) {
  const { index, state } = props;

  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold",
        state === "done" && "border-ds-accent-mentor bg-ds-accent-mentor text-white",
        state === "current" &&
          "border-ds-accent-mentor bg-ds-surface text-ds-accent-mentor ring-4 ring-ds-accent-mentor-muted",
        state === "upcoming" && "border-ds-border-subtle bg-ds-surface text-ds-tertiary",
      )}
      aria-current={state === "current" ? "step" : undefined}
    >
      {state === "done" ? "✓" : index + 1}
    </span>
  );
}
