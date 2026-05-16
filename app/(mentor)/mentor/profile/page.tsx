import type { ReactNode } from "react";
import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { buildMentorProfileDisplay, mentorVerificationKo } from "@/lib/mentor/mentorDisplayFields";
import { fetchMentorMediaSample, fetchMentorProfileRow } from "@/lib/mentor/mentorProfileQueries";
import { getStringField } from "@/lib/qna/safeSelect";

export const dynamic = "force-dynamic";

function DashCard(props: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{props.title}</p>
      {props.subtitle ? <p className="mt-1 text-xs font-medium text-slate-500">{props.subtitle}</p> : null}
      <div className="mt-4">{props.children}</div>
    </div>
  );
}

export default async function MentorProfilePage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const { row } = await fetchMentorProfileRow(supabase, user.id);
  const { data: userRow } = await getUserProfileById(supabase, user.id);
  const display = buildMentorProfileDisplay(row, userRow ?? null);
  const media = await fetchMentorMediaSample(supabase, user.id, 8);

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
      description="공개 상태·인증·요약 정보를 한 화면에서 확인하고, 학생에게 보이는 화면으로 이동하세요."
      ctas={[
        { href: "/mentor/profile/edit", label: "프로필 편집", tone: "blue" },
        { href: "/mentor/verification", label: "인증·검수", tone: "slate" },
        { href: `/mentors/${user.id}`, label: "공개 프로필 보기", tone: "slate" },
        { href: "/mentor/dashboard", label: "멘토 홈", tone: "green" },
      ]}
      sections={[]}
    >
      <div className="mx-auto mt-6 max-w-6xl space-y-5 px-0 sm:space-y-6">
        <div className="grid gap-5 lg:grid-cols-3">
          <DashCard title="프로필 완성도" subtitle="핵심 필드 채움 기준 요약">
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black text-blue-700">{completenessPct}%</p>
              <p className="pb-1 text-sm font-medium text-slate-600">채운 항목 {completeness}/5</p>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-500" style={{ width: `${completenessPct}%` }} />
            </div>
          </DashCard>

          <DashCard title="공개 상태" subtitle="멘토 찾기·상세 노출">
            <p className="text-lg font-black text-slate-900">{display.subOpen ? "목록·구독 공개" : "비공개 / 구독 미수락"}</p>
            <p className="mt-2 text-sm text-slate-600">학생이 멘토 찾기에서 프로필을 볼 수 있는지와 구독 수락 여부입니다.</p>
          </DashCard>

          <DashCard title="인증·검수" subtitle="학생증·검수 상태">
            <p className="text-lg font-black text-slate-900">{verKo}</p>
            <p className="mt-2 text-sm text-slate-600">편집 화면에서 학생증 링크를 확인할 수 있어요.</p>
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
            <p className="mt-2 text-sm text-slate-600">실제 금액·티어는 구독/결제 설정 화면과 연동됩니다.</p>
          </DashCard>
        </div>

        <DashCard title="자기소개 미리보기">
          <p className="min-h-[4rem] whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{intro}</p>
        </DashCard>

        <DashCard title="대표 콘텐츠·미디어" subtitle="채널에서 학생에게 노출되는 대표 콘텐츠입니다">
          <p className="text-3xl font-black tabular-nums text-blue-700">{media.rows.length}</p>
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

        <div className="grid gap-5 lg:grid-cols-2">
          <DashCard title="리뷰·평점" subtitle="공개 프로필에서 집계">
            <p className="text-sm text-slate-600">집계·최근 리뷰는 공개 멘토 상세에서 확인됩니다.</p>
            <Link href={`/mentors/${user.id}`} className="mt-4 inline-flex min-h-[44px] items-center text-sm font-extrabold text-blue-700 underline underline-offset-2">
              공개 프로필에서 리뷰 보기 →
            </Link>
          </DashCard>

          <DashCard title="학생에게 이렇게 보여요" subtitle="공개 멘토 카드 요약 미리보기">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-bold text-slate-500">미리보기</p>
              <p className="mt-2 text-lg font-black text-slate-900">{display.displayName}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{display.university || "학교"} · {display.department || "학과"}</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{intro}</p>
            </div>
          </DashCard>
        </div>

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

        <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-5 text-sm text-amber-950">
          <p className="font-extrabold">운영 안내</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
            <li>프로필 정보는 학생 멘토 찾기·상세에 반영됩니다.</li>
            <li>대표 콘텐츠·리뷰는 채널·공개 상세에서 이어집니다.</li>
            <li>요금제는 멤버십 메뉴에서 별도로 수정할 수 있어요.</li>
          </ul>
        </div>
      </div>
    </PageScaffold>
  );
}
