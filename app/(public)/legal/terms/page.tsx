import Link from "next/link";
import { PolicyDraftBanner } from "@/components/legal/PolicyDraftBanner";

export default function LegalTermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <PolicyDraftBanner />
      <header>
        <h1 className="text-2xl font-black text-slate-900">이용약관 (운영정책 안내 초안)</h1>
        <p className="mt-2 text-sm text-slate-600">서비스 이용 조건, 계정·콘텐츠 책임, 결제·환불 절차는 별도 정책 페이지와 함께 안내됩니다.</p>
      </header>
      <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
        <li>계정은 본인 명의로만 사용합니다.</li>
        <li>질문방·맞춤의뢰·커뮤니티는 각 영역의 운영 규칙을 따릅니다.</li>
        <li>세특·자소서 등 학교 제출용 문서의 대필·대행은 허용되지 않으며, 소재 정리·구조·문장 피드백 범위로 제한합니다.</li>
        <li>멘토 선택 전 외부 연락처 교환은 허용되지 않습니다.</li>
      </ul>
      <p className="text-sm">
        <Link href="/legal/privacy" className="font-bold text-blue-700 underline">
          개인정보처리방침
        </Link>
      </p>
    </div>
  );
}
