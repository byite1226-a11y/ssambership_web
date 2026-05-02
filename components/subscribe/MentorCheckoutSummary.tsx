import Link from "next/link";
import { mentorVerificationKo, type MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

export function MentorCheckoutSummary(props: {
  mentorId: string;
  display: MentorProfileDisplay;
  profileError: string | null;
}) {
  const d = props.display;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase text-slate-500">선택한 멘토</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">{d.displayName}</h2>
        </div>
        <Link
          href={`/mentors/${props.mentorId}`}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
        >
          프로필로 돌아가기
        </Link>
      </div>
      {props.profileError ? <p className="mt-2 text-sm font-bold text-amber-800">{USER_UI_LOAD_FAILED}</p> : null}
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-extrabold text-slate-500">대학교</dt>
          <dd className="font-bold text-slate-900">{d.university || "—"}</dd>
        </div>
        <div>
          <dt className="font-extrabold text-slate-500">과</dt>
          <dd className="font-bold text-slate-900">{d.department || "—"}</dd>
        </div>
        <div>
          <dt className="font-extrabold text-slate-500">과목</dt>
          <dd className="line-clamp-2 font-bold text-slate-900">{d.subjects || "—"}</dd>
        </div>
        <div>
          <dt className="font-extrabold text-slate-500">인증</dt>
          <dd className="font-bold text-slate-900">{mentorVerificationKo(d.verification)}</dd>
        </div>
      </dl>
      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-700">{d.intro || "대표 소개 없음"}</p>
    </section>
  );
}
