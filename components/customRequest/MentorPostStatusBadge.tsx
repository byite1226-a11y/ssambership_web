import {
  mentorPostStatusLabelForUi,
  mentorPostStatusToken,
  mentorPostStatusUiTone,
  type MentorPostStatusUiTone,
} from "@/lib/customRequest/mentorCustomRequestDisplay";

const TONE: Record<MentorPostStatusUiTone, string> = {
  blue: "border-sky-200/90 bg-sky-100 text-sky-950",
  green: "border-emerald-200/90 bg-emerald-100 text-emerald-950",
  gray: "border-slate-200/90 bg-slate-100 text-slate-800",
  amber: "border-amber-200/90 bg-amber-100 text-amber-950",
};

type Row = Record<string, unknown>;

export function MentorPostStatusBadge({ row }: { row: Row }) {
  const t = mentorPostStatusToken(row);
  const label = mentorPostStatusLabelForUi(t);
  const tone = mentorPostStatusUiTone(t);
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${TONE[tone]}`}
    >
      {label}
    </span>
  );
}
