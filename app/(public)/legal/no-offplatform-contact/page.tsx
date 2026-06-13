import Link from "next/link";
import { PolicyDraftBanner } from "@/components/legal/PolicyDraftBanner";

export default function LegalNoOffplatformContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <PolicyDraftBanner />
      <header>
        <h1 className="text-2xl font-black text-slate-900">외부 연락처 교환 금지 (맞춤의뢰)</h1>
        <p className="mt-2 text-sm text-slate-600">멘토가 선택되고 거래가 성립하기 전에는 카카오·전화·SNS 등 외부 연락처 교환을 허용하지 않습니다.</p>
      </header>
      <p className="text-sm leading-relaxed text-slate-700">
        플랫폼 내 메시지와 주문 흐름을 사용해 주세요. 위반 탐지·제재 로직은 백엔드 연동 시 강화됩니다.
      </p>
      <p className="text-sm">
        <Link href="/custom-request" className="font-bold text-blue-700 underline">
          맞춤의뢰 소개
        </Link>
      </p>
    </div>
  );
}
