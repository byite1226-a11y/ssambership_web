export function MentorFilterPanel(props: {
  universityDefault: string;
  subjectDefault: string;
  verificationDefault: string;
}) {
  return (
    <div className="mt-0 grid gap-2.5">
        <label className="text-xs font-extrabold text-slate-700">
          대학교(부분 일치)
          <input
            name="university"
            defaultValue={props.universityDefault}
            className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-extrabold text-slate-700">
          과목(부분 일치)
          <input
            name="subject"
            defaultValue={props.subjectDefault}
            className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </label>
    </div>
  );
}
