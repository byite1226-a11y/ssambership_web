import { PolicyNotice } from "@/components/common/PolicyNotice";

export function ContactMaskingNotice() {
  return (
    <PolicyNotice title="연락처·플랫폼 외 거래">
      <p>의뢰가 확정되기 전 연락처를 주고받으면 제재 대상이 될 수 있습니다. 메시지는 플랫폼 내에서만 주고받아 주세요.</p>
      <p className="text-slate-500">키워드 탐지·마스킹은 백엔드 규칙이 준비되는 대로 연결합니다.</p>
    </PolicyNotice>
  );
}
