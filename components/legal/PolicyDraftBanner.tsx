/** 법률 확정 문서가 아님을 한 줄로 고지하는 공통 배너 */
export function PolicyDraftBanner() {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-950">
      아래 내용은 <strong className="font-extrabold">서비스 운영 정책 안내 초안</strong>입니다. 법률 자문을 대체하지 않으며, 확정 약관·고지는 별도 공지를 따릅니다.
    </p>
  );
}
