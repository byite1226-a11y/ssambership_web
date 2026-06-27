import type { ChangeEvent, ReactNode } from "react";
import { UploadCloud } from "lucide-react";
import { MentorSubjectCheckboxes } from "@/components/subjects/MentorSubjectCheckboxes";
import { subjectCodesFromText } from "@/lib/subjects/subjectCatalog";

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
  fieldErrors?: Partial<
    Record<
      "nickname" | "universityName" | "departmentName" | "teachingSubjectsCsv" | "highSchoolName" | "studentIdFile",
      string
    >
  >;
};

const input =
  "mt-2 w-full min-h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 " +
  "focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 sm:min-h-[3.1rem] sm:px-5";

const label = "mb-0 block text-sm font-bold text-slate-800 sm:text-base";
const hint = "mt-1.5 text-sm leading-relaxed text-slate-500";
const fieldSection = "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";

function patch(
  v: MentorSignupFormValues,
  p: Partial<MentorSignupFormValues>
): MentorSignupFormValues {
  return { ...v, ...p };
}

function SectionHeader({ n, id, children }: { n: string; id: string; children: ReactNode }) {
  return (
    <header className="mb-4 border-b border-slate-100 pb-3">
      <p className="text-xs font-extrabold tracking-wide text-[#059669]">{n}</p>
      <h3 id={id} className="mt-0.5 text-base font-extrabold text-slate-900 sm:text-lg">
        {children}
      </h3>
    </header>
  );
}

export function MentorSignupForm({ value, onChange, disabled, fieldErrors }: MentorSignupFormProps) {
  function hText<K extends keyof MentorSignupFormValues>(k: K, ev: ChangeEvent<HTMLInputElement>) {
    if (k === "studentIdFile") {
      return;
    }
    onChange(patch(value, { [k]: ev.target.value } as Pick<MentorSignupFormValues, K>));
  }

  // 담당과목: 정본 code 선택 → csv 직렬화(기존 가입 경로의 teaching_subjects_csv 호환).
  const subjectCodes = subjectCodesFromText(value.teachingSubjectsCsv);
  function toggleSubjectCode(code: string) {
    const next = new Set(subjectCodes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(patch(value, { teachingSubjectsCsv: [...next].join(",") }));
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <p className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium leading-relaxed text-slate-700 sm:px-5">
        멘토는 <strong className="text-emerald-900">대학(재) 인증</strong>이 이어집니다. 제출·보관·삭제는
        쌤버십·약관·정책 및 서버·파일 저장소 보안 설정에 따릅니다.
      </p>

      <section className={fieldSection} aria-labelledby="m-sec-nick">
        <SectionHeader n="1 · 기본" id="m-sec-nick">
          표시 이름
        </SectionHeader>
        <div>
          <label htmlFor="m-nick" className={label}>
            닉네임 <span className="text-red-500">*</span>
          </label>
          <input
            id="m-nick"
            className={input}
            value={value.nickname}
            onChange={(e) => hText("nickname", e)}
            disabled={disabled}
            autoComplete="nickname"
            placeholder="멘티가 보는 이름"
            aria-invalid={!!fieldErrors?.nickname}
          />
          {fieldErrors?.nickname ? (
            <p className="mt-1.5 text-sm text-red-600" role="alert">
              {fieldErrors.nickname}
            </p>
          ) : null}
        </div>
        <div className="mt-5">
          <label htmlFor="m-intro" className={label}>
            소개 한 줄 <span className="font-normal text-slate-500">(선택)</span>
          </label>
          <input
            id="m-intro"
            className={input}
            value={value.introLine}
            onChange={(e) => hText("introLine", e)}
            disabled={disabled}
            placeholder="예: 수학 개념을 차근차근 잡아드려요"
          />
          <p className={hint}>멘토 카드와 프로필에서 첫인상을 만드는 짧은 문장이에요.</p>
        </div>
      </section>

      <section className={fieldSection} aria-labelledby="m-sec-scholastic">
        <SectionHeader n="2 · 학력" id="m-sec-scholastic">
          대학·고교 정보
        </SectionHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 md:gap-5">
          <div>
            <label htmlFor="m-uni" className={label}>
              대학교 <span className="text-red-500">*</span>
            </label>
            <input
              id="m-uni"
              className={input}
              value={value.universityName}
              onChange={(e) => hText("universityName", e)}
              disabled={disabled}
              placeholder="캠퍼스·분교"
              aria-invalid={!!fieldErrors?.universityName}
            />
            {fieldErrors?.universityName ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {fieldErrors.universityName}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="m-dept" className={label}>
              학과 <span className="text-red-500">*</span>
            </label>
            <input
              id="m-dept"
              className={input}
              value={value.departmentName}
              onChange={(e) => hText("departmentName", e)}
              disabled={disabled}
              placeholder="단과·전공"
              aria-invalid={!!fieldErrors?.departmentName}
            />
            {fieldErrors?.departmentName ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {fieldErrors.departmentName}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-5 sm:mt-6">
          <label htmlFor="m-hs" className={label}>
            출신고교 <span className="text-red-500">*</span>
          </label>
          <input
            id="m-hs"
            className={input}
            value={value.highSchoolName}
            onChange={(e) => hText("highSchoolName", e)}
            disabled={disabled}
            placeholder="가입·프로필에 반영"
            aria-invalid={!!fieldErrors?.highSchoolName}
          />
          {fieldErrors?.highSchoolName ? (
            <p className="mt-1.5 text-sm text-red-600" role="alert">
              {fieldErrors.highSchoolName}
            </p>
          ) : null}
        </div>
      </section>

      <section className={fieldSection} aria-labelledby="m-sec-expertise">
        <SectionHeader n="3 · 전문 분야" id="m-sec-expertise">
          전공 과목
        </SectionHeader>
        <div>
          <label className={label}>
            담당 과목 <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <MentorSubjectCheckboxes selected={subjectCodes} onToggle={toggleSubjectCode} disabled={disabled} />
          </div>
          {fieldErrors?.teachingSubjectsCsv ? (
            <p className="mt-1.5 text-sm text-red-600" role="alert">
              {fieldErrors.teachingSubjectsCsv}
            </p>
          ) : (
            <p className={hint}>가르치는 과목을 모두 선택하세요. 대분류를 펼쳐 세부 과목을 고를 수 있어요.</p>
          )}
        </div>
      </section>

      <section
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-0"
        aria-labelledby="m-sec-id"
      >
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <p className="text-xs font-extrabold tracking-wide text-[#059669]">4 · 인증</p>
          <h3 id="m-sec-id" className="mt-0.5 text-base font-extrabold text-slate-900 sm:text-lg">
            학생증 / 재학증명서
          </h3>
          <p className="mt-1.5 text-sm text-slate-500">멘티 신뢰·운영 심사에 쓰는 제출 항목이에요.</p>
        </div>
        <div className="p-5 sm:p-6">
          <span className={label} id="m-student-id-label">
            학생증 업로드 <span className="text-red-500">*</span>
          </span>
          <p className="mb-3 mt-1.5 text-sm text-slate-500 sm:mb-4 sm:text-base">
            JPG, PNG, PDF — 정면이 선명하도록, 글씨가 읽혀요.
          </p>
          <label
            htmlFor="m-student-id"
            className="group relative flex min-h-[13rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-5 py-8 text-center transition focus-within:border-[#059669] focus-within:ring-2 focus-within:ring-[#059669]/20 hover:border-[#059669]"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-[#059669]"
              aria-hidden
            >
              <UploadCloud className="h-6 w-6" />
            </span>
            <span className="text-base font-extrabold text-slate-900 sm:text-lg">
              클릭해 파일을 선택
            </span>
            <span className="text-sm text-slate-500">PC·휴대폰에 저장된 파일을 고르면 돼요</span>
            <span className="max-w-xl px-1 text-sm text-slate-600">
              {value.studentIdFile ? (
                <span className="font-semibold text-emerald-900">선택됨: {value.studentIdFile.name}</span>
              ) : (
                "인증·심사 목적으로만 쓰며, 운영·보관 기간은 정책을 따릅니다."
              )}
            </span>
            <input
              id="m-student-id"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                onChange(patch(value, { studentIdFile: f }));
              }}
              disabled={disabled}
              aria-labelledby="m-student-id-label"
            />
          </label>
          {fieldErrors?.studentIdFile ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {fieldErrors.studentIdFile}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
