import {
  isOrderRowPaymentConfirmedForMentorWork,
  isOrderRowTerminalForActions,
  normalizedPrimaryOrderStatus,
} from "@/lib/customRequest/orderLifecycleConstants";

export type MentorOrderBrowseTabId = "all" | "dispute" | "billing" | "work" | "delivery" | "revision" | "done";

export function classifyMentorOrderBrowseTab(row: Record<string, unknown>, disputeIds: ReadonlySet<string>): MentorOrderBrowseTabId {
  const id = typeof row.id === "string" ? row.id.trim() : "";
  if (id && disputeIds.has(id)) {
    return "dispute";
  }
  if (!isOrderRowPaymentConfirmedForMentorWork(row)) {
    return "billing";
  }
  if (isOrderRowTerminalForActions(row)) {
    return "done";
  }
  const norm = normalizedPrimaryOrderStatus(row);
  if (norm === "revision_requested") {
    return "revision";
  }
  if (
    norm === "delivered" ||
    norm === "delivered_pending_review" ||
    norm === "waiting_review" ||
    norm === "pending_review" ||
    norm === "in_review" ||
    norm === "delivery_submitted" ||
    norm === "redelivered"
  ) {
    return "delivery";
  }
  return "work";
}
