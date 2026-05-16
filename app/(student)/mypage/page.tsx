import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { loadStudentMypageBundle } from "@/lib/mypage/mypageQueries";
import { MypageMetricLine } from "@/components/mypage/MypageMetricLine";
import { StudentDashboardShell } from "@/components/mypage/StudentDashboardShell";

export default async function StudentMyPage() {
  const { user, profile, error: profileLoadError } = await getServerUserWithProfile();
  if (!user) {
    redirect(`/login/student?next=${encodeURIComponent("/mypage")}`);
  }

  const supabase = await createClient();
  const bundle = await loadStudentMypageBundle(
    supabase,
    user.id,
    profile,
    profileLoadError?.message ?? null
  );

  const { roomCount } = bundle;
  const roomText = roomCount.error
    ? "질문방 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
    : roomCount.n === 0
      ? "아직 열린 질문방이 없습니다. 멘토와 맺은 방이 여기에 이어집니다."
      : `연결된 질문방 ${roomCount.n}개입니다.`;

  return (
    <StudentDashboardShell
      activeTab="home"
      user={user}
      profile={profile}
      profileLoadError={profileLoadError?.message ?? null}
      bundle={bundle}
    >
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">마이페이지</h1>
          <p className="mt-1 text-sm text-slate-500">내 프로필, 구독, 질문방, 결제, 알림 현황을 한곳에서 보세요.</p>
        </header>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-24 transition hover:border-slate-300">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">내 질문방</p>
            <h3 className="text-xl font-black text-slate-900">{roomCount.n ?? 0} <span className="text-xs font-normal text-slate-400">개</span></h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-24 transition hover:border-slate-300">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">구독 중인 멘토</p>
            <h3 className="text-xl font-black text-slate-900">{bundle.subscriptions.valueText || "0"} <span className="text-xs font-normal text-slate-400">명</span></h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-24 transition hover:border-slate-300">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">결제 및 주문</p>
            <h3 className="text-xl font-black text-slate-900">{bundle.payments.valueText || "0"} <span className="text-xs font-normal text-slate-400">건</span></h3>
          </div>
        </div>

        {/* Section 1: 최근 질문 및 상담 */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[144px]">
          <div>
            <h2 className="text-base font-bold text-slate-900">최근 질문 및 상담</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed font-medium">{roomText}</p>
            {roomCount.error ? (
              <p className="mt-1 text-xs text-amber-800">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
            ) : null}
          </div>
          <div className="mt-3">
            <Link
              className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm select-none"
              href="/question-room"
            >
              질문방 바로가기
            </Link>
          </div>
        </section>

        {/* Section 2: Detailed Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <h2 className="text-base font-bold text-slate-900">구독 · 멤버십 관리</h2>
              <div className="mt-2">
                <MypageMetricLine metric={bundle.subscriptions} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 select-none">
              <Link className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm" href="/subscriptions">
                구독 관리
              </Link>
              <Link className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm" href="/mentors">
                멘토 찾기·구독
              </Link>
              <Link className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm" href="/subscribe/success">
                결제 완료 안내
              </Link>
              <Link className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm" href="/subscribe/failed">
                결제 실패 안내
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <h2 className="text-base font-bold text-slate-900">결제 · 캐시 정보</h2>
              <div className="mt-2">
                <MypageMetricLine metric={bundle.payments} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium leading-tight select-none">캐시 충전 및 이용 내역 바로가기</p>
            <div className="mt-4 flex flex-wrap gap-2 select-none">
              <Link className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm" href="/wallet/charge">
                캐시 충전
              </Link>
              <Link className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm" href="/wallet/ledger">
                캐시 원장
              </Link>
            </div>
          </section>
        </div>

        {/* Section 3: 알림 & 고객지원 & 리뷰 */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <h2 className="text-base font-bold text-slate-900">알림</h2>
              <MypageMetricLine metric={bundle.notifications} />
            </div>
            <div className="mt-4 select-none">
              <Link className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1" href="/notifications">
                알림 센터 &rarr;
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <h2 className="text-base font-bold text-slate-900">고객지원</h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">맞춤의뢰 진행 중 접수한 분쟁과 처리 상태를 확인할 수 있어요.</p>
            </div>
            <div className="mt-4 flex flex-col gap-2 select-none">
              <Link className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1" href="/support/disputes">
                분쟁·환불 현황 &rarr;
              </Link>
              <Link className="text-xs font-bold text-blue-600 hover:underline" href="/support/reports">
                내 신고 내역
              </Link>
              <Link className="text-xs font-bold text-blue-600 hover:underline" href="/support/refunds">
                환불 요청 안내
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[160px] md:col-span-2 lg:col-span-1">
            <div>
              <h2 className="text-base font-bold text-slate-900">리뷰 · 신고</h2>
              <MypageMetricLine metric={bundle.reviews} />
              <MypageMetricLine metric={bundle.reports} />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight mt-2 select-none">작성한 리뷰와 제출한 신고는 운영 정책에 따라 안내됩니다.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/legal/terms" className="text-xs font-bold text-slate-600 underline">
                약관 안내
              </Link>
              <Link href="/custom-request" className="text-xs font-bold text-slate-600 underline">
                맞춤의뢰
              </Link>
            </div>
          </section>
        </div>
      </div>
    </StudentDashboardShell>
  );
}
