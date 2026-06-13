import type { ChangeEvent, ReactNode } from "react";

export type StudentSignupFormValues = {
  fullName: string;
  nickname: string;
  /** 시안의「학교」· DB·메타 `grade_level` */
  gradeLevel: string;
  studentStatus: string;
  birthDate: string;
};

type StudentSignupFormProps = {
  value: StudentSignupFormValues;
  onChange: (v: StudentSignupFormValues) => void;
  disabled?: boolean;
  fieldErrors?: Partial<Record<"nickname" | "gradeLevel", string>>;
};

const input =
  "mt-2.5 w-full min-h-[3.4rem] rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 " +
  "focus:border-sky-500 focus:ring-2 focus:ring-sky-200/55 sm:min-h-[3.5rem] sm:rounded-3xl sm:px-5 sm:py-4 sm:text-lg md:text-[1.05rem]";

const label = "mb-0 block text-sm font-bold text-slate-800 sm:text-[0.95rem] md:text-base";

const hint = "mt-1.5 text-sm leading-relaxed text-slate-500 sm:mt-2 sm:text-base";

const sectionClass =
  "rounded-2xl border border-sky-200/30 bg-sky-50/25 px-4 py-4 sm:rounded-3xl sm:px-5 sm:py-5 md:px-6";

function patch(
  v: StudentSignupFormValues,
  p: Partial<StudentSignupFormValues>
): StudentSignupFormValues {
  return { ...v, ...p };
}

function SectionHeader({ n, id, children }: { n: string; id: string; children: ReactNode }) {
  return (
    <div className="mb-4 border-b border-sky-200/30 pb-3 sm:mb-5 sm:pb-3.5">
      <p className="text-xs font-extrabold tracking-wide text-sky-800/90 sm:text-sm">{n}</p>
      <h3 id={id} className="mt-0.5 text-base font-extrabold text-slate-900 sm:text-lg md:text-[1.15rem]">
        {children}
      </h3>
    </div>
  );
}

export function StudentSignupForm({ value, onChange, disabled, fieldErrors }: StudentSignupFormProps) {
  function h<K extends keyof StudentSignupFormValues>(k: K, ev: ChangeEvent<HTMLInputElement>) {
    onChange(patch(value, { [k]: ev.target.value } as Pick<StudentSignupFormValues, K>));
  }

  return (
    <div className="space-y-6 sm:space-y-7 md:space-y-8">
      <section className={sectionClass} aria-labelledby="st-profile-heading">
        <SectionHeader n="프로필" id="st-profile-heading">
          닉네임 &amp; 학교
        </SectionHeader>
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="st-nick" className={label}>
              닉네임 <span className="text-red-500">*</span>
            </label>
            <input
              id="st-nick"
              className={input}
              value={value.nickname}
              onChange={(e) => h("nickname", e)}
              disabled={disabled}
              autoComplete="nickname"
              placeholder="서비스에 표시될 호칭"
              aria-invalid={!!fieldErrors?.nickname}
            />
            {fieldErrors?.nickname ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {fieldErrors.nickname}
              </p>
            ) : (
              <p className={hint}>멘토·학생에게 노출되는 이름이에요.</p>
            )}
          </div>
          <div>
            <label htmlFor="st-school" className={label}>
              소속학교 <span className="font-normal text-slate-500">(선택)</span>
            </label>
            <input
              id="st-school"
              className={input}
              value={value.gradeLevel}
              onChange={(e) => h("gradeLevel", e)}
              disabled={disabled}
              placeholder="재학·출신 고등학교"
            />
            <p className={hint}>학생 프로필과 탐색 카드에 반영됩니다.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
