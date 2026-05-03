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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column: Profile & Menu Navigation Links */}
      <div className="md:col-span-1 space-y-6">
        <ProfileSummaryCard
          profile={bundle.profile}
          fallbackEmail={sessionEmail}
          profileError={bundle.profileError}
          areaRole="student"
        />

        <nav className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">마이페이지 메뉴</p>
          <Link href="/home" className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition duration-150">
            🏠 <span className="flex-1">학생 홈</span>
          </Link>
          <Link href="/question-room" className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition duration-150">
            💬 <span className="flex-1">질문방 바로가기</span>
          </Link>
          <Link href="/subscriptions" className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition duration-150">
            📅 <span className="flex-1">구독 및 멤버십</span>
          </Link>
          <Link href="/wallet/charge" className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition duration-150">
            💰 <span className="flex-1">캐시 충전</span>
          </Link>
          <Link href="/support/disputes" className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition duration-150">
            ⚠️ <span className="flex-1">분쟁·환불 현황</span>
          </Link>
        </nav>
      </div>

      {/* Right Column: Dashboard Main Content */}
      <div className="md:col-span-2 space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-32">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">내 질문방</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{roomCount.n ?? 0} <span className="text-sm font-normal text-slate-500">개</span></h3>
            </div>
            <Link href="/question-room" className="text-xs font-bold text-blue-600 hover:underline">질문하러 가기 &rarr;</Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-32">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">구독 중인 멘토</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{bundle.subscriptions.valueText || "0"} <span className="text-sm font-normal text-slate-500">명</span></h3>
            </div>
            <Link href="/mentors" className="text-xs font-bold text-blue-600 hover:underline">멘토 찾기 &rarr;</Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-32">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">결제 및 주문</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{bundle.payments.valueText || "0"} <span className="text-sm font-normal text-slate-500">건</span></h3>
            </div>
            <Link href="/custom-request/orders" className="text-xs font-bold text-blue-600 hover:underline">내 의뢰 확인 &rarr;</Link>
          </div>
        </div>

        {/* Section 1: Questions & Consultations */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">최근 질문 및 상담</h2>
            <p className="mt-2 text-sm text-slate-600">{roomText}</p>
            {roomCount.error ? (
              <p className="mt-1 text-xs text-amber-800">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
            ) : null}
          </div>
          <div className="mt-4">
            <Link
              className="inline-block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm"
              href="/question-room"
            >
              질문방 바로가기
            </Link>
          </div>
        </section>

        {/* Section 2: Detailed Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">구독 · 멤버십 관리</h2>
            <div className="mt-2">
              <MypageMetricLine metric={bundle.subscriptions} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm" href="/subscriptions">
                구독 관리
              </Link>
              <Link className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm" href="/mentors">
                멘토 찾기·구독
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">결제 · 캐시 정보</h2>
            <div className="mt-2">
              <MypageMetricLine metric={bundle.payments} />
            </div>
            <p className="text-xs text-slate-500 mt-2">캐시 충전 및 이용 내역 바로가기</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm" href="/wallet/charge">
                캐시 충전
              </Link>
              <Link className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm" href="/wallet/ledger">
                캐시 원장
              </Link>
              <Link className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm" href="/pricing">
                요금 안내
              </Link>
            </div>
          </section>
        </div>

        {/* Section 3: 알림 / 고객지원 / 리뷰 */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <h2 className="text-base font-bold text-slate-900">알림</h2>
              <MypageMetricLine metric={bundle.notifications} />
            </div>
            <div className="mt-3">
              <Link className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1" href="/notifications">
                알림 센터 &rarr;
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <h2 className="text-base font-bold text-slate-900">고객지원</h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">맞춤의뢰 진행 중 접수한 분쟁과 처리 상태를 확인할 수 있어요.</p>
            </div>
            <div className="mt-3">
              <Link className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1" href="/support/disputes">
                분쟁·환불 현황 &rarr;
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <h2 className="text-base font-bold text-slate-900">리뷰 · 신고</h2>
              <MypageMetricLine metric={bundle.reviews} />
              <MypageMetricLine metric={bundle.reports} />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight mt-2">작성한 리뷰와 제출한 신고는 운영 정책에 따라 안내됩니다.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
