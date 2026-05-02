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
    ? "질문방 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
    : roomCount.n === 0
      ? "아직 열린 질문방이 없습니다. 멘토와 맺은 방이 여기에 이어집니다."
      : `연결된 질문방 ${roomCount.n}개입니다.`;

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
          {roomCount.error ? (
            <p className="mt-1 text-xs text-amber-800">정보를 잠시 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.</p>
          ) : null}
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
          <p className="text-xs text-slate-500">캐시 충전·사용 내역은 아래 메뉴에서 확인할 수 있어요.</p>
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
          <p className="mt-2 text-sm text-slate-600">읽음 처리·실시간 알림은 순차적으로 제공될 예정이에요.</p>
          <Link className="mt-2 inline-block text-sm font-bold text-blue-700 underline" href="/notifications">
            알림 센터
          </Link>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-extrabold text-slate-900">고객지원</h2>
          <p className="mt-1 text-sm text-slate-600">맞춤의뢰 진행 중 접수한 분쟁과 처리 상태를 확인할 수 있어요.</p>
          <Link className="mt-2 inline-block text-sm font-bold text-blue-700 underline" href="/support/disputes">
            분쟁·환불 현황
          </Link>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-extrabold text-slate-900">리뷰 · 신고</h2>
          <MypageMetricLine metric={bundle.reviews} />
          <MypageMetricLine metric={bundle.reports} />
          <p className="mt-2 text-sm text-slate-600">작성한 리뷰와 제출한 신고는 운영 정책에 따라 별도 화면에서 안내될 예정이에요.</p>
        </section>
      </div>
    </div>
  );
}
