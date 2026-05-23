/** 멘토 통합 대시보드 — 클라이언트·서버 공용 타입 */

export type MentorHubCategorySlice = {
  id: "study" | "career" | "essay" | "other";
  label: string;
  count: number;
  pct: number;
  color: string;
};

export type MentorHubKeywordRow = {
  rank: number;
  keyword: string;
  count: number;
};

export type MentorHubOrderRow = {
  id: string;
  title: string;
  categoryLabel: string;
  studentName: string;
  studentInitial: string;
  dday: string;
  ddayUrgent: boolean;
  deadlineDate: string;
  statusLabel: string;
  statusClassName: string;
  recentActivity: string;
  workroomHref: string;
};

export type MentorHubScheduleItem = {
  id: string;
  kind: "order" | "question";
  title: string;
  badgeLabel: string;
  badgeClassName: string;
  meta: string;
  href: string;
  urgent: boolean;
};

export type MentorHubDashboardData = {
  kpis: {
    newQuestions: number;
    activeSubscribers: number;
    newRequestsOpen: number;
    newRequestsToday: number;
    monthlyRevenue: number;
    monthlyRevenueMomPct: number | null;
    avgRating: number | null;
    reviewCount: number;
  };
  activeOrders: MentorHubOrderRow[];
  openPosts: {
    total: number;
    categories: MentorHubCategorySlice[];
  };
  topKeywords: MentorHubKeywordRow[];
  todaySchedule: MentorHubScheduleItem[];
  revenuePanel: {
    monthLabel: string;
    totalExpected: number;
    inProgress: number;
    completedPending: number;
  };
  rating: {
    avg: number | null;
    count: number;
  };
};
