import type { MentorHubDashboardData } from "@/lib/mentor/dashboard/mentorHubDashboardTypes";
import { MentorDashboardActiveOrdersTable } from "./MentorDashboardActiveOrdersTable";
import { MentorDashboardKeywordsList } from "./MentorDashboardKeywordsList";
import { MentorDashboardKpiCards } from "./MentorDashboardKpiCards";
import { MentorDashboardNotifyBanner } from "./MentorDashboardNotifyBanner";
import { MentorDashboardOpenPostsDonut } from "./MentorDashboardOpenPostsDonut";
import { MentorDashboardRightPanel } from "./MentorDashboardRightPanel";
import { MentorDashboardSideNav } from "./MentorDashboardSideNav";

export function MentorDashboardPage(props: { data: MentorHubDashboardData }) {
  const { data } = props;

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">멘토 대시보드</h1>
        <p className="mt-1 text-sm text-slate-500">질문방 · 맞춤의뢰 · 수익을 한눈에 확인하세요</p>
      </header>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <MentorDashboardSideNav />

        <main className="min-w-0 flex-1 space-y-6">
          <MentorDashboardKpiCards kpis={data.kpis} />
          <MentorDashboardActiveOrdersTable orders={data.activeOrders} />

          <div className="grid gap-4 lg:grid-cols-2">
            <MentorDashboardOpenPostsDonut total={data.openPosts.total} categories={data.openPosts.categories} />
            <MentorDashboardKeywordsList keywords={data.topKeywords} />
          </div>

          <MentorDashboardNotifyBanner />
        </main>

        <MentorDashboardRightPanel
          todaySchedule={data.todaySchedule}
          revenuePanel={data.revenuePanel}
          rating={data.rating}
        />
      </div>
    </div>
  );
}
