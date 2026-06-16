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

// 단위: 캐시(=원). 저장 시 ×100 하여 cents 로 변환(amountCentsFromCashKrw). 표시는 캐시 그대로.
export const OPEN_INDIVIDUAL_QUESTION_MIN_PRICE_CASH = 1000;
export const OPEN_INDIVIDUAL_QUESTION_GUIDE_MIN_CASH = 5000;
export const OPEN_INDIVIDUAL_QUESTION_GUIDE_MAX_CASH = 30000;
