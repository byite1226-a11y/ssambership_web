import type { ChangeEvent, ReactNode } from "react";

export type MentorSignupFormValues = {
  nickname: string;
  universityName: string;
  departmentName: string;
  teachingSubjectsCsv: string;
  highSchoolName: string;
  introLine: string;
  studentIdFile: File | null;
};

type MentorSignupFormProps = {
  value: MentorSignupFormValues;
  onChange: (v: MentorSignupFormValues) => void;
  disabled?: boolean;
};

const input =
  "mt-2.5 w-full min-h-[3.4rem] rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 " +
  "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/55 sm:min-h-[3.5rem] sm:rounded-3xl sm:px-5 sm:py-4 sm:text-lg md:text-[1.05rem]";

const label = "mb-0 block text-sm font-bold text-slate-800 sm:text-[0.95rem] md:text-base";
const hint = "mt-1.5 text-sm leading-relaxed text-slate-500 sm:mt-2 sm:text-base";
const fieldSection = "rounded-2xl border border-emerald-200/25 bg-white/70 px-4 py-4 sm:rounded-3xl sm:px-5 sm:py-5 md:px-6";
const sectionHeaderBar = "mb-3 h-0.5 w-10 rounded-full bg-emerald-500/80 sm:mb-3.5 sm:w-12";

function patch(
  v: MentorSignupFormValues,
  p: Partial<MentorSignupFormValues>
): MentorSignupFormValues {
  return { ...v, ...p };
}

function SectionHeader({ n, id, children }: { n: string; id: string; children: ReactNode }) {
  return (
    <header className="mb-4 sm:mb-5">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-800/80 sm:text-xs">{n}</p>
      <div className={sectionHeaderBar} aria-hidden />
      <h3 id={id} className="mt-2 text-base font-extrabold text-slate-900 sm:text-lg md:text-[1.2rem]">
        {children}
      </h3>
    </header>
  );
}

function UploadIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M12 4.5V15.5M12 4.5L8.5 8M12 4.5L15.5 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 14.5v3.2c0 1.3 1.1 2.3 2.4 2.3h8.2c1.3 0 2.4-1 2.4-2.3v-3.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MentorSignupForm({ value, onChange, disabled }: MentorSignupFormProps) {
  function hText<K extends keyof MentorSignupFormValues>(k: K, ev: ChangeEvent<HTMLInputElement>) {
    if (k === "studentIdFile") {
      return;
    }
    onChange(patch(value, { [k]: ev.target.value } as Pick<MentorSignupFormValues, K>));
  }

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-7">
      <p className="rounded-2xl border border-emerald-200/50 bg-gradient-to-r from-emerald-50/90 to-sky-50/30 px-4 py-4 text-sm font-medium leading-relaxed text-slate-800 shadow-sm sm:rounded-3xl sm:px-6 sm:py-5 sm:text-base md:text-lg">
        멘토는 <strong className="text-emerald-900">대학(재) 인증</strong>이 이어집니다. 제출·보관·삭제는
        쌤버십·약관·정책 및 서버·파일 저장소 보안 설정에 따릅니다.
      </p>

      <section className={fieldSection} aria-labelledby="m-sec-nick">
        <SectionHeader n="1 · 기본" id="m-sec-nick">
          표시 이름
        </SectionHeader>
        <div>
          <label htmlFor="m-nick" className={label}>
            닉네임
          </label>
          <input
            id="m-nick"
            className={input}
            value={value.nickname}
            onChange={(e) => hText("nickname", e)}
            disabled={disabled}
            autoComplete="nickname"
            placeholder="멘티가 보는 이름"
          />
        </div>
      </section>

      <section className={fieldSection} aria-labelledby="m-sec-scholastic">
        <SectionHeader n="2 · 학력" id="m-sec-scholastic">
          대학·고교 정보
        </SectionHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 md:gap-5">
          <div>
            <label htmlFor="m-uni" className={label}>
              대학교
            </label>
            <input
              id="m-uni"
              className={input}
              value={value.universityName}
              onChange={(e) => hText("universityName", e)}
              disabled={disabled}
              placeholder="캠퍼스·분교"
            />
          </div>
          <div>
            <label htmlFor="m-dept" className={label}>
              학과
            </label>
            <input
              id="m-dept"
              className={input}
              value={value.departmentName}
              onChange={(e) => hText("departmentName", e)}
              disabled={disabled}
              placeholder="단과·전공"
            />
          </div>
        </div>
        <div className="mt-5 sm:mt-6">
          <label htmlFor="m-hs" className={label}>
            출신 고등학교
          </label>
          <input
            id="m-hs"
            className={input}
            value={value.highSchoolName}
            onChange={(e) => hText("highSchoolName", e)}
            disabled={disabled}
            placeholder="가입·프로필에 반영"
          />
        </div>
      </section>

      <section className={fieldSection} aria-labelledby="m-sec-expertise">
        <SectionHeader n="3 · 전문 분야" id="m-sec-expertise">
          전공 과목
        </SectionHeader>
        <div>
          <label htmlFor="m-sub" className={label}>
            응답·노출에 쓰는 과목(쉼표 구분)
          </label>
          <input
            id="m-sub"
            className={input}
            value={value.teachingSubjectsCsv}
            onChange={(e) => hText("teachingSubjectsCsv", e)}
            disabled={disabled}
            placeholder="쉼표로 구분 (예: 수학, 국어, 수능)"
          />
          <p className={hint}>답변이 기대되는 과목(분야)을 적어 주세요. 띄어쓰기는 그대로 반영돼요.</p>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-2xl border-2 border-emerald-200/50 bg-gradient-to-b from-white via-emerald-50/40 to-emerald-50/70 p-0 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-8px_rgba(16,185,129,0.18)] sm:rounded-3xl"
        aria-labelledby="m-sec-id"
      >
        <div className="border-b border-emerald-200/50 bg-white/50 px-4 py-3.5 sm:px-6 sm:py-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-900/80 sm:text-xs">4 · 인증</p>
          <h3 id="m-sec-id" className="mt-1.5 text-lg font-extrabold text-slate-900 sm:text-xl md:text-2xl">
            학생증 / 재학증명서
          </h3>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">멘티 신뢰·운영 심사에 쓰는 제출 항목이에요.</p>
        </div>
        <div className="p-4 sm:p-5 md:px-6 md:py-5">
          <span className={label} id="m-student-id-label">
            파일 첨부
          </span>
          <p className="mb-3 mt-1.5 text-sm text-slate-500 sm:mb-4 sm:text-base">
            JPG, PNG, PDF — 정면이 선명하도록, 글씨가 읽혀요.
          </p>
          <label
            htmlFor="m-student-id"
            className="group relative flex min-h-[14rem] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-emerald-400/70 bg-gradient-to-b from-white/95 to-emerald-100/30 px-5 py-8 text-center shadow-inner ring-emerald-200/0 transition focus-within:ring-2 focus-within:ring-emerald-400/40 focus-within:ring-offset-2 focus-within:ring-offset-white hover:border-emerald-500/80 sm:min-h-[16.5rem] sm:gap-2.5 sm:rounded-3xl sm:px-8 sm:py-10 md:min-h-[18rem] lg:min-h-[19rem]"
          >
            <span
              className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
              style={{
                background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.12), transparent 55%)",
              }}
              aria-hidden
            />
            <span
              className="relative z-[1] flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200/80 bg-emerald-100 text-emerald-800 shadow-md sm:h-[4.5rem] sm:w-[4.5rem]"
              aria-hidden
            >
              <UploadIcon className="h-8 w-8" />
            </span>
            <span className="relative z-[1] text-base font-extrabold text-slate-900 sm:text-lg md:text-xl">
              클릭해 파일을 선택
            </span>
            <span className="relative z-[1] text-sm text-slate-500 sm:text-base">PC·휴대폰에 저장된 파일을 고르면 돼요</span>
            <span className="relative z-[1] max-w-xl px-1 text-sm text-slate-600 sm:px-2 sm:text-base md:leading-relaxed">
              {value.studentIdFile ? (
                <span className="font-semibold text-emerald-900">선택됨: {value.studentIdFile.name}</span>
              ) : (
                "인증·심사 목적으로만 쓰며, 운영·보관 기간은 정책을 따릅니다."
              )}
            </span>
            <input
              id="m-student-id"
              type="file"
              accept="image/*,.pdf"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                onChange(patch(value, { studentIdFile: f }));
              }}
              disabled={disabled}
              aria-labelledby="m-student-id-label"
            />
          </label>
        </div>
      </section>

      <section className={fieldSection} aria-labelledby="m-sec-intro">
        <SectionHeader n="5 · 한 줄 소개" id="m-sec-intro">
          멘토 소개
        </SectionHeader>
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="m-intro" className={label}>
              멘티에게 보이는 첫 문장
            </label>
            <span className="text-sm tabular-nums text-slate-500 sm:text-base">
              {value.introLine.length} / 200
            </span>
          </div>
          <input
            id="m-intro"
            type="text"
            className={input}
            value={value.introLine}
            onChange={(e) => onChange(patch(value, { introLine: e.target.value }))}
            disabled={disabled}
            maxLength={200}
            placeholder="멘티가 첫 화면에서 읽는 한 문장 (정책·금칙어는 운영 기준에 따릅니다)"
          />
        </div>
      </section>
    </div>
  );
}
