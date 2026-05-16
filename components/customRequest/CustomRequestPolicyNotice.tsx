import Link from "next/link";
import { PolicyNotice } from "@/components/common/PolicyNotice";

export function CustomRequestPolicyNotice() {
  return (
    <PolicyNotice title="맞춤의뢰 운영 범위">
      <p>
        세특·자소서 등 <strong>학교 제출용 문서의 대필·대행</strong>은 허용되지 않습니다. 소재 정리, 구조·문장 피드백, 코칭 범위로
        요청해 주세요.
      </p>
      <p>
        멘토가 선택되어 거래가 성립하기 전에는 <strong>외부 연락처(카카오, 전화, SNS 등) 교환</strong>을 하지 마세요. 플랫폼
        내 흐름만 사용합니다.
      </p>
      <p className="text-slate-500">
        자동 연락처 탐지·차단은 서버 검증 연동 후 강화 예정입니다. (
        <Link href="/legal/no-offplatform-contact" className="font-bold text-blue-700 underline">
          안내
        </Link>
        )
      </p>
    </PolicyNotice>
  );
}
