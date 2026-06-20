/** 멘토 정산 UI·API 공용 타입 — server-only 모듈 import 금지 */

export type PayoutLineType = "subscription" | "custom_request";

export type MentorPayoutDetailLine = {
  id: string;
  type: PayoutLineType;
  date: string;
  description: string;
  paymentAmount: number;
  feeAmount: number;
  netAmount: number;
  status: string;
};

export type MentorPayoutMonthlyCard = {
  yearMonth: string;
  label: string;
  revenue: number;
  scheduledPayout: number;
  status: "paid" | "scheduled";
};

export type MentorPayoutSummary = {
  thisMonthRevenue: number;
  thisMonthScheduledPayout: number;
  thisMonthSubscription: number;
  thisMonthCustomRequest: number;
  lifetimeSubscription: number;
  lifetimeCustomRequest: number;
  bankDisplay: string;
  bankEditable: boolean;
  bankName: string | null;
  bankAccountNumber: string | null;
};

export type MentorPayoutDetailResult = {
  lines: MentorPayoutDetailLine[];
  totals: {
    paymentAmount: number;
    feeAmount: number;
    netAmount: number;
  };
};

export type PayoutUiStatus = "paid" | "scheduled" | "hold" | "cancelled";

export type MentorPayoutSettlementTableRow = {
  id: string;
  date: string;
  type: PayoutLineType;
  description: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  uiStatus: PayoutUiStatus;
  isCancelled: boolean;
};

export type MentorPayoutPerformanceRow = {
  id: string;
  date: string;
  type: PayoutLineType;
  title: string;
  studentName: string;
  amount: number;
  uiStatus: "done" | "in_progress" | "cancelled";
};

export type MentorPayoutScheduleInfo = {
  nextPayoutDateIso: string;
  nextPayoutLabel: string;
  monthProgressPct: number;
  monthLabel: string;
  completedPayoutAmount: number;
  expectedPayoutAmount: number;
};

export type MentorPayoutsPageData = {
  summary: MentorPayoutSummary;
  months: MentorPayoutMonthlyCard[];
  schedule: MentorPayoutScheduleInfo;
  revenueShare: {
    subscription: number;
    customRequest: number;
    total: number;
    subscriptionPct: number;
    customRequestPct: number;
  };
  kpis: {
    subscription: { amount: number; momPct: number | null };
    customRequest: { amount: number; momPct: number | null };
    total: { amount: number; momPct: number | null };
    lifetimePaid: number;
  };
  settlementLines: MentorPayoutSettlementTableRow[];
  performanceLines: MentorPayoutPerformanceRow[];
  defaultMonth: string;
};
