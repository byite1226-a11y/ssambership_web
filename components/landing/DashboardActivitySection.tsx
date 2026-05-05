"use client";

import Link from "next/link";

export function DashboardActivitySection() {
  return (
    <section className="py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* My Questions */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col min-h-[300px]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[17px] font-black text-slate-800">내 질문 현황</h3>
          <Link href="/mypage/questions" className="text-[13px] font-bold text-blue-500 hover:underline">전체보기 &gt;</Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
               <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
             </svg>
          </div>
          <p className="text-[14px] font-bold text-slate-400">등록된 질문이 없습니다.</p>
          <p className="text-[12px] font-medium text-slate-300 mt-1">멘토에게 궁금한 것을 물어보세요!</p>
        </div>
      </div>

      {/* Announcements */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col min-h-[300px]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[17px] font-black text-slate-800">공지사항</h3>
          <Link href="/notices" className="text-[13px] font-bold text-blue-500 hover:underline">전체보기 &gt;</Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
               <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
               <path d="M13.73 21a2 2 0 0 1-3.46 0" />
             </svg>
          </div>
          <p className="text-[14px] font-bold text-slate-400">새로운 공지사항이 없습니다.</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col min-h-[300px]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[17px] font-black text-slate-800">최근 활동</h3>
          <Link href="/mypage/activity" className="text-[13px] font-bold text-blue-500 hover:underline">전체보기 &gt;</Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
               <path d="M12 8v4l3 3" />
               <circle cx="12" cy="12" r="10" />
             </svg>
          </div>
          <p className="text-[14px] font-bold text-slate-400">최근 활동 내역이 없습니다.</p>
        </div>
      </div>
    </section>
  );
}
