import type { SupabaseClient } from "@supabase/supabase-js";
import { loadMentorRecentApplicationsWithPostHints, loadOpenCustomRequestPostsForMentorBrowse } from "@/lib/customRequest/customRequestQueries";
import { fetchMentorCustomRequestOrdersFromPrimaryTable } from "@/lib/home/mentorDashboardQueries";
import { fetchActiveOpenDisputeOrderIdSet } from "@/lib/customRequest/orderDisputeHelpers";
import { classifyMentorOrderBrowseTab } from "@/lib/customRequest/mentorOrderBrowseTabClassify";

export async function fetchMentorWorkspaceCounts(supabase: SupabaseClient, userId: string) {
  const [appliedResp, ordersResp, openResp] = await Promise.all([
    loadMentorRecentApplicationsWithPostHints(supabase, userId, 200),
    fetchMentorCustomRequestOrdersFromPrimaryTable(supabase, userId, 200),
    loadOpenCustomRequestPostsForMentorBrowse(supabase, 200),
  ]);

  const dashOrderIds = ordersResp.error ? [] : ordersResp.rows
    .map((r) => (typeof (r as Record<string, unknown>).id === "string" ? String((r as Record<string, unknown>).id) : ""))
    .filter(Boolean);
    
  const disputeSet = ordersResp.error
    ? new Set<string>()
    : await fetchActiveOpenDisputeOrderIdSet(supabase, dashOrderIds);

  const appliedCount = appliedResp.items.length;
  const appliedPostIds = new Set(
    (appliedResp.items ?? []).map((item) => String(item.postId || "").trim())
  );

  const filteredOpenRows = (openResp.rows ?? []).filter((row) => {
    const id = String((row as Record<string, unknown>).id ?? "").trim();
    return id && !appliedPostIds.has(id);
  });

  const openPoolCount = openResp.status === "ok" ? filteredOpenRows.length : 0;
  
  type Row = Record<string, unknown>;

  const billingCount = ordersResp.error ? 0 : ordersResp.rows.filter((r) => classifyMentorOrderBrowseTab(r as Row, disputeSet) === "billing").length;
  const workCount = ordersResp.error ? 0 : ordersResp.rows.filter((r) => classifyMentorOrderBrowseTab(r as Row, disputeSet) === "work").length;
  const deliveryPendingCount = ordersResp.error ? 0 : ordersResp.rows.filter((r) => classifyMentorOrderBrowseTab(r as Row, disputeSet) === "delivery").length;
  const revisionCount = ordersResp.error ? 0 : ordersResp.rows.filter((r) => classifyMentorOrderBrowseTab(r as Row, disputeSet) === "revision").length;
  const doneCount = ordersResp.error ? 0 : ordersResp.rows.filter((r) => classifyMentorOrderBrowseTab(r as Row, disputeSet) === "done").length;

  return {
    open: openPoolCount,
    applied: appliedCount,
    billing: billingCount,
    work: workCount,
    delivery: deliveryPendingCount,
    revision: revisionCount,
    done: doneCount,
    ordersTotal: billingCount + workCount + deliveryPendingCount + revisionCount,
  };
}
