import Link from "next/link";
import React from "react";

interface UserLike {
  email?: string | null;
}
interface ProfileLike {
  full_name?: string | null;
  nickname?: string | null;
  email?: string | null;
  grade_level?: string | null;
  student_status?: string | null;
}
interface BundleLike {
  payments: { valueText: string };
}

type Props = {
  activeTab: "home" | "subscriptions" | "wallet" | "questions" | "custom" | "notifications" | "support";
  user: UserLike | null;
  profile: ProfileLike | null;
  profileLoadError: string | null;
  bundle: BundleLike;
  cashBalanceKrw?: number;
  children: React.ReactNode;
};

export function StudentDashboardShell({
  activeTab,
  user,
  profile,
  profileLoadError,
  bundle,
  cashBalanceKrw = 0,
  children,
}: Props) {
  const name = profile?.full_name?.trim() || profile?.nickname?.trim() || user?.email || "—";
  const emailLine = profile?.email?.trim() || user?.email || "";
  const schoolLine = profile?.grade_level?.trim() || "";
  const paymentCount = bundle?.payments?.valueText || "0";

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-8 antialiased">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Sidebar */}
        <aside className="lg:col-span-1 space-y-5">
          {/* Profile Block Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">마이페이지</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xl font-bold text-blue-600 select-none flex-shrink-0">
                {name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight truncate">{name}</h3>
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-100 flex-shrink-0">
                    학생
                  </span>
                </div>
                {emailLine ? (
                  <p className="mt-1 text-xs text-slate-500 font-medium truncate leading-tight">{emailLine}</p>
                ) : null}
                {schoolLine ? (
                  <p className="text-xs text-slate-500 font-medium truncate leading-tight">{schoolLine}</p>
                ) : null}
              </div>
            </div>
            <Link href="/mypage" className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5 select-none">
              프로필 보기 &gt;
            </Link>
            {profileLoadError ? (
              <p className="mt-2 text-xs font-semibold text-amber-600 leading-tight">{profileLoadError}</p>
            ) : null}
          </section>

          {/* Vertical Menu Navigation */}
          <nav className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm space-y-1">
            <Link 
              href="/home" 
              className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition duration-150 ${activeTab === "support" && false ? "bg-blue-50 text-blue-700 font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              🏠 <span>홈</span>
            </Link>
            <Link 
              href="/mypage" 
              className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold rounded-xl transition duration-150 ${activeTab === "home" ? "bg-blue-50 text-blue-700 font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              📑 <span>마이페이지</span>
            </Link>
            <Link 
              href="/subscriptions" 
              className={`flex items-center justify-between px-3.5 py-2.5 text-sm font-bold rounded-xl transition duration-150 ${activeTab === "subscriptions" ? "bg-blue-50 text-blue-700 font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <div className="flex items-center gap-3">
                📅 <span>구독 현황</span>
              </div>
            </Link>
            <Link 
              href="/wallet/charge" 
              className={`flex items-center justify-between px-3.5 py-2.5 text-sm font-bold rounded-xl transition duration-150 ${activeTab === "wallet" ? "bg-blue-50 text-blue-700 font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <div className="flex items-center gap-3">
                💰 <span>내 캐시</span>
              </div>
              <span className="text-xs font-semibold text-slate-400">{paymentCount}건</span>
            </Link>
            <Link 
              href="/question-room" 
              className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold rounded-xl transition duration-150 ${activeTab === "questions" ? "bg-blue-50 text-blue-700 font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              💬 <span>내 질문 & 답변</span>
            </Link>
            <Link 
              href="/custom-request/orders" 
              className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold rounded-xl transition duration-150 ${activeTab === "custom" ? "bg-blue-50 text-blue-700 font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              📋 <span>맞춤의뢰 내역</span>
            </Link>
            <Link 
              href="/notifications" 
              className={`flex items-center justify-between px-3.5 py-2.5 text-sm font-bold rounded-xl transition duration-150 ${activeTab === "notifications" ? "bg-blue-50 text-blue-700 font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <div className="flex items-center gap-3">
                🔔 <span>알림</span>
              </div>
              <span className="rounded-full bg-red-500 w-2 h-2"></span>
            </Link>
            <Link 
              href="/support/disputes" 
              className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold rounded-xl transition duration-150 ${activeTab === "support" ? "bg-blue-50 text-blue-700 font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              ⚠️ <span>분쟁·환불 현황</span>
            </Link>
          </nav>

          {/* Additional bottom sidebar cards exactly matching reference */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 space-y-3">
            <h4 className="text-sm font-extrabold text-blue-900 leading-tight">더 현명하게<br />질문하고 성장하세요!</h4>
            <p className="text-xs text-blue-700 leading-relaxed">구독 중인 멘토에게 질문하고 빠른 답변을 받아보세요.</p>
            <Link href="/question-room" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm w-full select-none">
              질문하러 가기 &gt;
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">고객센터</h4>
            <p className="text-xs text-slate-600 font-medium">문의는 언제나 환영이에요.</p>
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <Link href="/support/disputes" className="flex items-center justify-between text-xs font-bold text-slate-700 hover:text-blue-600 transition">
                <span>1:1 문의하기</span> <span className="text-slate-400 font-normal">&gt;</span>
              </Link>
              <Link href="/support/faq" className="flex items-center justify-between text-xs font-bold text-slate-700 hover:text-blue-600 transition">
                <span>자주 묻는 질문 (FAQ)</span> <span className="text-slate-400 font-normal">&gt;</span>
              </Link>
            </div>
          </section>
        </aside>

        {/* Center content flexible area */}
        <div className="lg:col-span-2 min-w-0">
          {children}
        </div>

        {/* Right Rail Sidebar Column */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Cash Status Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">내 캐시</p>
              <h3 className="mt-2 text-3xl font-black text-[#1A56DB]">
                {cashBalanceKrw.toLocaleString("ko-KR")}
                <span className="ml-1 text-sm font-bold text-slate-500">캐시</span>
              </h3>
              <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                <span>{paymentCount}건</span>
                <Link href="/wallet/ledger" className="text-[#1A56DB] hover:underline">
                  충전 내역 &gt;
                </Link>
              </p>
            </div>
            <Link href="/wallet/charge" className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm w-full select-none text-center">
              캐시 충전하기
            </Link>
          </section>

          {/* Promotional / Soft info Card */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6 flex flex-col justify-between min-h-[180px]">
            <div>
              <h4 className="text-base font-extrabold text-blue-900 select-none">활동할수록<br />성장이 가속돼요!</h4>
              <p className="mt-1.5 text-xs text-blue-700 leading-relaxed">
                질문, 답변, 리뷰를 남기고 쌤버십에서 더 많은 성장 경험을 쌓아보세요.
              </p>
            </div>
            <div className="flex justify-center mt-3 text-4xl select-none leading-none">🏆</div>
          </section>
        </aside>

      </div>
    </div>
  );
}
