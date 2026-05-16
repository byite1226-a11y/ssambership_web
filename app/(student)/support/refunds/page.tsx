import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { EmptyState } from "@/components/common/EmptyState";

export default function StudentSupportRefundsPage() {
  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="고객지원"
      title="환불 요청"
      description="구독·맞춤의뢰·캐시는 서로 다른 정산 체계입니다. 이 화면은 사용자 발 환불 요청을 남기는 UI 자리이며, 저장 API는 아직 연결되어 있지 않습니다."
      ctas={[
        { href: "/legal/refund", label: "환불 정책 안내", tone: "slate" },
        { href: "/support/disputes", label: "분쟁 내역", tone: "blue" },
      ]}
      sections={[]}
      dataPoints={["refunds / payment_refunds 테이블 (미연결)"]}
    >
      <EmptyState
        title="환불 요청 폼은 비활성화되어 있습니다"
        description="실제 금액 변경·PG 환불은 백엔드·운영 절차 없이 이 화면에서 실행되지 않습니다."
      />
      <form className="mt-6 max-w-lg space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-xs font-bold text-slate-700">
          유형
          <select disabled className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            <option>구독 환불</option>
            <option>맞춤의뢰 환불</option>
          </select>
        </label>
        <label className="block text-xs font-bold text-slate-700">
          사유
          <textarea disabled rows={3} className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
        </label>
        <button type="button" disabled className="w-full rounded-lg bg-slate-200 py-2 text-sm font-extrabold text-slate-500 cursor-not-allowed">
          제출 비활성화 (API 없음)
        </button>
      </form>
      <p className="mt-4 text-xs text-slate-500">
        캐시 원장·충전은 <Link href="/wallet/ledger">캐시 원장</Link> 메뉴를 이용해 주세요.
      </p>
    </PageScaffold>
  );
}
