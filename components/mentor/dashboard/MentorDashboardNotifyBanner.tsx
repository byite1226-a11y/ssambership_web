import Link from "next/link";

export function MentorDashboardNotifyBanner() {
  return (
    <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900">새로운 의뢰 알림을 설정해보세요!</h3>
          <p className="mt-2 text-sm text-slate-600">
            원하는 분야의 새 의뢰가 등록되면 알림을 받아 빠르게 대응하세요.
          </p>
        </div>
        <Link
          href="/notifications"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#1A56DB] px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
        >
          알림 설정하기 &gt;
        </Link>
      </div>
    </section>
  );
}
