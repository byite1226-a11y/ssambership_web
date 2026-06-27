import type { MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { mentorSubjectChips } from "@/lib/mentor/mentorPublicProfileDisplay";

function mentoringSubjectChips(display: MentorProfileDisplay): string[] {
  const merged = [display.subjects, display.tags, display.department]
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .join(", ");
  return mentorSubjectChips(merged, 16);
}

export function MentorDetailSubjectTabs(props: { display: MentorProfileDisplay }) {
  const chips = mentoringSubjectChips(props.display);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-black text-slate-900">멘토링 과목</h2>
      <p className="mt-1 text-xs font-medium text-slate-500">멘토가 안내하는 주요 과목·분야입니다.</p>
      {chips.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {chips.map((c) => (
            <li
              key={c}
              className="rounded-lg border border-[#2563EB]/35 bg-blue-50/40 px-2.5 py-1 text-xs font-bold text-[#2563EB]"
            >
              {c}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">등록된 과목 정보가 아직 없어요.</p>
      )}
    </section>
  );
}
