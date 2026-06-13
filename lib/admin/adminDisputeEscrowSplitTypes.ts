/** 관리자 분쟁 상세 — 예치 분배 UI (클라이언트·서버 공유 타입) */

export type AdminDisputeEscrowSplitFormProps = {
  orderId: string;
  disputeId: string;
  holdGrossWon: number;
  paymentStatus: string;
  settlementStatus: string | null;
  agreedPriceWon: number | null;
};

export type AdminDisputeEscrowSplitPanelState =
  | { kind: "split_form"; form: AdminDisputeEscrowSplitFormProps }
  | { kind: "completed"; orderId: string | null; message: string; paymentStatus: string | null }
  | { kind: "no_hold"; orderId: string | null; message: string; paymentStatus: string | null }
  | { kind: "unavailable"; message: string };
