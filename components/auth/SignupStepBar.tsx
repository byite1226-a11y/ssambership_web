import { Fragment } from "react";

type SignupStepBarProps = {
  current: 1 | 2 | 3;
};

const steps: { n: 1 | 2 | 3; label: string }[] = [
  { n: 1, label: "1. 역할 선택" },
  { n: 2, label: "2. 정보 입력" },
  { n: 3, label: "3. 가입 완료" },
];

const lineDone = "bg-sky-300/80";
const linePending = "bg-slate-200/90";

export function SignupStepBar({ current }: SignupStepBarProps) {
  return (
    <div className="w-full" aria-label="가입 단계">
      <ol className="mx-auto flex w-full max-w-none items-stretch justify-between gap-1.5 px-0 sm:gap-3 md:gap-4">
        {steps.map((s, i) => {
          const here = s.n === current;
          const done = s.n < current;
          return (
            <Fragment key={s.n}>
              {i > 0 ? (
                <li className="flex min-w-0 flex-1 items-center self-center px-0.5" aria-hidden>
                  <div
                    className={`h-1.5 w-full rounded-full ${current > i ? lineDone : linePending}`}
                  />
                </li>
              ) : null}
              <li className="flex min-w-0 max-w-[30%] flex-col items-center sm:max-w-none sm:flex-1">
                <div className="flex w-full max-w-[10rem] flex-col items-center text-center sm:max-w-[12rem] md:max-w-[14rem]">
                  <span
                    className={[
                      "flex h-11 w-11 items-center justify-center text-base font-bold transition sm:h-[3.4rem] sm:w-[3.4rem] sm:text-lg md:h-[3.85rem] md:w-[3.85rem] md:text-xl",
                      here
                        ? "rounded-full bg-blue-600 text-white shadow-sm"
                        : "",
                      done && !here
                        ? "rounded-full bg-blue-500 text-white shadow-sm"
                        : "",
                      !here && !done
                        ? "rounded-full border-2 border-slate-200 bg-white text-slate-300 shadow-sm"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {done ? "✓" : s.n}
                  </span>
                  <span
                    className={[
                      "mt-3 w-full break-words text-center text-sm font-bold leading-tight sm:text-base md:text-[1.05rem]",
                      here ? "text-slate-900" : done ? "text-slate-700" : "text-slate-400",
                    ].join(" ")}
                  >
                    {s.label}
                  </span>
                </div>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
