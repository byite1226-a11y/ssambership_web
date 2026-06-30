import Link from "next/link";
import type { MentorHubOrderRow } from "@/lib/mentor/dashboard/mentorHubDashboardTypes";

export function MentorDashboardActiveOrdersTable(props: { orders: MentorHubOrderRow[] }) {
  const { orders } = props;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-[15px] font-black text-slate-900">진행 중 의뢰</h2>
        <Link
          href="/mentor/custom-request/orders"
          className="text-[12px] font-bold text-[#059669] hover:underline"
        >
          전체 보기 &gt;
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <div className="col-span-4 lg:col-span-5">의뢰 제목</div>
        <div className="col-span-2">학생</div>
        <div className="col-span-2">마감일</div>
        <div className="col-span-2 text-center">진행 단계</div>
        <div className="col-span-2 text-right lg:col-span-1">최근 활동</div>
      </div>

      {orders.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-[13px] font-bold text-slate-600">아직 진행 중인 의뢰가 없어요</p>
          <Link
            href="/mentor/custom-request/posts"
            className="mt-3 inline-block text-[12px] font-bold text-[#059669] hover:underline"
          >
            의뢰 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={order.workroomHref}
                className="group grid grid-cols-12 items-center gap-2 px-5 py-3.5 transition hover:bg-slate-50/60"
              >
                <div className="col-span-4 min-w-0 lg:col-span-5">
                  <p className="truncate text-[13px] font-bold text-slate-900 group-hover:text-[#059669]">
                    {order.title}
                  </p>
                  <span className="mt-1 inline-block rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {order.categoryLabel}
                  </span>
                </div>
                <div className="col-span-2 flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] text-[11px] font-black text-[#059669]">
                    {order.studentInitial}
                  </span>
                  <p className="truncate text-[12px] text-slate-600">{order.studentName}</p>
                </div>
                <div className="col-span-2">
                  <p
                    className={`text-[12px] font-bold ${order.ddayUrgent ? "text-red-500" : "text-slate-600"}`}
                  >
                    {order.dday}
                  </p>
                  {order.deadlineDate ? (
                    <p className="text-[10px] text-slate-400">{order.deadlineDate}</p>
                  ) : null}
                </div>
                <div className="col-span-2 flex justify-center">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${order.statusClassName}`}
                  >
                    {order.statusLabel}
                  </span>
                </div>
                <div className="col-span-2 text-right lg:col-span-1">
                  <p className="text-[11px] text-slate-400">{order.recentActivity}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
