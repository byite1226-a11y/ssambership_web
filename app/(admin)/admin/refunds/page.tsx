import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminDetailPanelSlot } from "@/components/admin/AdminActionPlaceholders";
import { createClient } from "@/lib/supabase/server";
import { loadAdminRefundsList } from "@/lib/admin/adminQueries";

type Row = Record<string, unknown>;

function detailLinkToDispute(row: Row) {
  for (const k of ["dispute_id", "case_id", "caseId", "disputeId"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.length > 0) {
      return { href: `/admin/disputes/${encodeURIComponent(v)}`, label: "분쟁" } as const;
    }
  }
  return null;
}

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminRefundsPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const r = sp.refundId;
  const focusRefundId =
    typeof r === "string" && r
      ? r
      : Array.isArray(r) && r[0] && typeof r[0] === "string"
        ? r[0]
        : null;

  const supabase = await createClient();
  const list = await loadAdminRefundsList(supabase, 30);
  const payCol = list.keyHints.paymentRef;

  return (
    <PageScaffold
      eyebrow="Admin / Refunds"
      title="환불 관리"
      description="refunds(또는 refund_requests) 실제 행. 캐시/원장 UI·트랜잭션은 기존 학생 /wallet·/cash 흐름을 건드리지 않음."
      ctas={[
        { href: "/admin/disputes", label: "분쟁", tone: "blue" },
        { href: "/admin/settlements", label: "정산", tone: "slate" },
        { href: "/admin", label: "대시보드", tone: "slate" },
      ]}
      sections={[
        {
          title: "주문/결제 연결",
          body: payCol ? `FK 후보: ${payCol}` : "payment_id / order_id / intent (스키마 확정)",
          status: payCol ? "connected" : "skeleton",
        },
        { title: "정산 반영", body: "settlement / payouts 차감 (다음).", status: "skeleton" },
      ]}
      emptyState="환불 요청이 없으면 0건. RLS·테이블명이 다르면 상단 오류."
      dataPoints={["refunds", "payments", "subscriptions", "settlements", "notifications", "disputes(후보)"]}
    >
      <div className="space-y-4">
        {focusRefundId ? (
          <p className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-3 text-sm text-indigo-950">
            분쟁 상세·연동에서 열기: 환불 id <code className="font-mono text-indigo-900">{focusRefundId}</code> — 아래 테이블 id 컬럼과 맞는지
            확인하세요.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">환불 요청 목록</span>
          <AdminStatusBadge result={list} />
        </div>
        <AdminRecordTable result={list} getDetailLink={detailLinkToDispute} />
        <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p className="font-extrabold text-slate-800">결제 매칭</p>
            <p className="mt-1">{list.sourceNote}</p>
          </div>
          <AdminDetailPanelSlot />
        </div>
      </div>
    </PageScaffold>
  );
}
