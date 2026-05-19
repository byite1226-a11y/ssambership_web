import type { ReactNode } from "react";
import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorProfileHubPreview } from "@/components/mentor/MentorProfileHubPreview";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { buildMentorProfileDisplay, mentorVerificationKo } from "@/lib/mentor/mentorDisplayFields";
import { fetchMentorMediaSample, fetchMentorProfileRow } from "@/lib/mentor/mentorProfileQueries";
import { fetchPlansForMentor } from "@/lib/mentor/publicMentorBundle";
import { assignPlansByTier } from "@/lib/subscribe/subscribePageQueries";
import { getStringField } from "@/lib/qna/safeSelect";

export const dynamic = "force-dynamic";

function DashCard(props: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-sm font-black text-slate-900">{props.title}</h2>
      {props.subtitle ? <p className="mt-1 text-xs font-medium text-slate-500">{props.subtitle}</p> : null}
      <div className="mt-4">{props.children}</div>
    </section>
  );
}

export default async function MentorProfilePage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const { row } = await fetchMentorProfileRow(supabase, user.id);
  const { data: userRow } = await getUserProfileById(supabase, user.id);
  const display = buildMentorProfileDisplay(row, userRow ?? null);
  const media = await fetchMentorMediaSample(supabase, user.id, 8);
  const plans = await fetchPlansForMentor(supabase, user.id);
  const { byTier } = assignPlansByTier(plans.rows);

  const intro = display.intro?.trim() || "대표 소개는 준비 중이에요. 프로필 편집에서 첫인상을 남겨보세요.";
  const verKo = mentorVerificationKo(display.verification);
  const completeness =
    [display.intro, display.university, display.department, display.subjects, display.tags].filter((s) => s && String(s).trim().length > 0)
      .length;
  const completenessPct = Math.min(100, Math.round((completeness / 5) * 100));

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="멘토"
      title="멘토 총 프로필 관리"
      description="학생에게 보이는 공개 정보와 채널 상태를 관리합니다."
      ctas={[
        { href: "/mentor/profile/edit", label: "프로필 편집", tone: "blue" },
        { href: `/mentors/${user.id}`, label: "공개 프로필 보기", tone: "slate" },
        { href: "/mentor/dashboard", label: "멘토 홈", tone: "slate" },
      ]}
      sections={[]}
    >
      <div className="mx-auto mt-2 max-w-[1400px] space-y-6 px-0">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
        <div className="grid gap-5 lg:grid-cols-3">
          <DashCard title="프로필 완성도" subtitle="핵심 필드 채움 기준 요약">
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black text-slate-900">{completenessPct}%</p>
              <p className="pb-1 text-sm font-medium text-slate-600">채운 항목 {completeness}/5</p>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${completenessPct}%` }} />
            </div>
          </DashCard>

          <DashCard title="공개 상태" subtitle="멘토 찾기·상세 노출">
            <p className="text-lg font-black text-slate-900">{display.subOpen ? "목록·구독 공개" : "비공개 / 구독 미수락"}</p>
            <p className="mt-2 text-sm text-slate-600">학생이 멘토 찾기에서 프로필을 볼 수 있는지와 구독 수락 여부입니다.</p>
          </DashCard>

          <DashCard title="인증 상태" subtitle="운영자 검토 결과 (읽기 전용)">
            <p className="text-lg font-black text-slate-900">{verKo}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              검수는 운영자가 처리하며, 필요한 경우 안내를 확인해 주세요. 서류·학생증은 프로필 편집에서 수정할 수 있어요.
            </p>
            <Link
              href="/mentor/verification"
              className="mt-4 inline-flex text-sm font-extrabold text-slate-700 underline underline-offset-2 hover:text-slate-900"
            >
              인증 상태 자세히 보기 →
            </Link>
          </DashCard>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <DashCard title="학교·전공·과목·태그">
            <p className="text-base font-extrabold text-slate-900">
              {display.university ? `${display.university} · ${display.department}` : "학교·학과 정보 준비 중"}
            </p>
            <p className="mt-3 text-sm font-bold text-slate-800">과목: {display.subjects || "—"}</p>
            <p className="mt-2 text-sm font-bold text-slate-800">태그: {display.tags || "—"}</p>
          </DashCard>

          <DashCard title="요금제·구독 공개" subtitle="플랜은 멤버십 메뉴에서 관리">
            <p className="text-base font-extrabold text-slate-900">{display.subOpen ? "구독 받기 설정: 켜짐" : "구독 받기 설정: 꺼짐"}</p>
            {!display.subOpen ? (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                학생이 구독을 신청할 수 없습니다.{" "}
                <Link href="/mentor/profile/edit" className="font-extrabold text-blue-700 underline underline-offset-2">
                  프로필 편집
                </Link>
                에서 공개를 켜 주세요.
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-600">실제 금액·티어는 구독/결제 설정 화면과 연동됩니다.</p>
            )}
          </DashCard>
        </div>

        <DashCard title="자기소개 미리보기">
          <p className="min-h-[4rem] whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{intro}</p>
        </DashCard>

        <DashCard title="대표 콘텐츠·미디어" subtitle="채널에서 학생에게 노출되는 대표 콘텐츠입니다">
          <p className="text-3xl font-black tabular-nums text-slate-900">{media.rows.length}</p>
          <p className="mt-1 text-sm font-medium text-slate-600">연결된 항목 수예요. 채널 메뉴에서 추가·정렬할 수 있어요.</p>
          {media.rows.length > 0 ? (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {media.rows.slice(0, 6).map((r, i) => {
                const id = r.id != null ? String(r.id) : `m-${i}`;
                const title =
                  getStringField(r as Record<string, unknown>, ["title", "name", "caption", "label"]) ?? `콘텐츠 ${i + 1}`;
                return (
                  <li
                    key={id}
                    className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 text-xs font-bold leading-snug text-slate-800"
                  >
                    {title}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              아직 연결된 대표 콘텐츠가 없어요. 채널에서 등록하면 이곳에 채워져요.
            </p>
          )}
        </DashCard>

        <DashCard title="리뷰·평점" subtitle="공개 프로필에서 집계">
          <p className="text-sm text-slate-600">집계·최근 리뷰는 공개 멘토 상세에서 확인됩니다.</p>
          <Link href={`/mentors/${user.id}`} className="mt-4 inline-flex min-h-[44px] items-center text-sm font-extrabold text-blue-700 underline underline-offset-2">
            공개 프로필에서 리뷰 보기 →
          </Link>
        </DashCard>

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-extrabold text-slate-900">다음 작업</p>
            <p className="mt-1 text-xs text-slate-600">편집 저장 후 공개 화면을 확인해 주세요.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/mentor/profile/edit"
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-blue-600 px-6 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700"
            >
              프로필 편집
            </Link>
            <Link
              href={`/mentors/${user.id}`}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border-2 border-slate-300 bg-white px-6 text-sm font-extrabold text-slate-900 hover:border-slate-400"
            >
              공개 프로필 보기
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700 sm:p-6">
          <p className="font-extrabold text-slate-900">운영 안내</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed">
            <li>프로필 정보는 학생 멘토 찾기·상세에 반영됩니다.</li>
            <li>대표 콘텐츠·리뷰는 채널·공개 상세에서 이어집니다.</li>
            <li>요금제는 멤버십 메뉴에서 별도로 수정할 수 있습니다.</li>
          </ul>
        </div>
          </div>
          <aside className="lg:col-span-5">
            <div className="sticky top-24 space-y-3">
              <h2 className="text-lg font-black text-slate-900">학생에게 보이는 미리보기</h2>
              <p className="text-sm font-medium text-slate-500">편집 화면과 동일한 요약 카드입니다.</p>
              <MentorProfileHubPreview {...display} intro={intro} mediaCount={media.rows.length} byTier={byTier} />
            </div>
          </aside>
        </div>
      </div>
    </PageScaffold>
  );
}
