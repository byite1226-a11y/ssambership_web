import Link from "next/link";
import { PolicyDraftBanner } from "@/components/legal/PolicyDraftBanner";

export default function LegalMinorConsentPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <PolicyDraftBanner />
      <header>
        <h1 className="text-2xl font-black text-slate-900">만 14세 미만 보호자 동의 (안내 초안)</h1>
        <p className="mt-2 text-sm text-slate-600">실제 수집·동의 절차는 관련 법령과 내부 정책 확정 후 회원가입·설정 화면에 반영됩니다.</p>
      </header>
      <p className="text-sm leading-relaxed text-slate-700">
        법정대리인 동의 방식·증빙 보관은 백엔드·법무 확정 후 연결됩니다. 현재 이 페이지는 정책 안내만 제공합니다.
      </p>
      <p className="text-sm">
        <Link href="/signup" className="font-bold text-blue-700 underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
