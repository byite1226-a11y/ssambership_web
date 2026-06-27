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
        <strong>외부 연락처(카카오·전화·SNS 등) 교환</strong>은 금지되며, 적발 시 거래 제한·제재 대상이 됩니다. 모든 메시지와
        거래는 플랫폼 안에서만 진행해 주세요. (
        <Link href="/legal/no-offplatform-contact" className="font-bold text-blue-700 underline">
          안내
        </Link>
        )
      </p>
    </PolicyNotice>
  );
}
