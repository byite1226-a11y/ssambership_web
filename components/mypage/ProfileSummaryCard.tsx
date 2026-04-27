import type { UserRow } from "@/lib/types/user";

/**
 * 멘토/학생 공용: 프로필 한 줄·역할·보조 메타(스키마 연동 시 필드만 늘리면 됨)
 */
export function ProfileSummaryCard(props: {
  profile: UserRow | null;
  fallbackEmail: string | null;
  profileError: string | null;
  /** layout에서 이미 student로 고정됐다는 힌트(멘토 마이페이지에서는 "mentor"로 바꾸기) */
  areaRole: "student" | "mentor" | "admin";
}) {
  const { profile, fallbackEmail, profileError, areaRole } = props;
  const name = profile?.full_name?.trim() || profile?.nickname?.trim() || fallbackEmail || "—";
  const sub = [profile?.email?.trim() || fallbackEmail, profile?.grade_level].filter(Boolean).join(" · ");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">프로필</h2>
          <p className="mt-1 text-sm text-slate-500">public.users + Auth 세션 (RLS)</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">역할: {areaRole}</span>
      </div>
      {profileError ? (
        <p className="mt-3 text-sm font-semibold text-amber-800">프로필: {profileError}</p>
      ) : null}
      <p className="mt-3 text-2xl font-black text-slate-900">{name}</p>
      {sub ? <p className="mt-1 text-sm text-slate-600">{sub}</p> : null}
      {profile?.student_status ? (
        <p className="mt-2 text-sm text-slate-600">학적/상태: {profile.student_status}</p>
      ) : null}
    </section>
  );
}
