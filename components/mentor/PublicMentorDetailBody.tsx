import Link from "next/link";
import type { MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import type { PublicMentorLoadResult } from "@/lib/mentor/publicMentorBundle";
import type { UserRow } from "@/lib/types/user";
import { getStringField } from "@/lib/qna/safeSelect";

function Field(props: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{props.label}</p>
      <p className={`mt-0.5 text-sm font-bold text-slate-900 ${props.mono ? "font-mono text-xs break-all" : ""}`}>
        {props.value || "—"}
      </p>
    </div>
  );
}

function PlanCard(props: { row: Record<string, unknown>; index: number }) {
  const { row, index } = props;
  const title = getStringField(row, ["title", "name", "label", "plan_name", "tier_name"]) ?? `요금제 ${index + 1}`;
  const price = getStringField(row, ["price", "amount", "monthly_price", "price_krw", "amount_cents"]);
  const interval = getStringField(row, ["interval", "billing_interval", "period"]);
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-extrabold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-600">
        {price ? `${price}${interval ? ` · ${interval}` : ""}` : "금액 컬럼 미매칭 — 스키마 확정 후"}
      </p>
    </article>
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Public / 멘토 상단</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">{display.displayName}</h1>
        <p className="mt-1 text-xs text-slate-500">
          mentorId(users.id): <span className="font-mono">{mentorId}</span> · role={userRow.role} · status={userRow.status}
        </p>
        {bundle.userError ? <p className="mt-2 text-xs font-bold text-amber-800">users 조회 경고: {bundle.userError}</p> : null}
        {bundle.profileError ? (
          <p className="mt-2 text-xs font-bold text-amber-800">mentor_profiles: {bundle.profileError}</p>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Field label="이름(표시)" value={display.displayName} />
          <Field label="인증 상태" value={display.verification} />
          <Field label="대학교" value={display.university} />
          <Field label="과(학과)" value={display.department} />
          <Field label="과목" value={display.subjects} />
          <Field label="출신 고등학교" value={display.highSchool} />
          <Field label="대표 태그" value={display.tags} />
          <Field label="구독 가능(프로필)" value={display.subOpen ? "열림" : "닫힘"} />
        </div>
        <div className="mt-3">
          <Field label="대표 소개" value={display.intro} />
        </div>
        {display.photoUrl ? (
          <p className="mt-2 text-xs text-slate-500">
            프로필/검증 이미지 URL:{" "}
            <a className="font-mono text-blue-700 underline" href={display.photoUrl} target="_blank" rel="noreferrer">
              링크
            </a>
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-slate-900">대표 콘텐츠</h2>
        <p className="mt-1 text-xs text-slate-500">{bundle.media.probe}</p>
        {bundle.media.error ? <p className="mt-2 text-sm font-bold text-red-800">{bundle.media.error}</p> : null}
        {!mediaRows.length && !bundle.media.error ? (
          <p className="mt-2 text-sm text-slate-600">노출할 미디어 행이 없습니다. mentor_media 계열 RLS·데이터를 연결하세요.</p>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-slate-900">리뷰 요약</h2>
        <p className="mt-1 text-xs text-slate-500">{bundle.reviews.probe}</p>
        {bundle.reviews.error ? <p className="mt-2 text-sm font-bold text-amber-800">{bundle.reviews.error}</p> : null}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Field label="리뷰 수" value={bundle.reviews.count != null ? String(bundle.reviews.count) : "(조회 대기)"} />
          <Field
            label="평균 평점"
            value={bundle.reviews.avgRating != null ? bundle.reviews.avgRating.toFixed(2) : "(컬럼·데이터 확정 후)"}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          reviews_summary 뷰가 있으면 여기로 전환 예정 — 현재는 {bundle.reviews.table ?? "후보 테이블"} probe.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-slate-900">요금제</h2>
        <p className="mt-1 text-xs text-slate-500">{bundle.plans.probe}</p>
        {bundle.plans.error ? <p className="mt-2 text-sm font-bold text-amber-800">{bundle.plans.error}</p> : null}
        {!bundle.plans.rows.length ? (
          <p className="mt-2 text-sm text-slate-600">요금제 행 없음 또는 plans 테이블 미연결</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {bundle.plans.rows.map((row, i) => (
              <PlanCard key={String(row.id ?? i)} row={row} index={i} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
        <h2 className="text-sm font-extrabold text-amber-950">편집 화면과의 정합성 메모</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-950">
          <li>
            <strong>이름:</strong> 공개는 users.full_name / nickname — 멘토 프로필 편집 폼에는 이름 입력란이 없음(계정/마이페이지
            후속).
          </li>
          <li>
            <strong>대표 콘텐츠:</strong> 편집 폼은 미디어 테이블 probe 안내만 — 공개 상세는 mentor_media 샘플 목록을 노출.
          </li>
          <li>
            <strong>리뷰·요금제 카드:</strong> 공개 전용 probe — 편집 폼에는 없음. 구독 토글(subOpen)만 편집 측에 존재.
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/subscribe?mentorId=${encodeURIComponent(mentorId)}`}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-500"
        >
          구독·결제(학생)
        </Link>
        <Link href="/mentors" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">
          목록으로
        </Link>
      </div>
      <p className="text-xs text-slate-500">학생 로그인·역할이 맞지 않으면 로그인/홈으로 연결됩니다(세션·RLS).</p>
    </div>
  );
}

export function PublicMentorNotFoundBody(props: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <p className="text-lg font-extrabold text-slate-900">{props.title}</p>
      <p className="mt-2 text-sm text-slate-600">{props.message}</p>
      <Link href="/mentors" className="mt-4 inline-block text-sm font-bold text-blue-700 underline">
        멘토 찾기로
      </Link>
    </div>
  );
}
