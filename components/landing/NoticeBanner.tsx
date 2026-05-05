"use client";

import { useState } from "react";
import Link from "next/link";

export function NoticeBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative w-full bg-[#f4f7ff] py-2 px-4">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 text-center">
        <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
          공지
        </span>
        <p className="text-[13px] font-semibold text-slate-800">
          6월 모의고사 직후 출시 기념! 지금 가입하면 1주일 무료 + 무료 15질문 제공
        </p>
        <Link 
          href="/notices/1" 
          className="inline-flex items-center text-[13px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          자세히 보기
          <svg viewBox="0 0 20 20" fill="currentColor" className="ml-1 h-4 w-4">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="닫기"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}
