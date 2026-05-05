"use client";

import Link from "next/link";
import type { PublicMentorsListResult, MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";

export function RecommendedMentorsSection(props: { data?: PublicMentorsListResult }) {
  const mentors = props.data?.cards || [];

  if (mentors.length === 0) {
    return (
      <section className="py-16">
        <div className="rounded-3xl bg-slate-50 p-10 text-center">
          <h2 className="text-[24px] font-black text-slate-900 tracking-tight mb-4">나에게 맞는 멘토를 찾아보세요</h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">전공과목별 현직 대학생 멘토들이 여러분의 질문을 기다리고 있습니다.</p>
          <Link href="/mentors" className="inline-flex rounded-xl bg-[#3b66f5] px-8 py-3.5 text-white font-bold hover:bg-[#2d52d1] transition-colors">
            멘토 보러가기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-[24px] font-black text-slate-900 tracking-tight">추천 멘토</h2>
        <Link href="/mentors" className="text-[14px] font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1">
          전체보기
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {mentors.map((m: MentorPublicListCard) => (
            <Link key={m.mentorId} href={`/mentors/${m.mentorId}`} className="group rounded-3xl border border-slate-100 bg-white p-5 transition-all hover:shadow-2xl hover:shadow-slate-200/50">
              <div className="relative mb-4 flex justify-center">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-slate-50 shadow-sm transition-transform group-hover:scale-105 bg-slate-100 flex items-center justify-center text-slate-300">
                  {m.display.photoUrl ? (
                    <img 
                      src={m.display.photoUrl} 
                      alt={m.display.displayName || "멘토"} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </div>
                <div className="absolute -right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm ring-2 ring-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <h4 className="text-[16px] font-black text-slate-800 flex items-center justify-center gap-1">
                  {m.display.displayName || "멘토"}
                </h4>
                <p className="mt-1 text-[13px] font-bold text-slate-500">
                  {m.display.university || "대학생 멘토"}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center border-t border-slate-50 pt-4">
                 <span className="text-[13px] font-bold text-blue-600">상세 프로필 보기</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
