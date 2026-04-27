import Link from "next/link";
import { PUBLIC_MENTORS_RLS_HINT, type MentorPublicListCard, type PublicMentorsListResult } from "@/lib/mentor/publicMentorsListQueries";

export function RecommendedMentorsSection(props: { list: PublicMentorsListResult }) {
  const { list } = props;
  if (list.usersError) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-extrabold text-red-900">추천 멘토</h2>
        <p className="mt-2 text-sm text-red-800">{list.usersError}</p>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">추천 멘토</h2>
          <p className="mt-1 text-xs text-slate-500">users + mentor_profiles · 최대 6명</p>
        </div>
        <Link href="/mentors" className="text-sm font-extrabold text-blue-700 underline">
          전체 멘토 보기 →
        </Link>
      </div>
      {list.onlySelfVisibleHint || list.cards.length === 0 ? (
        <p className="mt-4 text-sm text-amber-900">{PUBLIC_MENTORS_RLS_HINT}</p>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.cards.map((c) => (
          <MentorMini key={c.mentorId} card={c} />
        ))}
      </div>
      {list.probes.length ? (
        <ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-slate-500">
          {list.probes.slice(0, 4).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function MentorMini({ card }: { card: MentorPublicListCard }) {
  const d = card.display;
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
      <p className="font-black text-slate-900">{d.displayName}</p>
      <p className="mt-1 line-clamp-1 text-xs text-slate-600">
        {d.university} · {d.department}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{d.subjects || "—"}</p>
      <Link href={`/mentors/${card.mentorId}`} className="mt-2 inline-block text-xs font-bold text-blue-700 underline">
        프로필
      </Link>
    </div>
  );
}
