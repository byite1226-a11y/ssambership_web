import Link from "next/link";
import { PolicyDraftBanner } from "@/components/legal/PolicyDraftBanner";

export default function LegalRefundPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <PolicyDraftBanner />
      <header>
        <h1 className="text-2xl font-black text-slate-900">환불 정책 (안내 초안)</h1>
        <p className="mt-2 text-sm text-slate-600">구독·맞춤의뢰·캐시는 서로 다른 결제·정산 체계이며, 환불 가능 조건은 결제 유형별로 달라질 수 있습니다.</p>
      </header>
      <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
        <li>정기 구독: 해지·미이용에 따른 환불은 PG·약관 조건에 따릅니다.</li>
        <li>맞춤의뢰: 분쟁·환불 요청은 주문 상태와 납품 단계에 따라 별도 심사를 거칩니다.</li>
        <li>캐시: 충전·원장 전용이며 맞춤의뢰 대금과 혼동되지 않도록 UI에서 구분합니다.</li>
      </ul>
      <p className="text-sm">
        <Link href="/support/disputes" className="font-bold text-blue-700 underline">
          분쟁·문의 흐름
        </Link>
      </p>
    </div>
  );
}
