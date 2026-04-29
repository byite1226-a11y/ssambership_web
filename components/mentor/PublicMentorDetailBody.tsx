import Link from "next/link";
import { PlanComparisonCards } from "@/components/subscribe/PlanComparisonCards";
import type { MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import type { PublicMentorLoadResult } from "@/lib/mentor/publicMentorBundle";
import { assignPlansByTier } from "@/lib/subscribe/subscribePageQueries";
import { getStringField } from "@/lib/qna/safeSelect";
import type { UserRow } from "@/lib/types/user";

function Field(props: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{props.label}</p>
      <p className={`mt-0.5 min-h-[1.25rem] text-sm font-bold text-slate-900 ${props.mono ? "font-mono text-xs break-all" : ""}`}>
        {props.value || "—"}
      </p>
    </div>
  );
}

export function PublicMentorDetailBody(props: {
  mentorId: string;
  userRow: UserRow;
  display: MentorProfileDisplay;
  bundle: Extract<PublicMentorLoadResult, { kind: "ok" }>;
}) {
  const { mentorId, userRow, display, bundle } = props;
  const mediaRows = bundle.media.rows;
  const { byTier, fillProbe } = assignPlansByTier(bundle.plans.rows as Record<string, unknown>[]);
  const subscribeHref = `/subscribe?mentorId=${encodeURIComponent(mentorId)}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_minmax(280px,360px)] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 p-5 sm:p-6">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">멘토 프로필</p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-200/80 text-2xl font-black text-slate-700"
                aria-hidden
              >
                {(display.displayName || "멘").trim().slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{display.displayName}</h1>
                <p className="mt-1 text-sm text-slate-600">
                  {display.university && display.department
                    ? `${display.university} · ${display.department}`
                    : display.university || display.department || "학교·학과 정보가 아직 없어요"}
                </p>
                <p className="mt-1 text-xs text-slate-500">역할: {userRow.role} · 계정: {userRow.status}</p>
                {bundle.userError ? <p className="mt-2 text-xs font-bold text-amber-800">사용자 정보: {bundle.userError}</p> : null}
                {bundle.profileError ? (
                  <p className="mt-1 text-xs font-bold text-amber-800">프로필: {bundle.profileError}</p>
                ) : null}
              </div>
            </div>

            <p className="mt-4 min-h-[3rem] text-sm leading-relaxed text-slate-800 sm:text-base">
              {display.intro?.trim() || "대표 소개는 준비 중이에요. 아래 콘텐츠·리뷰·플랜을 참고해 주세요."}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Field label="인증" value={display.verification} />
              <Field label="과목·지도" value={display.subjects} />
              <Field label="대표 태그" value={display.tags} />
              <Field label="구독 수락" value={display.subOpen ? "가능" : "준비·비공개"} />
            </div>
            {display.photoUrl ? (
              <p className="mt-3 text-xs text-slate-500">
                프로필 이미지:{" "}
                <a className="font-mono text-blue-700 underline break-all" href={display.photoUrl} target="_blank" rel="noreferrer">
                  열기
                </a>
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-slate-900">대표 콘텐츠</h2>
            <p className="mt-1 text-xs text-slate-500">{bundle.media.probe}</p>
            {bundle.media.error ? <p className="mt-2 text-sm font-bold text-red-800">{bundle.media.error}</p> : null}
            {!mediaRows.length && !bundle.media.error ? (
              <p className="mt-3 text-sm text-slate-600">표시할 콘텐츠가 없어요. 연결·권한이 정리되면 이곳에 모입니다.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {mediaRows.map((r, i) => {
                  const id = r.id != null ? String(r.id) : `row-${i}`;
                  const t = getStringField(r as Record<string, unknown>, ["title", "name", "caption", "label"]) ?? id;
                  return (
                    <li key={id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm font-bold text-slate-800">
                      {t}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-slate-900">리뷰</h2>
            <p className="mt-1 text-xs text-slate-500">{bundle.reviews.probe}</p>
            {bundle.reviews.error ? <p className="mt-2 text-sm font-bold text-amber-800">{bundle.reviews.error}</p> : null}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Field label="리뷰 수" value={bundle.reviews.count != null ? String(bundle.reviews.count) : "—"} />
              <Field
                label="평균 평점"
                value={bundle.reviews.avgRating != null ? bundle.reviews.avgRating.toFixed(2) : "—"}
              />
            </div>
            {bundle.reviews.count == null && !bundle.reviews.error ? (
              <p className="mt-2 text-sm text-slate-600">집계된 리뷰가 없거나 아직 연결되지 않았어요.</p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-slate-900">자주 묻는 질문</h2>
            <p className="mt-2 text-sm text-slate-600">운영·정책에 맞는 FAQ는 준비 중입니다. 구독·환불·질문 한도는 결제·플랜 화면에서 안내돼요.</p>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-slate-600">
              <li>질문방·멤버십은 구독·정책에 따라 열려요.</li>
              <li>결제는 연결된 구독 전용 흐름을 따릅니다.</li>
            </ul>
          </section>

          <details className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-sm text-amber-950">
            <summary className="cursor-pointer font-extrabold">편집 화면과 항목이 다를 수 있어요(참고)</summary>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              <li>이름·표시: 공개는 계정/프로필에서 온 값을 씁니다.</li>
              <li>리뷰·요금: 일부는 조회용 probe이며, 멘토용 편집 폼과 1:1이 아닐 수 있어요.</li>
            </ul>
          </details>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-slate-50/80 to-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">멤버십 플랜</h2>
            <p className="mt-0.5 text-xs text-slate-600">티어를 골라 구독·결제 화면으로 이동해요(기존 흐름)</p>
            <div className="mt-4 min-w-0">
              <PlanComparisonCards
                mentorId={mentorId}
                byTier={byTier}
                selectedTier="standard"
                plansError={bundle.plans.error}
                plansProbe={bundle.plans.probe}
                fillProbe={fillProbe}
              />
            </div>
            <Link
              href={subscribeHref}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-500"
            >
              구독·결제 화면으로
            </Link>
            <p className="mt-2 text-center text-xs text-slate-500">학생 로그인·역할이 맞지 않으면 로그인/홈으로 안내돼요.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/mentors"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-bold text-slate-800"
            >
              멘토 목록
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function PublicMentorNotFoundBody(props: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-8">
      <p className="text-lg font-extrabold text-slate-900">{props.title}</p>
      <p className="mt-2 min-h-[1.25rem] text-sm text-slate-600">{props.message}</p>
      <Link
        href="/mentors"
        className="mt-5 inline-block min-h-[44px] rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
      >
        멘토 찾기로
      </Link>
    </div>
  );
}
