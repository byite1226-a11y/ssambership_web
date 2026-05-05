"use client";

import { UserRow } from "@/lib/types/user";

export function DashboardStatsSection(props: { profile: UserRow | null }) {
  const isMentor = props.profile?.role === "mentor";

  // Role-specific stats configuration
  const studentStats = [
    { 
      label: "내 질문 수", 
      value: "—", 
      unit: "개", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
      color: "bg-blue-50 text-blue-500" 
    },
    { 
      label: "답변 받은 수", 
      value: "—", 
      unit: "개", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
      color: "bg-indigo-50 text-indigo-500" 
    },
    { 
      label: "연결된 멘토", 
      value: "—", 
      unit: "명", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
      color: "bg-blue-50 text-blue-500" 
    },
    { 
      label: "보유 캐시", 
      value: "—", 
      unit: "원", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
      color: "bg-indigo-50 text-indigo-500" 
    },
    { 
      label: "찜한 멘토", 
      value: "—", 
      unit: "명", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
      color: "bg-blue-50 text-blue-500" 
    },
    { 
      label: "진행 중 의뢰", 
      value: "—", 
      unit: "건", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /></svg>,
      color: "bg-indigo-50 text-indigo-500" 
    },
  ];

  const mentorStats = [
    { 
      label: "답변 대기 질문", 
      value: "—", 
      unit: "개", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
      color: "bg-orange-50 text-orange-500" 
    },
    { 
      label: "학생 확인 대기", 
      value: "—", 
      unit: "개", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></svg>,
      color: "bg-blue-50 text-blue-500" 
    },
    { 
      label: "완료 질문", 
      value: "—", 
      unit: "개", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
      color: "bg-green-50 text-green-500" 
    },
    { 
      label: "연결 학생", 
      value: "—", 
      unit: "명", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
      color: "bg-blue-50 text-blue-500" 
    },
    { 
      label: "진행 중 의뢰", 
      value: "—", 
      unit: "건", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /></svg>,
      color: "bg-indigo-50 text-indigo-500" 
    },
    { 
      label: "정산 확인", 
      value: "—", 
      unit: "원", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><path d="M7 15h0M12 15h0M17 15h0" /></svg>,
      color: "bg-green-50 text-green-500" 
    },
  ];

  const stats = isMentor ? mentorStats : studentStats;

  return (
    <div className="py-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-4 rounded-3xl bg-[#f8faff] p-5 border border-blue-50">
          <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${s.color}`}>
            {s.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-slate-400 truncate">{s.label}</p>
            <p className="text-[18px] font-black text-slate-800 tracking-tight whitespace-nowrap">
              {s.value}<span className="text-[13px] font-bold text-slate-400 ml-0.5">{s.unit}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
