import {
  orderStatusBadgeLabelForNorm,
  orderStatusUiToneForNorm,
  type OrderStatusUiTone,
  paymentStatusBadgeLabelForRaw,
  paymentStatusUiToneForRaw,
  type PaymentStatusUiTone,
} from "@/lib/customRequest/orderLifecycleConstants";

const ORDER_TONE_CLASS: Record<OrderStatusUiTone, string> = {
  gray: "border-slate-200/90 bg-slate-100 text-slate-800",
  blue: "border-sky-200/90 bg-sky-100 text-sky-900",
  amber: "border-amber-200/90 bg-amber-100 text-amber-950",
  green: "border-emerald-200/90 bg-emerald-100 text-emerald-950",
  orange: "border-orange-200/90 bg-orange-100 text-orange-950",
  red: "border-red-200/90 bg-red-100 text-red-950",
};

const PAY_TONE_CLASS: Record<PaymentStatusUiTone, string> = {
  gray: "border-slate-200/90 bg-slate-100 text-slate-800",
  blue: "border-sky-200/90 bg-sky-100 text-sky-900",
  green: "border-emerald-200/90 bg-emerald-100 text-emerald-950",
  amber: "border-amber-200/90 bg-amber-100 text-amber-950",
  red: "border-red-200/90 bg-red-100 text-red-950",
};

type OrderProps = { /** `normalizedPrimaryOrderStatus` */ norm: string; className?: string };
type PayProps = { /** `payment_status` raw */ paymentRaw: string; className?: string };

/**
 * 맞춤의뢰 주문·주문row 기준 primary 상태(표시 전용, DB 토큰 raw 미노출)
 */
export function OrderStatusBadge({ norm, className = "" }: OrderProps) {
  const n = String(norm).trim().toLowerCase();
  const tone = orderStatusUiToneForNorm(n);
  const label = orderStatusBadgeLabelForNorm(n);
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-tight ${ORDER_TONE_CLASS[tone]} ${className}`.trim()}
    >
      {label}
    </span>
  );
}

export function PaymentStatusBadge({ paymentRaw, className = "" }: PayProps) {
  const s = String(paymentRaw).trim().toLowerCase();
  const tone = paymentStatusUiToneForRaw(s);
  const label = paymentStatusBadgeLabelForRaw(paymentRaw);
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-tight ${PAY_TONE_CLASS[tone]} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
