export function MentorFilterPanel(props: {
  universityDefault: string;
  subjectDefault: string;
  verificationDefault: string;
}) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-extrabold text-slate-900">필터 패널</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-extrabold text-slate-700">
          대학교(부분 일치)
          <input
            name="university"
            defaultValue={props.universityDefault}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-extrabold text-slate-700">
          과목(부분 일치)
          <input
            name="subject"
            defaultValue={props.subjectDefault}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-extrabold text-slate-700">
          인증 상태(부분 일치)
          <input
            name="verification"
            defaultValue={props.verificationDefault}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            placeholder="verified, pending…"
          />
        </label>
      </div>
    </details>
  );
}
