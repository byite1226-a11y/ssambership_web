import Link from "next/link";
import type { StudentMypageBundle } from "@/lib/mypage/mypageQueries";
import { MypageMetricLine } from "@/components/mypage/MypageMetricLine";
import { ProfileSummaryCard } from "@/components/mypage/ProfileSummaryCard";

type Props = { bundle: StudentMypageBundle; sessionEmail: string | null };

/**
 * 학생 마이페이지 메인(멘토는 동일 블록을 areaRole·CTA 링크만 갈아끼울 수 있게 분리)
 */
export function StudentMypageMain(props: Props) {
  const { bundle, sessionEmail } = props;
  const { roomCount } = bundle;
  const roomText = roomCount.error
    ? "질문방 목록을 불러오지 못했습니다."
    : roomCount.n === 0
      ? "아직 열린 질문방이 없습니다. 멘토와 맺은 방이 여기에 이어집니다."
      : `연결된 질문방 ${roomCount.n}개 (threads는 /question-room).`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileSummaryCard
          profile={bundle.profile}
          fallbackEmail={sessionEmail}
          profileError={bundle.profileError}
          areaRole="student"
        />
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-extrabold text-slate-900">질문 / QnA</h2>
          <p className="mt-2 text-sm text-slate-600">{roomText}</p>
          {roomCount.error ? <p className="mt-1 text-xs text-amber-800">Supabase: {roomCount.error}</p> : null}
          <div className="mt-4">
            <Link
              className="inline-block rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-blue-500"
              href="/question-room"
            >
              질문방으로 이동
            </Link>
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-extrabold text-slate-900">구독 · 멤버십</h2>
          <MypageMetricLine metric={bundle.subscriptions} />
          <div className="mt-2 flex flex-wrap gap-2">
            <Link className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-800 hover:bg-slate-200" href="/subscriptions">
              구독 관리
            </Link>
            <Link className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-800 hover:bg-slate-200" href="/mentors">
              멘토 찾기·구독
            </Link>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-extrabold text-slate-900">결제 · 캐시(진입)</h2>
          <MypageMetricLine metric={bundle.payments} />
          <p className="text-xs text-slate-500">캐시: 정식 `/wallet/charge`, 원장 `/wallet/ledger` (기존 `/wallet`·`/cash-history`는 redirect). 공개 `/cash` 유지.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-800 hover:bg-slate-200" href="/wallet/charge">
              캐시 충전
            </Link>
            <Link className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-800 hover:bg-slate-200" href="/wallet/ledger">
              캐시 원장
            </Link>
            <Link className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-800 hover:bg-slate-200" href="/pricing">
              요금 안내
            </Link>
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-extrabold text-slate-900">알림</h2>
          <MypageMetricLine metric={bundle.notifications} />
          <p className="mt-2 text-sm text-slate-600">
            알림 센터 UI·읽음(is_read)·실시간은 이후. 지금은 테이블 count + 진입만 예약합니다.
          </p>
          <Link className="mt-2 inline-block text-sm font-bold text-blue-700 underline" href="/notifications">
            알림 센터
          </Link>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-extrabold text-slate-900">고객지원</h2>
          <p className="mt-1 text-sm text-slate-600">분쟁·환불 신청 내역(학생).</p>
          <Link className="mt-2 inline-block text-sm font-bold text-blue-700 underline" href="/support/disputes">
            분쟁·환불
          </Link>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-extrabold text-slate-900">리뷰 · 신고</h2>
          <MypageMetricLine metric={bundle.reviews} />
          <MypageMetricLine metric={bundle.reports} />
          <p className="mt-2 text-sm text-slate-600">
            작성 리뷰/제출한 신고 내역. 관리자 검수(어드민 /admin/reviews, /admin/reports)는 권한 분리 유지.
          </p>
          <div className="mt-2 text-xs text-slate-500">
            (학생) 전용 경로: 추후 <code className="rounded bg-slate-100 px-1">/mypage/reviews</code>, <code className="rounded bg-slate-100 px-1">/mypage/reports</code>{" "}
            — 라우트·화면은 다음 턴.
          </div>
        </section>
      </div>
    </div>
  );
}
