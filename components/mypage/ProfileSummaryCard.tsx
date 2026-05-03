import type { UserRow } from "@/lib/types/user";

const AREA_ROLE_KO: Record<"student" | "mentor" | "admin", string> = {
  student: "학생",
  mentor: "멘토",
  admin: "관리자",
};

/** 멘토/학생 공용 프로필 요약 카드 */
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
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">내 프로필</h2>
          <p className="mt-1 text-xs text-slate-500">계정 정보 및 권한</p>
        </div>
        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 border border-blue-100">
          {AREA_ROLE_KO[areaRole]}
        </span>
      </div>
      {profileError ? (
        <p className="mt-3 text-sm font-semibold text-amber-800">프로필: {profileError}</p>
      ) : null}
      <p className="mt-4 text-xl font-extrabold text-slate-900">{name}</p>
      {sub ? <p className="mt-1 text-sm text-slate-600">{sub}</p> : null}
      {profile?.student_status ? (
        <p className="mt-2 text-sm text-slate-600">학적/상태: {profile.student_status}</p>
      ) : null}
    </section>
  );
}
