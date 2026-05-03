import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { loadStudentMypageBundle } from "@/lib/mypage/mypageQueries";
import { StudentDashboardShell } from "@/components/mypage/StudentDashboardShell";

export default async function StudentSubscriptionsPage() {
  const { user, profile, error: profileLoadError } = await getServerUserWithProfile();
  if (!user) {
    redirect(`/login/student?next=${encodeURIComponent("/subscriptions")}`);
  }

  const supabase = await createClient();
  const bundle = await loadStudentMypageBundle(
    supabase,
    user.id,
    profile,
    profileLoadError?.message ?? null
  );

  return (
    <StudentDashboardShell
      activeTab="subscriptions"
      user={user}
      profile={profile}
      profileLoadError={profileLoadError?.message ?? null}
      bundle={bundle}
    >
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">구독 현황</h1>
          <p className="mt-1 text-sm text-slate-500">내가 구독 중인 멘토 플랜 및 갱신 일정을 확인하세요.</p>
        </header>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-24">
            <p className="text-xs font-bold text-slate-500 uppercase">구독 중인 멘토</p>
            <h3 className="text-xl font-black text-slate-900">{bundle.subscriptions.valueText || "0"} <span className="text-xs font-normal text-slate-400">명</span></h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-24">
            <p className="text-xs font-bold text-slate-500 uppercase">이번 달 결제 금액</p>
            <h3 className="text-xl font-black text-slate-900">— <span className="text-xs font-normal text-slate-400">원</span></h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-24">
            <p className="text-xs font-bold text-slate-500 uppercase">구독 만료 예정</p>
            <h3 className="text-xl font-black text-slate-900">— <span className="text-xs font-normal text-slate-400">건</span></h3>
          </div>
        </div>

        {/* Tab Menu */}
        <div className="border-b border-slate-200 flex gap-1 select-none">
          <span className="px-4 py-2 text-sm font-extrabold border-b-2 border-blue-600 text-blue-600 cursor-pointer">
            전체
          </span>
          <span className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer transition">
            구독 중
          </span>
          <span className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer transition">
            만료 예정
          </span>
          <span className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer transition">
            만료됨
          </span>
        </div>

        {/* Empty State / Subscription Content card */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm text-center space-y-4">
          <div className="flex justify-center text-slate-200 text-5xl mb-1">📄</div>
          <h3 className="text-base font-bold text-slate-900">이용 중인 정기 구독이 없습니다</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            아직 구독 중인 멘토의 플랜이 없습니다. 내 상황과 목표에 딱 맞는 멘토 플랜을 시작해 보세요.
          </p>
          <div className="pt-3">
            <Link href="/mentors" className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm">
              멘토 찾기 및 구독
            </Link>
          </div>
        </section>

        {/* Bottom Details Card */}
        <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <h4 className="text-xs font-bold text-slate-800">💡 구독 시 유의 사항</h4>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-500 leading-relaxed">
            <li>정기 구독은 이용 기간 만료 시 자동 결제가 진행됩니다.</li>
            <li>구독 해지는 만료일 24시간 전까지 신청할 수 있습니다.</li>
            <li>환불 규정은 서비스 이용약관 및 운영 정책에 따릅니다.</li>
          </ul>
        </section>
      </div>
    </StudentDashboardShell>
  );
}
