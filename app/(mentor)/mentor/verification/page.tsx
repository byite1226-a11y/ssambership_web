import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/routeGuard";
import { fetchMentorProfileRow } from "@/lib/mentor/mentorProfileQueries";
import { buildMentorProfileDisplay, mentorVerificationKo } from "@/lib/mentor/mentorDisplayFields";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { fetchLatestMentorSchoolVerification, type MentorSchoolVerificationRow } from "@/lib/mentor/mentorSchoolVerification";
import { submitMentorSchoolVerificationAction } from "@/lib/mentor/mentorSchoolVerificationActions";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function firstParam(v: string | string[] | undefined): string | null {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0] ?? null;
  return null;
}

function schoolVerificationStatusLabel(status: string | null | undefined): string {
  const s = String(status ?? "").trim().toLowerCase();
  if (s === "approved") return "학교·전공 인증 완료";
  if (s === "rejected") return "반려";
  if (s === "resubmit_required") return "재제출 필요";
  if (s === "pending") return "심사 대기";
  return "미제출";
}

function schoolVerificationBadgeClass(status: string | null | undefined): string {
  const s = String(status ?? "").trim().toLowerCase();
  if (s === "approved") return "border-emerald-200 bg-emerald-50 text-[#059669]";
  if (s === "rejected") return "border-red-200 bg-red-50 text-red-700";
  if (s === "resubmit_required") return "border-amber-200 bg-amber-50 text-amber-900";
  if (s === "pending") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function formatDateTime(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function verifiedValueSummary(row: MentorSchoolVerificationRow | null): string {
  if (!row) return "관리자가 서류를 확인하면 검증값이 기록됩니다.";
  const values = [
    row.verified_university_name,
    row.verified_department_name,
    row.verified_major_category,
    row.school_tier,
  ].filter((x) => typeof x === "string" && x.trim().length > 0);
  return values.length ? values.join(" · ") : "관리자 입력 전이라 검증값은 비어 있습니다.";
}

export default async function MentorVerificationPage(props: PageProps) {
  const { user } = await requireRole("mentor");
  const sp = (await props.searchParams) ?? {};
  const schoolDocOk = firstParam(sp.schoolDoc);
  const schoolDocError = firstParam(sp.schoolDocError);
  const supabase = await createClient();
  const { row } = await fetchMentorProfileRow(supabase, user.id);
  const { data: userRow } = await getUserProfileById(supabase, user.id);
  const schoolVerification = await fetchLatestMentorSchoolVerification(supabase, user.id);
  const display = buildMentorProfileDisplay(row, userRow ?? null);
  const ver = mentorVerificationKo(display.verification);
  const schoolRow = schoolVerification.row;
  const schoolStatus = schoolRow?.status ?? null;
  const schoolStatusLabel = schoolVerificationStatusLabel(schoolStatus);
  const canSubmitSchoolDocument = schoolStatus !== "pending";

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="멘토"
      title="인증 상태"
      description="학생증·운영 검토 결과를 확인합니다. 승인·반려·재제출 안내는 운영자 검토 후 이 화면에 반영됩니다."
      ctas={[
        { href: "/mentor/profile/edit", label: "프로필·서류 편집", tone: "blue" },
        { href: "/mentor/profile", label: "프로필 요약", tone: "slate" },
      ]}
      sections={[
        { title: "현재 상태", body: ver, status: row ? "connected" : "skeleton" },
        {
          title: "학교·전공 인증",
          body: schoolStatusLabel,
          status: schoolStatus === "approved" ? "connected" : "skeleton",
        },
      ]}
      dataPoints={["mentor_profiles.verification_status", "mentor_school_verifications"]}
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {schoolDocOk ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {schoolDocOk}
          </p>
        ) : null}
        {schoolDocError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {schoolDocError}
          </p>
        ) : null}
        {schoolVerification.error ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            학교·전공 인증 상태를 불러오지 못했습니다. {mapDataErrorMessage(schoolVerification.error)}
          </p>
        ) : null}

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-slate-900">표시명</p>
              <p className="mt-1 text-lg font-black text-slate-800">{display.displayName}</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
              멘토 인증 {ver}
            </span>
          </div>
          {!row ? (
            <p className="text-sm text-amber-800">멘토 프로필 행을 찾지 못했습니다. 프로필 편집에서 정보를 저장해 주세요.</p>
          ) : null}
          <p className="text-xs text-slate-500">
            약관·정책 초안은{" "}
            <Link href="/legal/terms" className="font-bold text-blue-700 underline">
              이용약관(안내)
            </Link>
            에서 확인할 수 있어요.
          </p>
        </section>

        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">School Verification</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">학교·전공 인증</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                재학증명서, 졸업증명서, 합격증 등 학교와 전공이 확인되는 서류를 제출해 주세요.
                관리자가 서류를 확인한 뒤 검증값을 입력합니다.
              </p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${schoolVerificationBadgeClass(schoolStatus)}`}>
              {schoolStatusLabel}
            </span>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">최근 제출</p>
              <p className="mt-1 font-bold text-slate-900">{schoolRow ? formatDateTime(schoolRow.created_at) : "아직 제출된 서류가 없습니다."}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">검증값</p>
              <p className="mt-1 font-bold text-slate-900">{verifiedValueSummary(schoolRow)}</p>
            </div>
          </div>

          {schoolRow?.reject_reason ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              반려 사유: {schoolRow.reject_reason}
            </p>
          ) : null}

          <form action={submitMentorSchoolVerificationAction} className="space-y-3">
            <div>
              <label htmlFor="schoolVerificationDocument" className="text-sm font-black text-slate-900">
                학교·전공 증명 서류
              </label>
              <input
                id="schoolVerificationDocument"
                name="schoolVerificationDocument"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                disabled={!canSubmitSchoolDocument}
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-black file:text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                JPG, PNG, PDF 형식을 지원합니다. 제출한 서류는 비공개 저장소에 보관되고, 관리자 확인 후 인증됩니다.
              </p>
            </div>
            <FormSubmitButton
              idleLabel={canSubmitSchoolDocument ? "학교·전공 인증 서류 제출" : "심사 대기 중"}
              pendingLabel="제출 중…"
              disabled={!canSubmitSchoolDocument}
              className="min-h-12 w-full rounded-xl bg-[#1A56DB] px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            />
          </form>
        </section>
      </div>
    </PageScaffold>
  );
}
