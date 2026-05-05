import Link from "next/link";
import type { NoticeBannerLoad } from "@/lib/landing/landingPageQueries";

export function FeatureAndNoticeSection(props: { notices?: NoticeBannerLoad }) {
  const latestNotice = props.notices?.rows?.[0];
  const noticeTitle = latestNotice ? (String(latestNotice.title || latestNotice.name)) : "공지사항이 없습니다.";
  const noticeDesc = latestNotice ? (String(latestNotice.content || "자세한 내용을 확인하려면 클릭하세요.")) : "등록된 새로운 소식이 없습니다.";

  const features = [
    {
      title: "1:1 맞춤 멘토링",
      desc: "전공·과목별 현직 대학생 멘토와 연결",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      title: "무제한 질문",
      desc: "궁금한 건 언제든 질문하세요",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        </svg>
      ),
    },
    {
      title: "연결노트 제공",
      desc: "내 공부 흐름을 한눈에 정리",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      ),
    },
    {
      title: "안전한 환경",
      desc: "검증된 멘토와 안전한 결제 시스템",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 flex flex-col lg:flex-row gap-6">
      {/* Notice Card */}
      <div className="lg:w-[420px] rounded-3xl bg-[#f8faff] p-8 border border-blue-50 flex items-start gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-blue-500">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
             <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
             <path d="M13.73 21a2 2 0 0 1-3.46 0" />
           </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-bold text-slate-400">공지사항</p>
            <Link href="/notices" className="text-[13px] font-bold text-blue-500 hover:underline inline-flex items-center">
              자세히 보기
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          <h3 className="mt-2 text-[18px] font-black text-slate-800 leading-tight line-clamp-2">
            {noticeTitle}
          </h3>
          <p className="mt-2 text-[14px] font-medium text-slate-500 leading-relaxed line-clamp-2">
            {noticeDesc}
          </p>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <div key={i} className="rounded-3xl border border-slate-100 bg-white p-6 transition-all hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 mb-4">
              {f.icon}
            </div>
            <h4 className="text-[16px] font-black text-slate-800">{f.title}</h4>
            <p className="mt-1 text-[13px] font-medium text-slate-500 leading-snug">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
