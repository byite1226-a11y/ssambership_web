export function CustomRequestTrustBanner() {
  return (
    <section
      className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 shadow-sm sm:p-5"
      aria-label="거래 안내"
    >
      <h2 className="text-sm font-extrabold text-slate-900 sm:text-base">안전한 거래를 위해</h2>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm break-words text-slate-700 sm:mt-3">
        <li>시험 부정·대필·표절을 요구하는 일은 정책에 따라 제재될 수 있어요.</li>
        <li>결제·정산·분쟁은 플랫폼 안내대로만 진행해 주세요.</li>
        <li>개인 연락처를 밖에서 주고받는 행위는 제한될 수 있어요.</li>
      </ul>
    </section>
  );
}
