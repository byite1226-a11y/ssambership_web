export function MentorFilterPanel(props: {
  universityDefault: string;
  subjectDefault: string;
  verificationDefault: string;
}) {
  return (
    <div className="mt-0 grid gap-3">
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
  );
}
