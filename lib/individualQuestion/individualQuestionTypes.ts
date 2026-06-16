export const INDIVIDUAL_QUESTION_TYPES = ["direct", "open"] as const;

export type IndividualQuestionType = (typeof INDIVIDUAL_QUESTION_TYPES)[number];

export const INDIVIDUAL_QUESTION_STATUSES = [
  "escrowed",
  "assigned",
  "open",
  "claimed",
  "answered",
  "released",
  "expired",
  "refunded",
  "canceled",
] as const;

export type IndividualQuestionStatus = (typeof INDIVIDUAL_QUESTION_STATUSES)[number];

export type IndividualQuestionEscrowResult = {
  ok: boolean;
  code: string;
  message: string | null;
  question_id: string | null;
  status: IndividualQuestionStatus | string | null;
  ledger_id: string | null;
  wallet_balance_cents: number | null;
};

export type MentorIndividualQuestionPricingRow = {
  mentor_id: string;
  amount_cents: number;
  updated_at?: string | null;
};

export const INDIVIDUAL_QUESTION_LEDGER_REASONS = {
  hold: "individual_question_escrow_hold",
  payout: "individual_question_payout",
  refund: "individual_question_refund",
} as const;

// 금액 자유화: 최소/최대 강제 없음(0·음수만 차단). 작성 폼 placeholder 예시값만 둔다(강제 아님).
export const OPEN_INDIVIDUAL_QUESTION_PRICE_PLACEHOLDER_CASH = 5000;
