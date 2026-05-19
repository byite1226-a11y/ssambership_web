import Link from "next/link";
import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";

/**
 * 멘토 목록 우측: 안내, 인기 태그, CTA — 더미 멘토 없이 실제 카드에서만 집계.
 */
export function MentorsListSidebar(props: { cards: MentorPublicListCard[] }) {

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="space-y-5">
      <div className="rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-md sm:p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/80">시작하기</p>
        <h2 className="mt-2 text-xl font-black leading-tight">멘토와 연결해 보세요</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-blue-50">
          프로필에서 구독·질문방으로 이어질 수 있어요. 학생 계정으로 로그인하면 질문방이 열려요.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={`/login/student?next=${encodeURIComponent("/mentors")}`}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-4 text-sm font-extrabold text-blue-800 shadow-sm transition hover:bg-blue-50"
          >
            학생 로그인
          </Link>
          <Link
            href="/question-room"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-white/40 px-4 text-sm font-extrabold text-white transition hover:bg-white/10"
          >
            내 질문방
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5">
        <h2 className="text-sm font-black text-slate-900 mb-3">이용 안내</h2>
        <ol className="list-decimal list-inside space-y-2 text-xs font-bold text-slate-600">
          <li>멘토 프로필 확인</li>
          <li>요금제 선택</li>
          <li>구독 결제</li>
          <li>질문방에서 질문 시작</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 p-4 sm:p-5">
        <h2 className="text-sm font-black text-slate-900">찜한 멘토</h2>
        <p className="mt-2 text-sm text-slate-600">
          찜·알림은 아직 연결되지 않았어요. <span className="font-bold text-slate-800">준비 중</span>입니다.
        </p>
        <span
          className="mt-4 inline-flex w-full min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-400"
          title="다음 릴리스에서 제공할 예정입니다"
          role="status"
        >
          ♥ 찜하기 (준비 중)
        </span>
      </div>
      </div>
    </div>
  );
}
